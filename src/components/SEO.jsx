// src/components/SEO.jsx
import { Helmet } from 'react-helmet-async';

export const SEO = ({ 
  title, 
  description, 
  canonical, 
  image = '/og-image.jpg',
  jsonLd = null,
  noIndex = false 
}) => {
  const siteTitle = title ? `${title} | Rogiers IT Solutions` : 'Rogiers IT Solutions';
  const siteDescription = description || 'Freelance WordPress-ontwikkelaar uit Ternat. Maatwerk websites, design voor web & print en custom plugins voor Belgische KMO\'s.';
  const siteUrl = canonical || 'https://yannrogiers.com';
  const siteImage = image.startsWith('http') ? image : `https://yannrogiers.com${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={siteDescription} data-rh="true" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} data-rh="true" />
      <link rel="canonical" href={siteUrl} data-rh="true" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" data-rh="true" />
      <meta property="og:url" content={siteUrl} data-rh="true" />
      <meta property="og:title" content={siteTitle} data-rh="true" />
      <meta property="og:description" content={siteDescription} data-rh="true" />
      <meta property="og:image" content={siteImage} data-rh="true" />
      <meta property="og:locale" content="nl_BE" data-rh="true" />
      <meta property="og:site_name" content="Rogiers IT Solutions" data-rh="true" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" data-rh="true" />
      <meta name="twitter:url" content={siteUrl} data-rh="true" />
      <meta name="twitter:title" content={siteTitle} data-rh="true" />
      <meta name="twitter:description" content={siteDescription} data-rh="true" />
      <meta name="twitter:image" content={siteImage} data-rh="true" />

      {/* Additional SEO */}
      <meta name="keywords" content="WordPress, webdesign, grafisch ontwerp, print design, Ternat, België, KMO, maatwerk, freelance developer" data-rh="true" />
      <meta name="author" content="Yann Rogiers" data-rh="true" />
      <meta name="geo.region" content="BE-VBR" data-rh="true" />
      <meta name="geo.placename" content="Ternat" data-rh="true" />
      
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json" data-rh="true">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;