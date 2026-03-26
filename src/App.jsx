import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowRight, Mail, MapPin, ExternalLink, Code, ShoppingCart, Search, Wrench, Send, ChevronDown } from "lucide-react";

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

/* ═══════════════════════════════════════════
   STYLES (CSS-in-JS object)
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
  danger: "#ff4466",
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

@keyframes grain {
  0%, 100% { transform:translate(0,0) }
  10% { transform:translate(-5%,-10%) }
  20% { transform:translate(-15%,5%) }
  30% { transform:translate(7%,-25%) }
  40% { transform:translate(-5%,25%) }
  50% { transform:translate(-15%,10%) }
  60% { transform:translate(15%,0%) }
  70% { transform:translate(0%,15%) }
  80% { transform:translate(3%,35%) }
  90% { transform:translate(-10%,10%) }
}

@keyframes float1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-30px) rotate(8deg)} }
@keyframes float2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(-6deg)} }
@keyframes float3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-40px) rotate(12deg)} }
@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes dash { to { stroke-dashoffset: 0; } }
@keyframes pulseRing { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
@keyframes slideUp { from{opacity:0;transform:translateY(60px)} to{opacity:1;transform:translateY(0)} }
@keyframes slideIn { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)} }
@keyframes scaleIn { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
@keyframes letterPop { from{opacity:0;transform:translateY(100%) rotateX(-80deg)} to{opacity:1;transform:translateY(0) rotateX(0deg)} }
@keyframes widthGrow { from{width:0} to{width:100%} }
@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
`;

/* ═══════════════════════════════════════════
   COMPONENTS
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
  const smooth = useSmoothMouse(0.15);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
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

/* Animated text — each word pops in on scroll */
function TextReveal({ children, as: Tag = "span", style = {}, delay = 0 }) {
  const [ref, visible] = useInView(0.2);
  const words = children.split(" ");
  return (
    <Tag ref={ref} style={{ ...style, display:"flex", flexWrap:"wrap", gap:"0 0.3em", perspective:"600px" }}>
      {words.map((w, i) => (
        <span key={i} style={{
          display:"inline-block", overflow:"hidden",
        }}>
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

/* 3D Tilt Card */
function TiltCard({ children, style = {} }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState("perspective(800px) rotateX(0) rotateY(0)");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMove = useCallback((e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = (x - 0.5) * 20;
    const rotX = (0.5 - y) * 20;
    setTransform(`perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`);
    setGlare({ x: x * 100, y: y * 100, opacity: 0.12 });
  }, []);

  const handleLeave = useCallback(() => {
    setTransform("perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)");
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div ref={ref} className="interactive" onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{
        ...style, transform, position:"relative", overflow:"hidden",
        transition:"transform 0.15s ease-out",
        transformStyle:"preserve-3d",
      }}>
      {children}
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none", borderRadius:"inherit",
        background:`radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}), transparent 60%)`,
        transition:"opacity 0.3s",
      }} />
    </div>
  );
}

/* Magnetic Button */
function MagneticButton({ children, onClick, href, style = {}, variant = "primary" }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = useCallback((e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setOffset({ x: (e.clientX - cx) * 0.3, y: (e.clientY - cy) * 0.3 });
  }, []);

  const handleLeave = useCallback(() => setOffset({ x: 0, y: 0 }), []);

  const base = {
    display:"inline-flex", alignItems:"center", gap:"0.6rem",
    padding:"1rem 2.2rem", borderRadius:"999px",
    fontFamily:V.font2, fontWeight:700, fontSize:"0.95rem",
    textDecoration:"none", border:"none", cursor:"none",
    transform:`translate(${offset.x}px, ${offset.y}px)`,
    transition:"transform 0.25s cubic-bezier(.25,.1,.25,1), box-shadow 0.3s, background 0.3s",
    ...(variant === "primary" ? {
      background:V.accent, color:V.bg,
      boxShadow: offset.x !== 0 ? `0 0 50px ${V.accentGlow}` : `0 0 30px ${V.accentGlow}`,
    } : {
      background:"transparent", color:V.text,
      border:`1px solid ${V.border}`,
    }),
    ...style,
  };

  const Tag = href ? "a" : "button";
  return (
    <Tag ref={ref} href={href} onClick={onClick}
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={base}>
      {children}
    </Tag>
  );
}

/* Floating shapes behind hero */
function FloatingShapes() {
  const y = useScrollY();
  const shapes = useMemo(() => [
    { top:"12%", left:"75%", size:120, color:V.accent, anim:"float1 8s ease-in-out infinite", opacity:0.08, border:true },
    { top:"60%", left:"10%", size:80, color:"#00ccff", anim:"float2 10s ease-in-out infinite", opacity:0.06, border:true },
    { top:"35%", left:"85%", size:200, color:V.accent, anim:"float3 12s ease-in-out infinite", opacity:0.04, border:false },
    { top:"75%", left:"70%", size:60, color:"#ff4466", anim:"float1 7s ease-in-out infinite 1s", opacity:0.06, border:true },
    { top:"20%", left:"30%", size:40, color:"#00ccff", anim:"spin 20s linear infinite", opacity:0.06, border:true },
  ], []);

  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      {shapes.map((s, i) => (
        <div key={i} style={{
          position:"absolute", top:s.top, left:s.left,
          width:s.size, height:s.size,
          borderRadius: i === 4 ? "4px" : "50%",
          transform:`translateY(${y * (0.05 + i * 0.02)}px) rotate(${i === 4 ? y * 0.1 : 0}deg)`,
          ...(s.border
            ? { border:`1.5px solid ${s.color}`, background:"transparent", opacity:s.opacity * 3 }
            : { background:`radial-gradient(circle, ${s.color}, transparent)`, opacity:s.opacity }
          ),
          animation:s.anim,
        }} />
      ))}
      {/* Big glow */}
      <div style={{
        position:"absolute", top:"-20%", right:"-10%",
        width:800, height:800,
        background:`radial-gradient(circle, ${V.accentGlow2} 0%, transparent 65%)`,
        transform:`translateY(${y * 0.08}px)`,
      }} />
    </div>
  );
}

/* Marquee strip */
function MarqueeStrip() {
  const items = ["Webdesign", "◆", "E-commerce", "◆", "Branding", "◆", "SEO", "◆", "UX/UI", "◆", "Development", "◆", "WordPress", "◆", "React", "◆"];
  const doubled = [...items, ...items];
  return (
    <div style={{
      overflow:"hidden", borderTop:`1px solid ${V.border}`, borderBottom:`1px solid ${V.border}`,
      padding:"1.25rem 0", whiteSpace:"nowrap",
    }}>
      <div style={{ display:"inline-flex", gap:"2.5rem", animation:"marquee 25s linear infinite" }}>
        {doubled.map((t, i) => (
          <span key={i} style={{
            fontFamily:V.font1, fontWeight:700, fontSize:"1rem",
            color: t === "◆" ? V.accent : V.muted,
            letterSpacing:"2px", textTransform:"uppercase",
          }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* Stats counter */
function AnimatedCounter({ target, suffix = "", label }) {
  const [ref, visible] = useInView(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);

  return (
    <div ref={ref} style={{ textAlign:"center" }}>
      <div style={{
        fontFamily:V.font1, fontWeight:900, fontSize:"clamp(2.5rem,5vw,4rem)",
        color:V.accent, lineHeight:1,
        opacity: visible ? 1 : 0,
        transition:"opacity 0.5s",
      }}>{count}{suffix}</div>
      <div style={{
        fontFamily:V.font2, color:V.muted, fontSize:"0.9rem", marginTop:"0.5rem",
        fontWeight:500,
      }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTIONS
   ═══════════════════════════════════════════ */

function Navigation() {
  const y = useScrollY();
  const scrolled = y > 50;
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding: scrolled ? "0.9rem 3rem" : "1.4rem 3rem",
      background: scrolled ? "rgba(6,6,11,0.85)" : "transparent",
      backdropFilter: scrolled ? "blur(24px) saturate(1.5)" : "none",
      borderBottom: scrolled ? `1px solid ${V.border}` : "1px solid transparent",
      transition:"all 0.4s cubic-bezier(.25,.1,.25,1)",
    }}>
      <div style={{
        fontFamily:V.font1, fontWeight:900, fontSize:"1.3rem",
        letterSpacing:"-0.5px", color:V.text,
      }}>
        Rogiers<span style={{ color:V.accent }}>.</span>IT
      </div>
      <div style={{ display:"flex", gap:"2.5rem" }}>
        {[["Diensten","#diensten"],["Portfolio","#portfolio"],["Contact","#contact"]].map(([label, href]) => (
          <a key={label} href={href} style={{
            color:V.muted, textDecoration:"none", fontFamily:V.font2,
            fontSize:"0.88rem", fontWeight:600, letterSpacing:"0.3px",
            transition:"color 0.3s",
          }}
          onMouseEnter={e => e.target.style.color = V.accent}
          onMouseLeave={e => e.target.style.color = V.muted}
          >{label}</a>
        ))}
      </div>
    </nav>
  );
}

function Hero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  return (
    <section style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      justifyContent:"center", padding:"8rem 4.5rem 4rem", position:"relative", overflow:"hidden",
    }}>
      <FloatingShapes />

      {/* Availability badge */}
      <div style={{
        display:"inline-flex", alignItems:"center", gap:"0.6rem",
        background:V.accentDim, border:`1px solid rgba(0,255,136,0.15)`,
        color:V.accent, padding:"0.45rem 1.1rem", borderRadius:"999px",
        fontSize:"0.78rem", fontWeight:700, fontFamily:V.font2,
        letterSpacing:"1px", textTransform:"uppercase", width:"fit-content",
        animation: loaded ? "slideUp 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: loaded ? undefined : 0,
      }}>
        <span style={{
          width:8, height:8, borderRadius:"50%", background:V.accent,
          position:"relative",
        }}>
          <span style={{
            position:"absolute", inset:-4, borderRadius:"50%",
            border:`2px solid ${V.accent}`,
            animation:"pulseRing 2s ease-out infinite",
          }} />
        </span>
        Beschikbaar voor projecten
      </div>

      {/* Heading */}
      <div style={{ marginTop:"2rem", position:"relative", zIndex:2 }}>
        <TextReveal as="h1" delay={0.2} style={{
          fontFamily:V.font1, fontWeight:900,
          fontSize:"clamp(3.5rem,9.5vw,8.5rem)", lineHeight:1.02,
          letterSpacing:"-4px", color:V.text,
        }}>Wij bouwen websites die</TextReveal>
        <TextReveal as="h1" delay={0.55} style={{
          fontFamily:V.font1, fontWeight:900,
          fontSize:"clamp(3.5rem,9.5vw,8.5rem)", lineHeight:1.02,
          letterSpacing:"-4px", color:V.accent,
          fontStyle:"italic",
        }}>grenzen verleggen.</TextReveal>
      </div>

      <p style={{
        fontFamily:V.font2, color:V.muted, fontSize:"1.25rem",
        maxWidth:640, marginTop:"2rem", lineHeight:1.8,
        animation: loaded ? "slideUp 0.8s 0.6s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: loaded ? undefined : 0,
      }}>
        Van eerste pixel tot livegang — Rogiers IT Solutions creëert digitale ervaringen die niet snel vergeten worden.
      </p>

      <div style={{
        display:"flex", gap:"1rem", marginTop:"2.8rem",
        animation: loaded ? "slideUp 0.8s 0.75s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: loaded ? undefined : 0,
      }}>
        <MagneticButton href="#contact" variant="primary">
          Start uw project <ArrowRight size={18} />
        </MagneticButton>
        <MagneticButton href="#portfolio" variant="ghost">
          Bekijk ons werk
        </MagneticButton>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position:"absolute", bottom:"2.5rem", left:"50%", transform:"translateX(-50%)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem",
        animation: loaded ? "slideUp 1s 1.2s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: loaded ? undefined : 0,
      }}>
        <span style={{ fontFamily:V.font2, fontSize:"0.7rem", color:V.muted, letterSpacing:"2px", textTransform:"uppercase" }}>
          Scroll
        </span>
        <ChevronDown size={18} color={V.muted} style={{ animation:"float2 2s ease-in-out infinite" }} />
      </div>
    </section>
  );
}

function Stats() {
  const [ref, visible] = useInView(0.2);
  return (
    <div ref={ref} style={{
      display:"grid", gridTemplateColumns:"repeat(3,1fr)",
      gap:"2rem", padding:"5rem 3rem",
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
  const services = [
    { icon:<Code size={26} />, title:"Webdesign & Ontwikkeling", desc:"Pixel-perfecte websites met de nieuwste technologieën. Responsive, snel en gebouwd om te converteren." },
    { icon:<ShoppingCart size={26} />, title:"E-commerce & Webshops", desc:"Professionele verkoopplatformen die omzet genereren. Van productpagina's tot checkout-optimalisatie." },
    { icon:<Search size={26} />, title:"SEO & Performance", desc:"Domineer de zoekresultaten. Razendsnelle laadtijden en strategische optimalisatie voor maximale zichtbaarheid." },
    { icon:<Wrench size={26} />, title:"Onderhoud & Support", desc:"Doorlopend beheer, updates en beveiliging. Uw website draait feilloos terwijl u zich richt op groei." },
  ];

  return (
    <section id="diensten" ref={ref} style={{ padding:"6rem 3rem", position:"relative" }}>
      <div style={{
        animation: visible ? "slideIn 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        <div style={{ fontFamily:V.font1, fontSize:"0.78rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"4px", color:V.accent, marginBottom:"1rem" }}>
          Diensten
        </div>
        <h2 style={{ fontFamily:V.font1, fontWeight:900, fontSize:"clamp(2.2rem,4vw,3.5rem)", letterSpacing:"-2px", color:V.text, marginBottom:"0.75rem" }}>
          Wat wij doen
        </h2>
        <p style={{ fontFamily:V.font2, color:V.muted, fontSize:"1.05rem", maxWidth:560, marginBottom:"3.5rem", lineHeight:1.8 }}>
          Geen standaard templates. Elke oplossing is een op maat gemaakt digitaal meesterwerk.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:"1.5rem" }}>
        {services.map((s, i) => {
          const [cRef, cVis] = useInView(0.15);
          return (
            <TiltCard key={i} style={{
              background:V.bgCard, border:`1px solid ${V.border}`,
              borderRadius:V.radius, padding:"2.5rem 2rem",
              animation: cVis ? `scaleIn 0.6s ${i*0.1}s cubic-bezier(.16,1,.3,1) both` : "none",
              opacity: cVis ? undefined : 0,
            }}>
              <div ref={cRef}>
                <div style={{
                  width:56, height:56, display:"flex", alignItems:"center", justifyContent:"center",
                  background:V.accentDim, borderRadius:14, color:V.accent, marginBottom:"1.5rem",
                }}>
                  {s.icon}
                </div>
                <h3 style={{ fontFamily:V.font1, fontWeight:700, fontSize:"1.2rem", color:V.text, marginBottom:"0.75rem" }}>{s.title}</h3>
                <p style={{ fontFamily:V.font2, color:V.muted, fontSize:"0.92rem", lineHeight:1.75 }}>{s.desc}</p>
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
  const [hovered, setHovered] = useState(null);
  const projects = [
    {
      initials:"AB", name:"AquaBouw NV", desc:"Volledig responsive bedrijfswebsite met projectportfolio en offerte-module.",
      tags:["WordPress","Custom Theme","SEO"], grad:"linear-gradient(135deg,#0a1a3a,#0d2b50)", color:"#4d8dff",
    },
    {
      initials:"VF", name:"VersFlow", desc:"E-commerce platform voor verse producten met real-time voorraadbeheer.",
      tags:["WooCommerce","API","UX Design"], grad:"linear-gradient(135deg,#0a2a1a,#0d3822)", color:V.accent,
    },
    {
      initials:"DK", name:"De Kruidhof", desc:"Stijlvolle one-page website voor een restaurant met reserveringssysteem.",
      tags:["React","Animation","Responsive"], grad:"linear-gradient(135deg,#2a0a2a,#3d0d38)", color:"#d14dff",
    },
  ];

  return (
    <section id="portfolio" ref={ref} style={{
      padding:"6rem 3rem",
      background:`linear-gradient(180deg, ${V.bg} 0%, #080812 100%)`,
    }}>
      <div style={{
        animation: visible ? "slideIn 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        <div style={{ fontFamily:V.font1, fontSize:"0.78rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"4px", color:V.accent, marginBottom:"1rem" }}>
          Portfolio
        </div>
        <h2 style={{ fontFamily:V.font1, fontWeight:900, fontSize:"clamp(2.2rem,4vw,3.5rem)", letterSpacing:"-2px", color:V.text, marginBottom:"0.75rem" }}>
          Recent werk
        </h2>
        <p style={{ fontFamily:V.font2, color:V.muted, fontSize:"1.05rem", maxWidth:560, marginBottom:"3.5rem", lineHeight:1.8 }}>
          Een selectie projecten waar wij trots op zijn. Elk uniek, elk resultaat meetbaar.
        </p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))", gap:"1.5rem" }}>
        {projects.map((p, i) => {
          const [cRef, cVis] = useInView(0.12);
          const isH = hovered === i;
          return (
            <div ref={cRef} key={i} className="interactive"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background:V.bgCard, border:`1px solid ${isH ? p.color+"33" : V.border}`,
                borderRadius:V.radius, overflow:"hidden",
                transform: isH ? "translateY(-8px)" : "translateY(0)",
                boxShadow: isH ? `0 30px 80px rgba(0,0,0,0.4), 0 0 40px ${p.color}11` : "none",
                transition:"all 0.5s cubic-bezier(.25,.1,.25,1)",
                animation: cVis ? `slideUp 0.7s ${i*0.12}s cubic-bezier(.16,1,.3,1) both` : "none",
                opacity: cVis ? undefined : 0,
              }}>
              {/* Thumb */}
              <div style={{
                height:220, position:"relative", overflow:"hidden",
                background:p.grad,
              }}>
                <div style={{
                  width:"100%", height:"100%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:V.font1, fontWeight:900, fontSize:"4rem", letterSpacing:"-3px",
                  color:p.color, opacity: isH ? 0.9 : 0.6,
                  transform: isH ? "scale(1.15) rotate(-2deg)" : "scale(1) rotate(0deg)",
                  transition:"all 0.6s cubic-bezier(.25,.1,.25,1)",
                }}>
                  {p.initials}
                </div>
                {/* Hover overlay */}
                <div style={{
                  position:"absolute", inset:0,
                  background:"rgba(0,0,0,0.5)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  opacity: isH ? 1 : 0,
                  transition:"opacity 0.4s",
                }}>
                  <div style={{
                    width:52, height:52, borderRadius:"50%",
                    background:V.accent, color:V.bg,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transform: isH ? "scale(1)" : "scale(0.5)",
                    transition:"transform 0.4s cubic-bezier(.16,1,.3,1)",
                  }}>
                    <ExternalLink size={22} />
                  </div>
                </div>
              </div>
              {/* Info */}
              <div style={{ padding:"1.75rem" }}>
                <h3 style={{ fontFamily:V.font1, fontWeight:700, fontSize:"1.2rem", color:V.text, marginBottom:"0.5rem" }}>{p.name}</h3>
                <p style={{ fontFamily:V.font2, color:V.muted, fontSize:"0.88rem", lineHeight:1.7, marginBottom:"1rem" }}>{p.desc}</p>
                <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                  {p.tags.map((t, ti) => (
                    <span key={ti} style={{
                      background:V.accentDim, color:V.accent, padding:"0.25rem 0.8rem",
                      borderRadius:"999px", fontSize:"0.72rem", fontWeight:700, fontFamily:V.font2,
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
  const [form, setForm] = useState({ naam:"", email:"", onderwerp:"", bericht:"" });
  const [focused, setFocused] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.naam || !form.email || !form.bericht) return;
    setSubmitted(true);
    setTimeout(() => { setForm({ naam:"", email:"", onderwerp:"", bericht:"" }); setSubmitted(false); }, 4000);
  };

  const inputStyle = (field) => ({
    background:V.bgCard,
    border:`1.5px solid ${focused === field ? V.accent : V.border}`,
    borderRadius:14, padding:"0.95rem 1.2rem",
    color:V.text, fontFamily:V.font2, fontSize:"0.95rem",
    outline:"none",
    transition:"border-color 0.3s, box-shadow 0.3s",
    boxShadow: focused === field ? `0 0 0 4px ${V.accentDim}` : "none",
    width:"100%",
  });

  return (
    <section id="contact" ref={ref} style={{ padding:"6rem 3rem" }}>
      <div style={{
        animation: visible ? "slideIn 0.7s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        <div style={{ fontFamily:V.font1, fontSize:"0.78rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"4px", color:V.accent, marginBottom:"1rem" }}>
          Contact
        </div>
        <h2 style={{ fontFamily:V.font1, fontWeight:900, fontSize:"clamp(2.2rem,4vw,3.5rem)", letterSpacing:"-2px", color:V.text, marginBottom:"0.75rem" }}>
          Klaar om te starten?
        </h2>
        <p style={{ fontFamily:V.font2, color:V.muted, fontSize:"1.05rem", maxWidth:560, marginBottom:"3.5rem", lineHeight:1.8 }}>
          Vertel ons over uw project. Wij nemen binnen 24 uur contact op.
        </p>
      </div>

      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:"4rem", alignItems:"start",
        animation: visible ? "slideUp 0.8s 0.2s cubic-bezier(.16,1,.3,1) both" : "none",
        opacity: visible ? undefined : 0,
      }}>
        {/* Left */}
        <div>
          <h3 style={{ fontFamily:V.font1, fontWeight:800, fontSize:"1.6rem", color:V.text, marginBottom:"1rem", letterSpacing:"-0.5px" }}>
            Laten we samen iets<br />bijzonders creëren.
          </h3>
          <p style={{ fontFamily:V.font2, color:V.muted, lineHeight:1.85, marginBottom:"2.5rem", fontSize:"0.95rem" }}>
            Of het nu gaat om een volledig nieuwe website, een redesign of een webshop — wij denken graag met u mee.
          </p>
          {[
            { icon:<Mail size={20} />, text:"info@rogiersit.be" },
            { icon:<MapPin size={20} />, text:"België" },
          ].map((c, i) => (
            <div key={i} style={{
              display:"flex", alignItems:"center", gap:"1rem", marginBottom:"1.25rem",
            }}>
              <div style={{
                width:48, height:48, display:"flex", alignItems:"center", justifyContent:"center",
                background:V.accentDim, borderRadius:14, color:V.accent, flexShrink:0,
              }}>{c.icon}</div>
              <span style={{ fontFamily:V.font2, color:V.muted, fontSize:"0.95rem" }}>{c.text}</span>
            </div>
          ))}
        </div>

        {/* Right: form */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem" }}>
            <div>
              <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block", letterSpacing:"0.3px" }}>Naam</label>
              <input value={form.naam} onChange={e => setForm({...form,naam:e.target.value})}
                onFocus={() => setFocused("naam")} onBlur={() => setFocused(null)}
                placeholder="Uw volledige naam" style={inputStyle("naam")} />
            </div>
            <div>
              <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block", letterSpacing:"0.3px" }}>E-mail</label>
              <input value={form.email} onChange={e => setForm({...form,email:e.target.value})}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                placeholder="naam@bedrijf.be" style={inputStyle("email")} />
            </div>
          </div>
          <div>
            <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block", letterSpacing:"0.3px" }}>Onderwerp</label>
            <input value={form.onderwerp} onChange={e => setForm({...form,onderwerp:e.target.value})}
              onFocus={() => setFocused("onderwerp")} onBlur={() => setFocused(null)}
              placeholder="Waar gaat uw project over?" style={inputStyle("onderwerp")} />
          </div>
          <div>
            <label style={{ fontFamily:V.font2, fontSize:"0.8rem", fontWeight:700, color:V.muted, marginBottom:"0.4rem", display:"block", letterSpacing:"0.3px" }}>Bericht</label>
            <textarea value={form.bericht} onChange={e => setForm({...form,bericht:e.target.value})}
              onFocus={() => setFocused("bericht")} onBlur={() => setFocused(null)}
              placeholder="Vertel ons meer over uw wensen..." rows={5}
              style={{ ...inputStyle("bericht"), resize:"vertical", minHeight:140 }} />
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginTop:"0.5rem" }}>
            <MagneticButton onClick={handleSubmit} variant="primary">
              Verstuur bericht <Send size={16} />
            </MagneticButton>
            {submitted && (
              <span style={{
                fontFamily:V.font2, color:V.accent, fontSize:"0.88rem", fontWeight:700,
                animation:"slideIn 0.4s cubic-bezier(.16,1,.3,1) both",
              }}>
                ✓ Bedankt! Wij nemen spoedig contact op.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      padding:"2.5rem 3rem", borderTop:`1px solid ${V.border}`,
      display:"flex", justifyContent:"space-between", alignItems:"center",
      fontFamily:V.font2, fontSize:"0.85rem", color:V.muted,
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
