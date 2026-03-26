import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowRight, Mail, MapPin, ExternalLink, Code, ShoppingCart, Search, Wrench, Send, ChevronDown, Menu, X } from "lucide-react";

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

function useSmoothMouse(speed = 0.12) {
  const mouse = useMousePosition();
  const smooth = useRef({ x: 0, y: 0 });
  const raf = useRef();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const tick = () => {
      smooth.current.x += (mouse.x - smooth.current.x) * speed;
      smooth.current.y += (mouse.y - smooth.current.y) * speed;
      setPos({ x: smooth.current.x, y: smooth.current.y });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [mouse.x, mouse.y, speed]);
  return pos;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return mobile;
}

/* ═══════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════ */

const V = {
  bg: "#06060b",
  bgCard: "#0e0e18",
  bgCardHover: "#151524",
  text: "#e6e6f0",
  muted: "#7a7a96",
  accent: "#00ff88",
  accentDim: "rgba(0,255,136,0.07)",
  accentGlow: "rgba(0,255,136,0.3)",
  accentGlow2: "rgba(0,255,136,0.12)",
  border: "rgba(255,255,255,0.06)",
  radius: "18px",
  font1: "'Outfit', sans-serif",
  font2: "'Plus Jakarta Sans', sans-serif",
};

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { background:${V.bg}; overflow-x:hidden; }
::selection { background:${V.accent}; color:${V.bg}; }

@keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-30px) rotate(8deg)} }
@keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(-6deg)} }
@keyframes float3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-40px) rotate(12deg)} }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes pulseRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
@keyframes slideUp { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideIn { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
@keyframes scaleIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
@keyframes letterPop { from{opacity:0;transform:translateY(100%) rotateX(-80deg)} to{opacity:1;transform:translateY(0) rotateX(0deg)} }
@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
`;

/* ═══════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════ */

function GrainOverlay() {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999, pointerEvents:"none",
      background:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      opacity:0.03,
    }} />
  );
}

function CustomCursor() {
  const isMobile = useIsMobile(1024);
  const smooth = useSmoothMouse(0.15);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (isMobile) return;
    const enter = () => setHovering(true);
    const leave = () => setHovering(false);
    const down = () => setClicking(true);
    const up = () => setClicking(false);
    const els = document.querySelectorAll("a, button, .interactive");
    els.forEach(el => { el.addEventListener("mouseenter", enter); el.addEventListener("mouseleave", leave); });
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      els.forEach(el => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); });
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  });

  if (isMobile) return null;

  const size = hovering ? 56 : clicking ? 12 : 20;
  return (
    <>
      <div style={{
        position:"fixed", left:smooth.x, top:smooth.y,
        width:size, height:size,
        border:`2px solid ${V.accent}`,
        borderRadius:"50%",
        transform:"translate(-50%,-50%)",
        transition:"width 0.35s cubic-bezier(.25,.1,.25,1), height 0.35s cubic-bezier(.25,.1,.25,1), background 0.3s",
        background: hovering ? V.accentDim : "transparent",
        zIndex:10000, pointerEvents:"none",
        mixBlendMode: hovering ? "normal" : "difference",
      }} />
      <style>{`@media(pointer:fine){*{cursor:none !important;}}`}</style>
    </>
  );
}

function ScrollProgress() {
  const y = useScrollY();
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(h > 0 ? (y / h) * 100 : 0);
  }, [y]);
  return (
    <div style={{
      position:"fixed", top:0, left:0, height:3, zIndex:10001,
      width:`${progress}%`,
      background:`linear-gradient(90deg, ${V.accent}, #00ccff)`,
      boxShadow:`0 0 20px ${V.accentGlow}`,
      transition:"width 0.1s linear",
    }} />
  );
}

function TextReveal({ children, as: Tag = "span", style = {}, delay = 0 }) {
  const [ref, visible] = useInView(0.2);
  const words = children.split(" ");
  return (
    <Tag ref={ref} style={{ ...style, display:"flex", flexWrap:"wrap", gap:"0 0.3em", perspective:"600px" }}>
      {words.map((w, i) => (
        <span key={i} style={{ display:"inline-block", overflow:"hidden" }}>
          <span style={{
            display:"inline-block",
            animation: visible ? `letterPop 0.6s ${delay + i * 0.04}s cubic-bezier(.16,1,.3,1) both` : "none",
            opacity: visible ? undefined : 0,
          }}>{w}</span>
        </span>
      ))}
    </Tag>
  );
}

function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const [transform, setTransform] = useState("perspective(800px) rotateX(0) rotateY(0)");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = useCallback((e) => {
    if (isMobile) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTransform(`perspective(800px) rotateX(${(0.5-y)*20}deg) rotateY(${(x-0.5)*20}deg) scale3d(1.03,1.03,1.03)`);
    setGlare({ x: x * 100, y: y * 100, opacity: 0.12 });
  }, [isMobile]);

  const handleLeave = useCallback(() => {
    setTransform("perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)");
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div ref={ref} className="interactive" onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{
        ...style,
        transform: isMobile ? undefined : transform,
        position:"relative", overflow:"hidden",
        transition:"transform 0.15s ease-out",
        transformStyle:"preserve-3d",
      }}>
      {children}
      {!isMobile && <div style={{
        position:"absolute", inset:0, pointerEvents:"none", borderRadius:"inherit",
        background:`radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
      }} />}
    </div>
  );
}

function MagneticButton({ children, onClick, href, style = {}, variant = "primary" }) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e) => {
    if (isMobile) return;
    const rect = ref.current.getBoundingClientRect();
    setOffset({ x: (e.clientX - rect.left - rect.width/2) * 0.3, y: (e.clientY - rect.top - rect.height/2) * 0.3 });
  }, [isMobile]);

  const handleLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  const base = {
    display:"inline-flex", alignItems:"center", gap:"0.6rem",
    padding:"1rem 2.2rem", borderRadius:"999px",
    fontFamily:V.font2, fontWeight:700, fontSize:"0.95rem",
    textDecoration:"none", border:"none",
    transform: isMobile ? undefined : `translate(${offset.x}px, ${offset.y}px)`,
    transition:"transform 0.25s cubic-bezier(.25,.1,.25,1), box-shadow 0.3s, background 0.3s",
    ...(variant === "primary" ? {
      background:V.accent, color:V.bg,
      boxShadow:`0 0 30px ${V.accentGlow}`,
    } : {
      background:"transparent", color:V.text,
      border:`1px solid ${V.border}`,
    }),
    ...style,
  };

  const Tag = href ? "a" : "button";
  return (
    <Tag ref={ref} href={href} onClick={onClick}
      onMouseMove={handleMove} onMouseLeave={handleLeave} style={base}>
      {children}
    </Tag>
  );
}

function FloatingShapes() {
  const y = useScrollY();
  const isMobile = useIsMobile();
  const shapes = useMemo(() => [
    { top:"12%", left:"75%", size:120, color:V.accent, anim:"float1 8s ease-in-out infinite", opacity:0.08, border:true },
    { top:"60%", left:"10%", size:80, color:"#00ccff", anim:"float2 10s ease-in-out infinite", opacity:0.06, border:true },
    { top:"35%", left:"85%", size:200, color:V.accent, anim:"float3 12s ease-in-out infinite", opacity:0.04, border:false },
    { top:"75%", left:"70%", size:60, color:"#ff4466", anim:"float1 7s ease-in-out infinite 1s", opacity:0.06, border:true },
    { top:"20%", left:"30%", size:40, color:"#00ccff", anim:"spin 20s linear infinite", opacity:0.06, border:true },
  ], []);

  const visible = isMobile ? shapes.slice(0, 3) : shapes;

  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      {visible.map((s, i) => (
        <div key={i} style={{
          position:"absolute", top:s.top, left:s.left,
          width: isMobile ? s.size*0.5 : s.size,
          height: isMobile ? s.size*0.5 : s.size,
          borderRadius: i === 4 ? "4px" : "50%",
          transform: isMobile ? undefined : `translateY(${y*(0.05+i*0.02)}px)`,
          ...(s.border
            ? { border:`1.5px solid ${s.color}`, background:"transparent", opacity:s.opacity*3 }
            : { background:`radial-gradient(circle, ${s.color}, transparent)`, opacity:s.opacity }
          ),
          animation:s.anim,
        }} />
      ))}
      <div style={{
        position:"absolute", top:"-20%", right:"-10%",
        width: isMobile ? 350 : 800, height: isMobile ? 350 : 800,
        background:`radial-gradient(circle, ${V.accentGlow2} 0%, transparent 65%)`,
        transform: isMobile ? undefined : `translateY(${y*0.08}px)`,
      }} />
    </div>
  );
}

function MarqueeStrip() {
  const items = ["Webdesign","◆","E-commerce","◆","Branding","◆","SEO","◆","UX/UI","◆","Development","◆","WordPress","◆","React","◆"];
  const doubled = [...items, ...items];
  return (
    <div style={{
      overflow:"hidden", borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.border}`,
      padding:"1rem 0", whiteSpace:"nowrap",
    }}>
      <div style={{ display:"inline-flex", gap:"2rem", animation:"marquee 25s linear infinite" }}>
        {doubled.map((t, i) => (
          <span key={i} style={{
            fontFamily:V.font1, fontWeight:700, fontSize:"0.85rem",
            color: t === "◆" ? V.accent : V.muted,
            letterSpacing:"2px", textTransform:"uppercase",
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "", label }) {
  const [ref, visible] = useInView(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const duration = 2000, start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);
  return (
    <div ref={ref} style={{ textAlign:"center" }}>
      <div style={{
        fontFamily:V.font1, fontWeight:900, fontSize:"clamp(2rem,5vw,4rem)",
        color:V.accent, lineHeight:1, opacity: visible ? 1 : 0, transition:"opacity 0.5s",
      }}>{count}{suffix}</div>
      <div style={{
        fontFamily:V.font2, color:V.muted, fontSize:"clamp(0.78rem,2vw,0.9rem)",
        marginTop:"0.5rem", fontWeight:500,
      }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE SECTIONS
   ═══════════════════════════════════════════ */

function Navigation() {
  const y = useScrollY();
  const isMobile = useIsMobile();
  const scrolled = y > 50;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { if (menuOpen && y) setMenuOpen(false); }, [y]);

  const links = [["Diensten","#diensten"],["Portfolio","#portfolio"],["Contact","#contact"]];

  return (
    <>
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding: isMobile ? "0.85rem 1.25rem" : (scrolled ? "0.9rem 3rem" : "1.4rem 3rem"),
        background: scrolled || menuOpen ? "rgba(6,6,11,0.92)" : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(24px) saturate(1.5)" : "none",
        borderBottom: scrolled ? `1px solid ${V.border}` : "1px solid transparent",
        transition:"all 0.4s cubic-bezier(.25,.1,.25,1)",
      }}>
        <div style={{
          fontFamily:V.font1, fontWeight:900, fontSize: isMobile ? "1.1rem" : "1.3rem",
          letterSpacing:"-0.5px", color:V.text,
        }}>
          Rogiers<span style={{ color:V.accent }}>.</span>IT
        </div>
        {isMobile ? (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background:"none", border:"none", color:V.text, padding:4,
          }}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        ) : (
          <div style={{ display:"flex", gap:"2.5rem" }}>
            {links.map(([label, href]) => (
              <a key={label} href={href} style={{
                color:V.muted, textDecoration:"none", fontFamily:V.font2,
                fontSize:"0.88rem", fontWeight:600, transition:"color 0.3s",
              }}
              onMouseEnter={e => e.target.style.color = V.accent}
              onMouseLeave={e => e.target.style.color = V.muted}
              >{label}</a>
            ))}
          </div>
        )}
      </nav>

      {/* Mobile fullscreen menu */}
      {isMobile && (
        <div style={{
          position:"fixed", inset:0, zIndex:99,
          background:"rgba(6,6,11,0.97)", backdropFilter:"blur(30px)",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"2.5rem",
          opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none",
          transition:"opacity 0.35s ease",
        }}>
          {links.map(([label, href], i) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{
              color:V.text, textDecoration:"none", fontFamily:V.font1,
              fontSize:"2rem", fontWeight:800, letterSpacing:"-1px",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(20px)",
              transition:`all 0.4s ${i*0.08}s cubic-bezier(.16,1,.3,1)`,
            }}>{label}</a>
          ))}
        </div>
      )}
    </>
  );
}

function Hero() {
  const [loaded, setLoaded] = useState(false);
  const isMobile = useIsMobile();
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const px = isMobile ? "1.25rem" : "4.5rem";

  return (
    <section style={{
      minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center",
      padding: isMobile ? `6.5rem ${px} 3rem` : `8rem ${px} 4rem`,
      position:"relative", overflow:"hidden",
    }}>
      <FloatingShapes />

      <div style={{
        display:"inline-flex", alignItems:"center", gap:"0.5rem",
        background:V.accentDim, border:`1px solid rgba(0,255,136,0.15)`,
        color:V.accent, padding: isMobile ? "0.35rem 0.8rem" : "0.45rem 1.1rem",
        borderRadius:"999px",
        fontSize: isMobile ? "0.62rem" : "0.78rem",
        fontWeight:700, fontFamily:V.font2,
        letterSpacing:"1px", textTransform:"uppercase", width:"fit-content",
        animation: loaded ? "slideUp 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: loaded ? undefined : 0,
      }}>
        <span style={{ width:7, height:7, borderRadius:"50%", background:V.accent, position:"relative", flexShrink:0 }}>
          <span style={{
            position:"absolute", inset:-4, borderRadius:"50%",
            border:`2px solid ${V.accent}`, animation:"pulseRing 2s ease-out infinite",
          }} />
        </span>
        Beschikbaar voor projecten
      </div>

      <div style={{ marginTop: isMobile ? "1.25rem" : "2rem", position:"relative", zIndex:2 }}>
        <TextReveal as="h1" delay={0.2} style={{
          fontFamily:V.font1, fontWeight:900,
          fontSize: isMobile ? "clamp(2rem,10vw,3.2rem)" : "clamp(3.5rem,9.5vw,8.5rem)",
          lineHeight: isMobile ? 1.08 : 1.02,
          letterSpacing: isMobile ? "-1px" : "-4px",
          color:V.text,
        }}>Wij bouwen websites die</TextReveal>
        <TextReveal as="h1" delay={0.55} style={{
          fontFamily:V.font1, fontWeight:900,
          fontSize: isMobile ? "clamp(2rem,10vw,3.2rem)" : "clamp(3.5rem,9.5vw,8.5rem)",
          lineHeight: isMobile ? 1.08 : 1.02,
          letterSpacing: isMobile ? "-1px" : "-4px",
          color:V.accent, fontStyle:"italic",
        }}>grenzen verleggen.</TextReveal>
      </div>

      <p style={{
        fontFamily:V.font2, color:V.muted,
        fontSize: isMobile ? "0.95rem" : "1.25rem",
        maxWidth: isMobile ? "100%" : 640,
        marginTop: isMobile ? "1.25rem" : "2rem", lineHeight:1.8,
        animation: loaded ? "slideUp 0.8s 0.6s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: loaded ? undefined : 0,
      }}>
        Van eerste pixel tot livegang — Rogiers IT Solutions creëert digitale ervaringen die niet snel vergeten worden.
      </p>

      <div style={{
        display:"flex", flexDirection: isMobile ? "column" : "row",
        gap:"1rem", marginTop: isMobile ? "1.75rem" : "2.8rem",
        animation: loaded ? "slideUp 0.8s 0.75s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: loaded ? undefined : 0,
      }}>
        <MagneticButton href="#contact" variant="primary" style={isMobile ? { justifyContent:"center" } : {}}>
          Start uw project <ArrowRight size={18} />
        </MagneticButton>
        <MagneticButton href="#portfolio" variant="ghost" style={isMobile ? { justifyContent:"center" } : {}}>
          Bekijk ons werk
        </MagneticButton>
      </div>

      {!isMobile && (
        <div style={{
          position:"absolute", bottom:"2.5rem", left:"50%", transform:"translateX(-50%)",
          display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem",
          animation: loaded ? "slideUp 1s 1.2s cubic-bezier(.16,1,.3,1) both" : "none",
          opacity: loaded ? undefined : 0,
        }}>
          <span style={{ fontFamily:V.font2, fontSize:"0.7rem", color:V.muted, letterSpacing:"2px", textTransform:"uppercase" }}>Scroll</span>
          <ChevronDown size={18} color={V.muted} style={{ animation:"float2 2s ease-in-out infinite" }} />
        </div>
      )}
    </section>
  );
}

function Stats() {
  const isMobile = useIsMobile();
  return (
    <div style={{
      display:"grid",
      gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3,1fr)",
      gap: isMobile ? "1rem" : "2rem",
      padding: isMobile ? "3rem 1.25rem" : "5rem 3rem",
      borderBottom:`1px solid ${V.border}`,
    }}>
      <AnimatedCounter target={50} suffix="+" label="Projecten opgeleverd" />
      <AnimatedCounter target={98} suffix="%" label="Klanttevredenheid" />
      <AnimatedCounter target={5} suffix=" jaar" label="Ervaring" />
    </div>
  );
}

function Services() {
  const [ref, visible] = useInView(0.1);
  const isMobile = useIsMobile();
  const px = isMobile ? "1.25rem" : "3rem";
  const services = [
    { icon:<Code size={24} />, title:"Webdesign & Ontwikkeling", desc:"Pixel-perfecte websites met de nieuwste technologieën. Responsive, snel en gebouwd om te converteren." },
    { icon:<ShoppingCart size={24} />, title:"E-commerce & Webshops", desc:"Professionele verkoopplatformen die omzet genereren. Van productpagina's tot checkout-optimalisatie." },
    { icon:<Search size={24} />, title:"SEO & Performance", desc:"Domineer de zoekresultaten. Razendsnelle laadtijden en strategische optimalisatie voor maximale zichtbaarheid." },
    { icon:<Wrench size={24} />, title:"Onderhoud & Support", desc:"Doorlopend beheer, updates en beveiliging. Uw website draait feilloos terwijl u zich richt op groei." },
  ];

  return (
    <section id="diensten" ref={ref} style={{ padding:`${isMobile?"3.5rem":"6rem"} ${px}` }}>
      <div style={{
        animation: visible ? "slideIn 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        <div style={{ fontFamily:V.font1, fontSize:"0.78rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"4px", color:V.accent, marginBottom:"1rem" }}>Diensten</div>
        <h2 style={{ fontFamily:V.font1, fontWeight:900, fontSize:"clamp(1.8rem,4vw,3.5rem)", letterSpacing:"-2px", color:V.text, marginBottom:"0.75rem" }}>Wat wij doen</h2>
        <p style={{ fontFamily:V.font2, color:V.muted, fontSize: isMobile ? "0.92rem" : "1.05rem", maxWidth:560, marginBottom: isMobile ? "2rem" : "3.5rem", lineHeight:1.8 }}>
          Geen standaard templates. Elke oplossing is een op maat gemaakt digitaal meesterwerk.
        </p>
      </div>
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
        gap:"1.25rem",
      }}>
        {services.map((s, i) => {
          const [cRef, cVis] = useInView(0.15);
          return (
            <TiltCard key={i} style={{
              background:V.bgCard, border:`1px solid ${V.border}`,
              borderRadius:V.radius, padding: isMobile ? "1.75rem 1.5rem" : "2.5rem 2rem",
              animation: cVis ? `scaleIn 0.6s ${i*0.08}s cubic-bezier(.16,1,.3,1) both` : "none",
              opacity: cVis ? undefined : 0,
            }}>
              <div ref={cRef}>
                <div style={{
                  width:50, height:50, display:"flex", alignItems:"center", justifyContent:"center",
                  background:V.accentDim, borderRadius:14, color:V.accent, marginBottom:"1.25rem",
                }}>{s.icon}</div>
                <h3 style={{ fontFamily:V.font1, fontWeight:700, fontSize:"1.1rem", color:V.text, marginBottom:"0.6rem" }}>{s.title}</h3>
                <p style={{ fontFamily:V.font2, color:V.muted, fontSize:"0.88rem", lineHeight:1.75 }}>{s.desc}</p>
              </div>
            </TiltCard>
          );
        })}
      </div>
    </section>
  );
}

function Portfolio() {
  const [ref, visible] = useInView(0.1);
  const isMobile = useIsMobile();
  const [hovered, setHovered] = useState(null);
  const px = isMobile ? "1.25rem" : "3rem";
  const projects = [
    { initials:"AB", name:"AquaBouw NV", desc:"Volledig responsive bedrijfswebsite met projectportfolio en offerte-module.", tags:["WordPress","Custom Theme","SEO"], grad:"linear-gradient(135deg,#0a1a3a,#0d2b50)", color:"#4d8dff" },
    { initials:"VF", name:"VersFlow", desc:"E-commerce platform voor verse producten met real-time voorraadbeheer.", tags:["WooCommerce","API","UX Design"], grad:"linear-gradient(135deg,#0a2a1a,#0d3822)", color:V.accent },
    { initials:"DK", name:"De Kruidhof", desc:"Stijlvolle one-page website voor een restaurant met reserveringssysteem.", tags:["React","Animation","Responsive"], grad:"linear-gradient(135deg,#2a0a2a,#3d0d38)", color:"#d14dff" },
  ];

  return (
    <section id="portfolio" ref={ref} style={{
      padding:`${isMobile?"3.5rem":"6rem"} ${px}`,
      background:`linear-gradient(180deg, ${V.bg} 0%, #080812 100%)`,
    }}>
      <div style={{
        animation: visible ? "slideIn 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        <div style={{ fontFamily:V.font1, fontSize:"0.78rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"4px", color:V.accent, marginBottom:"1rem" }}>Portfolio</div>
        <h2 style={{ fontFamily:V.font1, fontWeight:900, fontSize:"clamp(1.8rem,4vw,3.5rem)", letterSpacing:"-2px", color:V.text, marginBottom:"0.75rem" }}>Recent werk</h2>
        <p style={{ fontFamily:V.font2, color:V.muted, fontSize: isMobile ? "0.92rem" : "1.05rem", maxWidth:560, marginBottom: isMobile ? "2rem" : "3.5rem", lineHeight:1.8 }}>
          Een selectie projecten waar wij trots op zijn. Elk uniek, elk resultaat meetbaar.
        </p>
      </div>
      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
        gap:"1.25rem",
      }}>
        {projects.map((p, i) => {
          const [cRef, cVis] = useInView(0.12);
          const isH = hovered === i;
          return (
            <div ref={cRef} key={i} className="interactive"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              style={{
                background:V.bgCard, border:`1px solid ${isH ? p.color+"33" : V.border}`,
                borderRadius:V.radius, overflow:"hidden",
                transform: !isMobile && isH ? "translateY(-8px)" : undefined,
                boxShadow: isH ? `0 20px 60px rgba(0,0,0,0.4)` : "none",
                transition:"all 0.5s cubic-bezier(.25,.1,.25,1)",
                animation: cVis ? `slideUp 0.7s ${i*0.1}s cubic-bezier(.16,1,.3,1) both` : "none",
                opacity: cVis ? undefined : 0,
              }}>
              <div style={{
                height: isMobile ? 160 : 220, position:"relative", overflow:"hidden", background:p.grad,
              }}>
                <div style={{
                  width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:V.font1, fontWeight:900, fontSize: isMobile ? "2.8rem" : "4rem",
                  letterSpacing:"-3px", color:p.color, opacity: isH ? 0.9 : 0.6,
                  transform: !isMobile && isH ? "scale(1.15) rotate(-2deg)" : undefined,
                  transition:"all 0.6s cubic-bezier(.25,.1,.25,1)",
                }}>{p.initials}</div>
                {!isMobile && (
                  <div style={{
                    position:"absolute", inset:0, background:"rgba(0,0,0,0.5)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    opacity: isH ? 1 : 0, transition:"opacity 0.4s",
                  }}>
                    <div style={{
                      width:52, height:52, borderRadius:"50%", background:V.accent, color:V.bg,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transform: isH ? "scale(1)" : "scale(0.5)",
                      transition:"transform 0.4s cubic-bezier(.16,1,.3,1)",
                    }}><ExternalLink size={22} /></div>
                  </div>
                )}
              </div>
              <div style={{ padding: isMobile ? "1.25rem" : "1.75rem" }}>
                <h3 style={{ fontFamily:V.font1, fontWeight:700, fontSize:"1.1rem", color:V.text, marginBottom:"0.45rem" }}>{p.name}</h3>
                <p style={{ fontFamily:V.font2, color:V.muted, fontSize:"0.85rem", lineHeight:1.7, marginBottom:"0.85rem" }}>{p.desc}</p>
                <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                  {p.tags.map((t, ti) => (
                    <span key={ti} style={{
                      background:V.accentDim, color:V.accent, padding:"0.2rem 0.7rem",
                      borderRadius:"999px", fontSize:"0.7rem", fontWeight:700, fontFamily:V.font2,
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Contact() {
  const [ref, visible] = useInView(0.1);
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ naam:"", email:"", onderwerp:"", bericht:"" });
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const px = isMobile ? "1.25rem" : "3rem";

  const handleSubmit = () => {
    if (!form.naam || !form.email || !form.bericht) return;
    setSubmitted(true);
    setTimeout(() => { setForm({ naam:"", email:"", onderwerp:"", bericht:"" }); setSubmitted(false); }, 4000);
  };

  const inputStyle = (field) => ({
    background:V.bgCard,
    border:`1.5px solid ${focused === field ? V.accent : V.border}`,
    borderRadius:14, padding:"0.95rem 1.2rem",
    color:V.text, fontFamily:V.font2,
    fontSize: isMobile ? "16px" : "0.95rem", // 16px prevents iOS zoom
    outline:"none",
    transition:"border-color 0.3s, box-shadow 0.3s",
    boxShadow: focused === field ? `0 0 0 4px ${V.accentDim}` : "none",
    width:"100%",
  });

  return (
    <section id="contact" ref={ref} style={{ padding:`${isMobile?"3.5rem":"6rem"} ${px}` }}>
      <div style={{
        animation: visible ? "slideIn 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        <div style={{ fontFamily:V.font1, fontSize:"0.78rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"4px", color:V.accent, marginBottom:"1rem" }}>Contact</div>
        <h2 style={{ fontFamily:V.font1, fontWeight:900, fontSize:"clamp(1.8rem,4vw,3.5rem)", letterSpacing:"-2px", color:V.text, marginBottom:"0.75rem" }}>Klaar om te starten?</h2>
        <p style={{ fontFamily:V.font2, color:V.muted, fontSize: isMobile ? "0.92rem" : "1.05rem", maxWidth:560, marginBottom: isMobile ? "2rem" : "3.5rem", lineHeight:1.8 }}>
          Vertel ons over uw project. Wij nemen binnen 24 uur contact op.
        </p>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1.3fr",
        gap: isMobile ? "2rem" : "4rem", alignItems:"start",
        animation: visible ? "slideUp 0.8s 0.2s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        <div>
          <h3 style={{ fontFamily:V.font1, fontWeight:800, fontSize: isMobile ? "1.3rem" : "1.6rem", color:V.text, marginBottom:"1rem", letterSpacing:"-0.5px" }}>
            Laten we samen iets bijzonders creëren.
          </h3>
          <p style={{ fontFamily:V.font2, color:V.muted, lineHeight:1.85, marginBottom:"2rem", fontSize:"0.92rem" }}>
            Of het nu gaat om een volledig nieuwe website, een redesign of een webshop — wij denken graag met u mee.
          </p>
          {[
            { icon:<Mail size={20} />, text:"info@rogiersit.be" },
            { icon:<MapPin size={20} />, text:"België" },
          ].map((c, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem" }}>
              <div style={{
                width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center",
                background:V.accentDim, borderRadius:12, color:V.accent, flexShrink:0,
              }}>{c.icon}</div>
              <span style={{ fontFamily:V.font2, color:V.muted, fontSize:"0.92rem" }}>{c.text}</span>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:"1.25rem" }}>
            <div>
              <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block" }}>Naam</label>
              <input value={form.naam} onChange={e => setForm({...form,naam:e.target.value})}
                onFocus={() => setFocused("naam")} onBlur={() => setFocused(null)}
                placeholder="Uw volledige naam" style={inputStyle("naam")} />
            </div>
            <div>
              <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block" }}>E-mail</label>
              <input value={form.email} onChange={e => setForm({...form,email:e.target.value})}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                placeholder="naam@bedrijf.be" style={inputStyle("email")} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block" }}>Onderwerp</label>
            <input value={form.onderwerp} onChange={e => setForm({...form,onderwerp:e.target.value})}
              onFocus={() => setFocused("onderwerp")} onBlur={() => setFocused(null)}
              placeholder="Waar gaat uw project over?" style={inputStyle("onderwerp")} />
          </div>
          <div>
            <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block" }}>Bericht</label>
            <textarea value={form.bericht} onChange={e => setForm({...form,bericht:e.target.value})}
              onFocus={() => setFocused("bericht")} onBlur={() => setFocused(null)}
              placeholder="Vertel ons meer over uw wensen..." rows={5}
              style={{ ...inputStyle("bericht"), resize:"vertical", minHeight:120 }} />
          </div>
          <div style={{
            display:"flex", flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center", gap:"1rem", marginTop:"0.5rem",
          }}>
            <MagneticButton onClick={handleSubmit} variant="primary" style={isMobile ? { justifyContent:"center" } : {}}>
              Verstuur bericht <Send size={16} />
            </MagneticButton>
            {submitted && (
              <span style={{
                fontFamily:V.font2, color:V.accent, fontSize:"0.88rem", fontWeight:700,
                animation:"slideIn 0.4s cubic-bezier(.16,1,.3,1) both",
                textAlign: isMobile ? "center" : "left",
              }}>✓ Bedankt! Wij nemen spoedig contact op.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer style={{
      padding: isMobile ? "1.75rem 1.25rem" : "2.5rem 3rem",
      borderTop:`1px solid ${V.border}`,
      display:"flex", flexDirection: isMobile ? "column" : "row",
      justifyContent:"space-between", alignItems:"center",
      gap: isMobile ? "0.5rem" : 0,
      fontFamily:V.font2, fontSize:"0.85rem", color:V.muted,
      textAlign: isMobile ? "center" : undefined,
    }}>
      <span>© 2026 Rogiers IT Solutions</span>
      <span>Gebouwd met <span style={{ color:V.accent }}>♥</span> in België</span>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */

export default function App() {
  return (
    <div style={{ background:V.bg, color:V.text, minHeight:"100vh", position:"relative" }}>
      <style>{globalCSS}</style>
      <GrainOverlay />
      <CustomCursor />
      <ScrollProgress />
      <Navigation />
      <Hero />
      <MarqueeStrip />
      <Stats />
      <Services />
      <Portfolio />
      <Contact />
      <Footer />
    </div>
  );
}
