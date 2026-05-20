/**
 * Build en-US locale pages from templates and root gateway HTML.
 * The site is English-only; templates/*-lt.html files are kept as the build pipeline
 * source from which English output is generated via translation replacements.
 * Usage (GitHub Pages subpath): BASE_PATH=/personalas/ SITE_ORIGIN=https://ditreneris.github.io node scripts/build-locale-pages.js
 * Usage (Vercel / custom domain root): SITE_ORIGIN=https://promptanatomy.help node scripts/build-locale-pages.js
 * Optional override: SITE_PUBLIC_BASE=https://preview.vercel.app (full public origin, no trailing slash)
 * Source: templates/index-lt.html, templates/privacy.html, templates/privacy-gateway.html
 * Output: en/index.html, en/privacy.html, privacy.html (gateway), robots.txt, sitemap.xml
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SITE_ORIGIN = (process.env.SITE_ORIGIN || 'https://promptanatomy.help').replace(/\/+$/, '');
const rawBase = process.env.BASE_PATH || '';
const BASE_PATH = rawBase ? rawBase.replace(/\/*$/, '') + '/' : '';
const SITE_PUBLIC_BASE = (process.env.SITE_PUBLIC_BASE || '').trim().replace(/\/+$/, '');

/** Full public site base URL with trailing slash (canonical / OG / sitemap). */
function absoluteBaseSlash() {
  if (SITE_PUBLIC_BASE) {
    return SITE_PUBLIC_BASE + '/';
  }
  if (BASE_PATH) {
    const seg = BASE_PATH.replace(/^\/+|\/+$/g, '') + '/';
    return SITE_ORIGIN + '/' + seg;
  }
  return SITE_ORIGIN + '/';
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function write(file, content) {
  const outPath = path.join(ROOT, file);
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, content, 'utf8');
}

const FAVICON_LINK_BLOCK_RE =
  /\s*<link rel="icon" href="[^"]*favicon\.ico"[^>]*>\s*<link rel="icon" type="image\/svg\+xml" href="[^"]*favicon\.svg">\s*<link rel="apple-touch-icon" href="[^"]*apple-touch-icon\.png">/;

/** Favicon links (site-root assets). baseHref: absoluteBaseSlash() or relative prefix e.g. ../ */
function buildFaviconLinkTags(baseHref) {
  const b = baseHref || '';
  return [
    '<link rel="icon" href="' + escapeHtmlAttr(b + 'favicon.ico') + '" sizes="any">',
    '<link rel="icon" type="image/svg+xml" href="' + escapeHtmlAttr(b + 'favicon.svg') + '">',
    '<link rel="apple-touch-icon" href="' + escapeHtmlAttr(b + 'apple-touch-icon.png') + '">',
  ].join('\n    ');
}

function injectFaviconLinks(html, baseHref) {
  const block = buildFaviconLinkTags(baseHref);
  if (html.includes('rel="apple-touch-icon"')) {
    return html.replace(FAVICON_LINK_BLOCK_RE, '\n    ' + block);
  }
  return html.replace(/<link rel="icon" type="image\/svg\+xml" href="[^"]*favicon\.svg">/, block);
}

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractMetaDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? m[1].trim() : '';
}

function loadSot() {
  const raw = read('config/sot.json');
  let sot;
  try {
    sot = JSON.parse(raw);
  } catch (e) {
    throw new Error('config/sot.json is invalid JSON: ' + e.message);
  }
  validateSot(sot);
  return sot;
}

function validateSot(sot) {
  if (!sot.product || !sot.product.contactEmail) {
    throw new Error('config/sot.json: product.contactEmail is required');
  }
  const addr = sot.product && sot.product.businessAddress;
  const addrRequired = ['name', 'street', 'city', 'region', 'postalCode', 'country'];
  if (!addr) {
    throw new Error('config/sot.json: product.businessAddress is required (CAN-SPAM compliance)');
  }
  for (const key of addrRequired) {
    if (!addr[key] || typeof addr[key] !== 'string') {
      throw new Error('config/sot.json: product.businessAddress.' + key + ' is required');
    }
  }
  if (!sot.legal || !sot.legal.metaDescription) {
    throw new Error('config/sot.json: legal.metaDescription is required');
  }
  if (!sot.positioning || sot.positioning.primaryKpi !== 'pdf') {
    throw new Error('config/sot.json: positioning.primaryKpi must be "pdf"');
  }
  if (!sot.brand || !sot.brand.publicName) {
    throw new Error('config/sot.json: brand.publicName is required');
  }
  const m = sot.marketing;
  if (!m || !m.seo || !m.seo.title || !m.seo.metaDescription || !m.seo.ogTitle) {
    throw new Error('config/sot.json: marketing.seo.title, metaDescription, ogTitle are required');
  }
  const h = m.hero;
  if (!h || !h.headline || !h.subhead || !h.primaryCtaLabel || !h.primaryCtaHref) {
    throw new Error('config/sot.json: marketing.hero headline, subhead, primaryCtaLabel, primaryCtaHref are required');
  }
  if (!m.pdfSection || !m.pdfSection.title || !m.pdfSection.lede) {
    throw new Error('config/sot.json: marketing.pdfSection.title and lede are required');
  }
  validateExpertScenarios(m.pdfSection);
  if (!m.workflowOverview || !m.workflowOverview.title) {
    throw new Error('config/sot.json: marketing.workflowOverview.title is required');
  }
}

function validateExpertScenarios(pdfSection) {
  const es = pdfSection && pdfSection.expertScenarios;
  if (!es) {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios is required (3 illustrative cards)');
  }
  if (!es.title || typeof es.title !== 'string') {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios.title is required');
  }
  if (!es.disclaimer || typeof es.disclaimer !== 'string') {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios.disclaimer is required (illustrative scenarios — not testimonials)');
  }
  if (!Array.isArray(es.cards) || es.cards.length !== 3) {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios.cards must contain exactly 3 items');
  }
  const requiredCardKeys = ['approach', 'quote', 'name', 'role', 'region'];
  es.cards.forEach(function (card, idx) {
    if (!card || typeof card !== 'object') {
      throw new Error('config/sot.json: expertScenarios.cards[' + idx + '] must be an object');
    }
    for (const key of requiredCardKeys) {
      if (!card[key] || typeof card[key] !== 'string') {
        throw new Error('config/sot.json: expertScenarios.cards[' + idx + '].' + key + ' is required');
      }
    }
  });
}

function getSeoMetaDescription(sot) {
  return (sot.marketing && sot.marketing.seo && sot.marketing.seo.metaDescription) || sot.legal.metaDescription;
}

function getSeoTitle(sot) {
  return (sot.marketing && sot.marketing.seo && sot.marketing.seo.title) || 'US HR hiring PDF guides + free AI prompts';
}

function getSeoOgTitle(sot) {
  return (sot.marketing && sot.marketing.seo && sot.marketing.seo.ogTitle) || getSeoTitle(sot);
}

function isStripeLinkPlaceholder(url) {
  if (!url || typeof url !== 'string') return true;
  return url.includes('REPLACE_') || !/^https:\/\/buy\.stripe\.com\//.test(url);
}

function assertNoStripePlaceholders(sot) {
  const beginner = sot.pdfGuides && sot.pdfGuides.beginner && sot.pdfGuides.beginner.stripePaymentLink;
  const advanced = sot.pdfGuides && sot.pdfGuides.advanced && sot.pdfGuides.advanced.stripePaymentLink;
  const bad = [];
  if (isStripeLinkPlaceholder(beginner)) bad.push('pdfGuides.beginner.stripePaymentLink');
  if (isStripeLinkPlaceholder(advanced)) bad.push('pdfGuides.advanced.stripePaymentLink');
  const bundle = sot.pdfGuides && sot.pdfGuides.bundle && sot.pdfGuides.bundle.stripePaymentLink;
  if (isStripeLinkPlaceholder(bundle)) bad.push('pdfGuides.bundle.stripePaymentLink');
  if (!bad.length) return;
  const msg =
    'Stripe payment links still use placeholders in config/sot.json: ' +
    bad.join(', ') +
    '. Set real https://buy.stripe.com/... URLs before promotion.';
  if (process.env.REQUIRE_STRIPE_LINKS === '1') {
    throw new Error(msg);
  }
  console.warn('WARN: ' + msg);
}

function escapeHtmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Compose the canonical street line ("1311 Park St, Unit #654" or just street when no unit). */
function composeStreetLine(addr) {
  return addr.unit ? addr.street + ', ' + addr.unit : addr.street;
}

/** Compose the canonical city/region/postal/country line ("Alameda, CA 94501, United States"). */
function composeLocalityLine(addr) {
  const left = addr.city + ', ' + addr.region + ' ' + addr.postalCode;
  return addr.countryName ? left + ', ' + addr.countryName : left;
}

/** Semantic <address> block injected into footer + privacy via {{SOT_BUSINESS_ADDRESS}}. */
function renderAddressBlock(sot) {
  const addr = sot.product.businessAddress;
  return [
    '<address class="business-address" aria-label="Business postal address">',
    '<strong>' + escapeHtmlText(addr.name) + '</strong><br>',
    escapeHtmlText(composeStreetLine(addr)) + '<br>',
    escapeHtmlText(composeLocalityLine(addr)),
    '</address>',
  ].join('');
}

/**
 * Inline mailto link inside FAQ answer text. Mirrors generator.js linkifyContactEmail
 * so build-time FAQ HTML matches the runtime fallback exactly.
 */
function linkifyFaqEmail(text, email) {
  if (!text) return '';
  const safeText = escapeHtmlText(text);
  if (!email) return safeText;
  const safeEmail = escapeHtmlText(email);
  const parts = safeText.split(safeEmail);
  if (parts.length === 1) return safeText;
  return parts.join('<a href="mailto:' + safeEmail + '">' + safeEmail + '</a>');
}

/**
 * Pre-render Buyer FAQ <details> list at build time so it ships in en/index.html
 * without requiring fetch('config/sot.json'). generator.js skips re-render when
 * the list is already populated (see initBuyerFaq below).
 */
function buildBuyerFaqHtml(sot) {
  if (!sot || !Array.isArray(sot.buyerFaq) || !sot.buyerFaq.length) return '';
  const email = sot.product && sot.product.contactEmail;
  return sot.buyerFaq
    .map(function (item) {
      if (!item || !item.q || !item.a) return '';
      const idAttr = item.id ? ' id="' + escapeHtmlText(item.id) + '"' : '';
      return (
        '<details class="faq-details"' + idAttr + '>' +
        '<summary class="faq-summary">' + escapeHtmlText(item.q) + '</summary>' +
        '<div class="faq-panel">' + linkifyFaqEmail(item.a, email) + '</div>' +
        '</details>'
      );
    })
    .join('');
}

/**
 * Render the 3-card "illustrative hiring scenarios" row in the PDF section.
 * Elevation ladder (DS v0.2.1 §6.3): soft → medium → raised, mapped by card index
 * so the visual rhythm stays predictable when SOT order changes.
 */
const EXPERT_CARD_ELEV_MODIFIERS = [
  'pdf-expert-card--elev-soft',
  'pdf-expert-card--elev-medium',
  'pdf-expert-card--elev-raised',
];

function buildExpertCardsHtml(sot) {
  const cards =
    sot && sot.marketing && sot.marketing.pdfSection &&
    sot.marketing.pdfSection.expertScenarios &&
    sot.marketing.pdfSection.expertScenarios.cards;
  if (!Array.isArray(cards) || !cards.length) return '';
  return cards
    .map(function (card, idx) {
      const elev = EXPERT_CARD_ELEV_MODIFIERS[idx] || EXPERT_CARD_ELEV_MODIFIERS[EXPERT_CARD_ELEV_MODIFIERS.length - 1];
      const approach = escapeHtmlText(card.approach);
      const quote = escapeHtmlText(card.quote);
      const name = escapeHtmlText(card.name);
      const role = escapeHtmlText(card.role);
      const region = escapeHtmlText(card.region);
      return (
        '<li class="pdf-expert-card ' + elev + '" role="listitem">' +
          '<p class="pdf-expert-card__approach">' + approach + '</p>' +
          '<blockquote class="pdf-expert-card__quote">' + quote + '</blockquote>' +
          '<footer class="pdf-expert-card__meta">' +
            '<strong>' + name + '</strong>' +
            '<span>' + role + ' &middot; ' + region + '</span>' +
          '</footer>' +
        '</li>'
      );
    })
    .join('');
}

/** Schema.org PostalAddress object for Organization JSON-LD. */
function buildPostalAddressJsonLd(sot) {
  const addr = sot.product.businessAddress;
  return {
    '@type': 'PostalAddress',
    streetAddress: composeStreetLine(addr),
    addressLocality: addr.city,
    addressRegion: addr.region,
    postalCode: addr.postalCode,
    addressCountry: addr.country,
  };
}

function buildJsonLdWebsiteGraph(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const contactEmail = sot && sot.product ? sot.product.contactEmail : '';
  const org = {
    '@type': 'Organization',
    name: 'Prompt Anatomy',
    url: base + '/',
    sameAs: ['https://t.me/prompt_anatomy'],
  };
  if (contactEmail) org.email = contactEmail;
  if (sot && sot.product && sot.product.businessAddress) {
    org.address = buildPostalAddressJsonLd(sot);
  }
  const graph = [
    {
      '@type': 'WebSite',
      name: 'Prompt Anatomy – US hiring prompts',
      url: base + '/',
      inLanguage: ['en-US'],
    },
    org,
  ];
  return (
    '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
    '</script>'
  );
}

function buildJsonLdWebPage(pageUrl, name, description) {
  const graph = [
    {
      '@type': 'WebPage',
      name: name,
      description: description,
      url: pageUrl,
      inLanguage: 'en-US',
      isPartOf: { '@type': 'WebSite', url: absoluteBaseSlash().replace(/\/+$/, '') + '/' },
    },
  ];
  return (
    '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
    '</script>'
  );
}

// ---- Inject SEO and script path ----
function injectHead(html, basePath, sot) {
  const abs = absoluteBaseSlash();
  const canonicalUrl = abs + 'en/';
  const linkCanonical = '<link rel="canonical" href="' + escapeHtmlAttr(canonicalUrl) + '">';
  const linkEn = '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(canonicalUrl) + '">';
  const linkDefault = '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(canonicalUrl) + '">';
  const title = extractTitle(html);
  const description = extractMetaDescription(html);
  const ogTitle = sot ? getSeoOgTitle(sot) : title;
  const ogImage = abs + 'images/og-default.png';

  const socialBlock = [
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta name="twitter:image" content="' + escapeHtmlAttr(ogImage) + '">',
  ].join('\n    ');

  const jsonLd = buildJsonLdWebsiteGraph(sot);
  const seoBlock =
    '\n    ' +
    [linkCanonical, linkEn, linkDefault, socialBlock, jsonLd].join('\n    ') +
    '\n';
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(<meta name="description")/i, '$1' + seoBlock + '$2');

  const basePathScript = basePath
    ? '<script>window.BASE_PATH = \'' + basePath.replace(/'/g, "\\'") + '\';</script>\n    '
    : '';
  html = html.replace('href="assets/styles.css"', 'href="../assets/styles.css"');
  html = html.replace('href="assets/landing.css"', 'href="../assets/landing.css"');
  html = html.replace(/<script src="generator\.js"><\/script>/, basePathScript + '<script src="../generator.js"></script>');
  html = injectFaviconLinks(html, abs);
  html = injectPlausible(html);
  return html;
}

function injectPlausible(html) {
  const domain = process.env.PUBLIC_ANALYTICS_DOMAIN;
  if (!domain || typeof domain !== 'string') return html;
  const trimmed = domain.trim();
  if (!trimmed) return html;
  const script =
    '<script defer data-domain="' +
    escapeHtmlAttr(trimmed) +
    '" src="https://plausible.io/js/script.js"></script>';
  return html.replace('</head>', script + '\n</head>');
}

function injectPrivacyHead(html, pathSuffix, title, description) {
  const abs = absoluteBaseSlash();
  const canonicalUrl = abs + pathSuffix;
  const ogImage = abs + 'images/og-default.png';
  const block = [
    '<link rel="canonical" href="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<meta name="description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta name="twitter:image" content="' + escapeHtmlAttr(ogImage) + '">',
    buildJsonLdWebPage(canonicalUrl, title, description),
  ].join('\n    ');
  return html.replace(/(<meta name="viewport"[^>]*>\s*)(<title)/i, '$1' + block + '\n    $2');
}

function writeRobotsAndSitemap() {
  const abs = absoluteBaseSlash().replace(/\/+$/, '');
  const sitemapUrl = abs + '/sitemap.xml';
  const robots = 'User-agent: *\nAllow: /\n\nSitemap: ' + sitemapUrl + '\n';
  write('robots.txt', robots);

  const urls = [
    abs + '/en/',
    abs + '/',
    abs + '/privacy.html',
    abs + '/en/privacy.html',
    abs + '/terms.html',
    abs + '/success.html',
  ];
  const locs = urls
    .map(function (u) {
      return '  <url><loc>' + u + '</loc></url>';
    })
    .join('\n');
  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    locs +
    '\n</urlset>\n';
  write('sitemap.xml', sitemap);
}

function buildRootSeoFragment(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const img = base + '/images/og-default.png';
  const enLanding = base + '/en/';
  const desc = getSeoMetaDescription(sot);
  const ogTitle = getSeoOgTitle(sot);
  const contactEmail = sot.product.contactEmail;
  const org = {
    '@type': 'Organization',
    name: 'Prompt Anatomy',
    url: enLanding,
    sameAs: ['https://t.me/prompt_anatomy'],
    email: contactEmail,
  };
  if (sot.product.businessAddress) {
    org.address = buildPostalAddressJsonLd(sot);
  }
  const lines = [
    '<meta http-equiv="refresh" content="0; url=en/">',
    '<link rel="canonical" href="' + escapeHtmlAttr(enLanding) + '">',
    '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(enLanding) + '">',
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(enLanding) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(enLanding) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<script type="application/ld+json">' +
      JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: 'Prompt Anatomy – US hiring prompts',
            url: enLanding,
            inLanguage: ['en-US'],
          },
          org,
        ],
      }).replace(/</g, '\\u003c') +
      '</script>',
  ];
  return lines.join('\n    ') + '\n    ';
}

/** Idempotent: strip any prior head SEO between viewport and meta description, then inject root SEO. */
function finalizeRootIndexHtml(sot) {
  let html = read('index.html');
  html = html.replace(
    /(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<meta name="description")/i,
    '$1$2'
  );
  const frag = buildRootSeoFragment(sot);
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(<meta name="description")/i, '$1' + frag + '$2');
  html = html.replace(/<script>window\.BASE_PATH = '[^']*';<\/script>\s*\n?\s*/g, '');
  if (BASE_PATH) {
    const basePathScript =
      '<script>window.BASE_PATH = \'' + BASE_PATH.replace(/'/g, "\\'") + '\';</script>\n    ';
    html = html.replace(
      /<script src="generator\.js"><\/script>/,
      basePathScript + '<script src="generator.js"></script>'
    );
  }
  html = html.replace(/privatumas\.html/g, 'privacy.html');
  html = injectFaviconLinks(html, absoluteBaseSlash());
  write('index.html', html);
}

function buildRootPrivacyFragment() {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const img = base + '/images/og-default.png';
  const enPrivacyUrl = base + '/en/privacy.html';
  const enSite = base + '/en/';
  const desc =
    'Prompt Anatomy – static site with US hiring prompts for HR teams. Stripe processes paid PDF purchases; Resend delivers download links.';
  const lines = [
    '<meta http-equiv="refresh" content="0; url=en/privacy.html">',
    '<link rel="canonical" href="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<meta name="description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="Privacy Policy – Prompt Anatomy">',
    '<meta property="og:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="Privacy Policy – Prompt Anatomy">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<script type="application/ld+json">' +
      JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: 'Privacy Policy – Prompt Anatomy',
            description: desc,
            url: enPrivacyUrl,
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', url: enSite },
          },
        ],
      }).replace(/</g, '\\u003c') +
      '</script>',
  ];
  return lines.join('\n    ') + '\n    ';
}

function finalizeRootPrivacyHtml() {
  let html = read('templates/privacy-gateway.html');
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<title)/i, '$1$2');
  const frag = buildRootPrivacyFragment();
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(<title)/i, '$1' + frag + '$2');
  html = injectFaviconLinks(html, absoluteBaseSlash());
  write('privacy.html', html);
}

// ---- EN replacement pairs (order: more specific first) ----
const EN_REPLACEMENTS = [
  ['<html lang="lt">', '<html lang="en-US">'],
  ['<title>{{SOT_SEO_TITLE}}</title>', '<title>{{SOT_SEO_TITLE}}</title>'],
  ['Pereiti prie turinio', 'Skip to content'],
  ['Pilna Promptų anatomija – interaktyvus mokymas (atidaroma naujame lange)', 'Full Prompt Anatomy – interactive training (opens in a new tab)'],
  ['{{SOT_HERO_HEADLINE}}', '{{SOT_HERO_HEADLINE}}'],
  ['{{SOT_HERO_SUBHEAD}}', '{{SOT_HERO_SUBHEAD}}'],
  ['6 sistemos fazės', '6 system phases'],
  ['1. Diagnostika', '1. Diagnose'],
  ['2. Profilis', '2. Define the Role'],
  ['3. Pritraukimas', '3. Source Candidates'],
  ['4. Atranka', '4. Screen & Interview'],
  ['5. Pasiūlymas', '5. Close the Offer'],
  ['6. Išlaikymas', '6. Onboard & Retain'],
  ['{{SOT_HERO_PRIMARY_CTA_LABEL}}', '{{SOT_HERO_PRIMARY_CTA_LABEL}}'],
  ['{{SOT_HERO_SECONDARY_CTA_LABEL}}', '{{SOT_HERO_SECONDARY_CTA_LABEL}}'],
  ['Ką ši sistema padeda išspręsti', 'What this hiring system helps solve'],
  [
    'Ji skirta tam, kad nustotumėte švaistyti laiką „tuščioms“ paieškoms! Įtraukta nemokamai šiame puslapyje.',
    'Help structure sourcing and screening when pipeline quality is unclear. Included free on this page.',
  ],
  [
    'Ji skirta tam, kad nustotumėte švaistyti laiką „tuščioms“ paieškoms!',
    'Stop wasting time on empty searches—structure hiring with clear prompts.',
  ],
  ['Kaip naudoti US atrankos promptų sistemą', 'How to use the US hiring prompt system'],
  ['Tai Spin-off Nr. 3 iš „Promptų anatomijos“.', 'Built by Prompt Anatomy.'],
  ['Kaip naudoti nemokamą promptų generatorių', 'How to use the free prompt builder'],
  [
    'Nemokami promptai — kopijuokite į ChatGPT, Claude arba Gemini.',
    'Free prompts — copy into ChatGPT, Claude, or Gemini.',
  ],
  ['{{SOT_WORKFLOW_TITLE}}', '{{SOT_WORKFLOW_TITLE}}'],
  ['{{SOT_WORKFLOW_LEDE}}', '{{SOT_WORKFLOW_LEDE}}'],
  ['{{SOT_PDF_SECTION_TITLE}}', '{{SOT_PDF_SECTION_TITLE}}'],
  ['{{SOT_PDF_SECTION_LEDE}}', '{{SOT_PDF_SECTION_LEDE}}'],
  ['{{SOT_PDF_SECTION_FREE_BRIDGE}}', '{{SOT_PDF_SECTION_FREE_BRIDGE}}'],
  ['{{SOT_PDF_EXPERT_SCENARIOS_TITLE}}', '{{SOT_PDF_EXPERT_SCENARIOS_TITLE}}'],
  ['{{SOT_PDF_EXPERT_SCENARIOS_DISCLAIMER}}', '{{SOT_PDF_EXPERT_SCENARIOS_DISCLAIMER}}'],
  ['{{SOT_PDF_EXPERT_CARDS_HTML}}', '{{SOT_PDF_EXPERT_CARDS_HTML}}'],
  ['{{SOT_BUYER_FAQ_HTML}}', '{{SOT_BUYER_FAQ_HTML}}'],
  ['Nulinis srautas?', 'Zero pipeline?'],
  ['Sugeneruokite pritraukiančius skelbimus ir paieškos žinutes.', 'Generate clear job posts and outreach messages.'],
  ['Netinkami žmonės?', 'Wrong people?'],
  ['Tiksliai apibrėžkite profilį ir atsirinkite geriausius.', 'Define the role precisely and screen for the strongest fit.'],
  ['Lėtas tempas?', 'Slow pace?'],
  ['Identifikuokite „butelio kakliuką“ per 5 minutes.', 'Identify the bottleneck in 5 minutes.'],
  ['Prarandami talentai?', 'Losing talent?'],
  ['Pateikite pasiūlymą, kurio neįmanoma atsisakyti.', 'Present a clear offer candidates can evaluate quickly.'],
  ['aria-label="3 žingsniai, apie 3–5 min"', 'aria-label="3 steps, about 3–5 minutes"'],
  ['3 žingsniai · 3–5 min', '3 steps · 3–5 min'],
  [
    'Pasirinkite promptą žemiau (arba naudokite <a href="#workflow-overview">6 fazių juostą</a> aukščiau).',
    'Pick a prompt below (or use the <a href="#workflow-overview">6-phase bar</a> above).',
  ],
  ['US formatting tips (locations, dates, phone)', 'US placeholder reference (locations, dates, phone)'],
  ['Spustelėkite <strong>„Kopijuoti promptą“</strong> arba <code>Ctrl+C</code> / <code>Cmd+C</code>.', 'Click <strong>“Copy prompt”</strong> or <code>Ctrl+C</code> / <code>Cmd+C</code>.'],
  [
    'Įklijuokite į ChatGPT, Claude, Gemini ar kitą DI įrankį ir pakeiskite <code>[vietininkus]</code> savo duomenimis.',
    'Paste into ChatGPT, Claude, Gemini, or another AI tool and replace <code>[brackets]</code> with your data.',
  ],
  ['<strong>Vietininkai:</strong>', '<strong>Placeholders:</strong>'],
  ['aria-label="Vietininkų pavyzdžiai"', 'aria-label="Placeholder examples"'],
  ['<code>[įmonė]</code>', '<code>[company]</code>'],
  ['<code>[pozicija]</code>', '<code>[role]</code>'],
  ['<code>[atlygis]</code>', '<code>[salary range]</code>'],
  ['<code>[vieta]</code>', '<code>[location]</code>'],
  [
    '<p class="instructions-subrow"><strong>Adresų laukai:</strong> <code>Street Address</code>, <code>City</code>, <code>State</code>, pasirinktinas <code>Zip Code</code> — pvz. <code>San Francisco, CA 94105</code>, <code>Seattle, WA 98101</code></p>',
    '<p class="instructions-subrow"><strong>Address fields:</strong> <code>Street Address</code>, <code>City</code>, <code>State</code>, optional <code>Zip Code</code> — e.g. <code>San Francisco, CA 94105</code>, <code>Seattle, WA 98101</code></p>',
  ],
  [
    '<p class="instructions-subrow"><strong>Telefono formatas:</strong> <code>+1 (XXX) XXX-XXXX</code>, pvz. <code>+1 (415) 555-0198</code></p>',
    '<p class="instructions-subrow"><strong>Phone format:</strong> <code>+1 (XXX) XXX-XXXX</code>, e.g. <code>+1 (415) 555-0198</code></p>',
  ],
  ['<strong>Vietos:</strong>', '<strong>Locations:</strong>'],
  ['<strong>Datos:</strong>', '<strong>Dates:</strong>'],
  [
    '<strong>Pastaba:</strong> DI vaidmens („Tu esi…“) keisti nereikia.',
    '<strong>Note:</strong> You can leave the &quot;You are…&quot; line as-is.',
  ],
  [
    'Ne. Pradėkite nuo problemos, kuri skauda šiandien (pvz. skelbimas ar pokalbis), ir grįžkite prie kitų promptų vėliau.',
    'No. Start with the problem that hurts today (e.g. job ad or interview), then return to other prompts later.',
  ],
  [
    'Kopijuok → įklijuok → pakeisk [vietininkus] savo duomenimis.',
    'Copy → paste → replace [brackets] with your data.',
  ],
  ['<section class="faq" lang="lt" aria-labelledby="faq-title">', '<section class="faq" lang="en" aria-labelledby="faq-title">'],
  ['Dažni klausimai prieš pradedant', 'Common questions before you start'],
  ['Trumpi atsakymai prieš kopijuojant pirmąjį promptą.', 'Short notes before you copy the first prompt.'],
  ['Ar būtina eiti visas 6 fazes iš eilės?', 'Do I have to go through all 6 phases in order?'],
  ['Ar tai klausimynas ar kandidatų valdymo sistema (ATS)?', 'Is this an ATS or recruiting tool?'],
  ['Ne. Tai tekstai, kuriuos kopijuojate ir įklijuojate į savo DI įrankį – joks serveris neatlieka atrankos už jus.', 'No. These are prompts you copy into ChatGPT, Claude, or Gemini. Nothing runs on our servers.'],
  ['Kiek laiko užtrunka vienas žingsnis?', 'How long does each prompt take?'],
  ['Maždaug 3–5 minutes pasiruošti ir nukopijuoti; pats pokalbis su DI priklauso nuo jūsų klausimų ir atsakymų.', 'About 3–5 minutes to prepare and copy; the AI chat itself depends on your questions and answers.'],
  ['Ar galiu naudoti tik vieną ar kelis promptus?', 'Can I use just one or a few prompts?'],
  ['Taip. Galite pradėti nuo vienos problemos (pvz., skelbimo ar pokalbio) ir vėliau grįžti prie kitų.', 'Yes. Start with one problem (e.g. job ad or interview) and come back to the others later.'],
  ['Geriausia eiti iš eilės nuo 1 iki 10. Paspaudus nuorodą pereisite prie atitinkamo prompto.', 'Best in order 1–10.'],
  ['Kas toliau?', 'Jump to a prompt'],
  ['1. Kur stringame?', '1. Where are we stuck?'],
  ['2. Koks žmogus mums iš tikrųjų tinka?', '2. Who really fits us?'],
  ['3. Perrašyk darbo skelbimą paprastai', '3. Rewrite the job ad in plain language'],
  ['4. Kaip šiandien rasti daugiau žmonių?', '4. How to find more people today?'],
  ['5. Kaip geriau vesti pokalbį?', '5. How to run a better interview?'],
  ['6. Kodėl kandidatai atsisako?', '6. Why do candidates decline?'],
  ['7. Kaip geriau pristatyti pasiūlymą?', '7. How to present the offer better?'],
  ['8. Kaip padėti naujam žmogui pirmus 3 mėnesius?', '8. How to support a new hire in the first 3 months?'],
  ['9. Kodėl žmonės išeina?', '9. Why do people leave?'],
  ['10. Pagrindinis promptas (vienas viskam)', '10. Master prompt (one for everything)'],
  ['Sistema: 0 iš 6 fazių', 'Progress: 0 of 6'],
  ['Progresas: 0 iš 6 fazių', 'Progress: 0 of 6'],
  ['Pasirinkti ir kopijuoti promptą ', 'Select and copy prompt '],
  [' į mainų atmintinę', ' to clipboard'],
  ['Informacija: promptas ', 'Information: prompt '],
  ['Pažymėti, kad atlikai šį žingsnį', 'Mark as done'],
  ['Pažymėjau kaip atlikau', 'Mark as done'],
  ['Kopijuoti promptą', 'Copy prompt'],
  ['Kopijuoti', 'Copy'],
  ['Naudok kai:', 'Use when:'],
  ['Pakeisk prieš naudodamas:', 'Replace before using:'],
  ['Nukopijuota.', 'Copied.'],
  ['Kopijavimo pranešimas', 'Copy notification'],
  ['Kopijuojamo teksto laukas', 'Field for text to copy'],
  ['Atidaryti „Promptų anatomijos“ Telegram kanalą naujame lange', 'Open Prompt Anatomy on Telegram in a new tab'],
  ['Sekite Telegram kanale', 'Join the Telegram community'],
  ['<p class="community-secondary-link">Arba ', '<p class="community-secondary-link">Or '],
  ['Promptų anatomija →', 'Prompt anatomy →'],
  ['Promptų anatomija', 'Prompt anatomy'],
  ['">Prompt anatomy</a>', '">Prompt Anatomy</a>'],
  ['Prompt anatomy →', 'Prompt Anatomy →'],
  ['Prompt anatomy:', 'Prompt Anatomy:'],
  ['Sėkmės atrankoje', 'Hire better, one prompt at a time.'],
  ['Prompt Anatomy — HR hiring prompts and PDF guides.', 'Prompt Anatomy — HR hiring prompts and PDF guides.'],
  ['Promptų anatomija:', 'Prompt anatomy:'],
  ['El. paštas:', 'Email:'],
  ['HR atranka', 'US hiring'],
  ['10 promptų', '10 prompts'],
  ['Veiksmų fokusas', 'Action focus'],
  ['Kasdienės atrankos problemos', 'Everyday hiring problems'],
  ['Mokymų medžiaga. Visos teisės saugomos.', 'Training material. All rights reserved.'],
  ['Privatumas', 'Privacy'],
  ['href="privatumas.html"', 'href="privacy.html"'],
  ['Download PDF for $5.99', 'Buy & download — $5.99'],
  ['Download PDF for $11.99', 'Buy & download — $11.99'],
  ['aria-label="Buy Beginner PDF Guide for $5.99"', 'aria-label="Buy and download Beginner PDF Guide for $5.99"'],
  ['aria-label="Buy Advanced PDF Guide for $11.99"', 'aria-label="Buy and download Advanced PDF Guide for $11.99"'],
  ['FAZĖ ', 'PHASE '],
  ['Sistema: X iš 6 fazių', 'Progress: X of 6'],
  ['progresas ir fazės', 'progress and phases'],
  ['Copy promptą', 'Copy prompt'],
  // CSS comments (EN build)
  ['žalia CTA paletė', 'green CTA palette'],
  ['Pagrindinis akcentas – žalia', 'Primary accent – green'],
  ['Hero: žalia,', 'Hero: green,'],
  ['žalias tekstas', 'green text'],
  [
    'Tertiarinė – PA ekosistemos akcentas (--color-ecosystem-1), ne HR žalia',
    'Tertiary – PA ecosystem accent (--color-ecosystem-1), not HR green',
  ],
  ['suderinti su žalia palete', 'aligned with green palette'],
  ['suderinta su žalia tema', 'aligned with green theme'],
  ['Lucide ikonų dydžiai', 'Lucide icon sizes'],
  ['radial šviesa', 'radial light'],
  ['Tamsesnis apatinis dešinys', 'Darker bottom right'],
  ['MODAL / KONTAKTŲ FORMA (rezervuota būsimai – žr. INTEGRACIJA.md)', 'MODAL / CONTACT FORM (reserved for future – see INTEGRACIJA.md)'],
  ['Viduje fazės kortelės fazės numeris', 'Inside phase card the phase number'],
  ['pakanka fazės header', 'phase header is enough'],
  ['PHASE ACCORDION (6 fazės)', 'PHASE ACCORDION (6 phases)'],
  ['Pagrindinis CTA – vienas brand green', 'Primary CTA – single brand green'],
  ['subtilus shadow', 'subtle shadow'],
  ['mažesnė saturacija – ramus, autoritetingas HR, ne fintech', 'lower saturation – calm, authoritative HR, not fintech'],
  ['vienas ryškus kelias', 'one clear path'],
  ['aiškiai silpnesnis už primary, glass', 'clearly weaker than primary, glass'],
  ['Badge sistemos dalis – skaičius kortelėje', 'Badge system part – number on card'],
  ['/ pavadinimas nebėra kartojamas –', '/ title not repeated –'],
  ['ant šviesaus fono', 'on light background'],
  ['mobilėje:', 'on mobile:'],
  ['mažiausias viewport', 'minimum viewport'],
  // Info box and prompt-cta content
  ['Nori greitai suprasti, kur stringa atranka. Kai matome skaičius, lengviau nuspręsti, kur dėti pastangas.', 'You want to quickly see where recruitment is stuck. Numbers make it easier to decide where to focus.'],
  ['<strong>Tai nėra klausimynas.</strong> Nukopijuok šį tekstą ir įklijuok į ChatGPT arba Claude.', '<strong>This is not a survey.</strong> Copy this text and paste into ChatGPT or Claude.'],
  ['Skaičius (kandidatų, pokalbių, pasiūlymų, priėmė) – įrašyk savo skaičius į laukus [ ].', 'Numbers (candidates, interviews, offers, accepted) – put your numbers in the [ ] fields.'],
  ['Nukopijuok ir įklijuok į ChatGPT arba Claude – tai šio žingsnio tikslas.', 'Copy and paste into ChatGPT or Claude – that\'s the goal of this step.'],
  ['Aprašai idealų kandidatą pozicijai. Kai žinome, ko ieškome, lengviau atpažinti tinkamą žmogų.', 'You\'re describing the ideal candidate. When we know what we want, it\'s easier to spot the right person.'],
  ['[įmonė] → įmonės pavadinimas arba sritis (pvz. IT startupas, mažmeninė prekyba); [pozicija] → pareigos; geriausias darbuotojas – trumpas aprašymas; kodėl išeidavo – priežastis arba „–“.', '[company] → company and US location (e.g., New York, NY); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [role] → job title; best performer – short description; why they left – reason or “–”.'],
  ['Įklijuok į ChatGPT arba Claude ir pakeisk laukus savo duomenimis.', 'Paste into ChatGPT or Claude and replace the fields with your data.'],
  ['Perrašai skelbimą paprasta kalba. Paprastas ir aiškus tekstas pritraukia tinkamus kandidatus.', 'You\'re rewriting the ad in plain language. Clear, simple text attracts the right candidates.'],
  ['[įmonė] → įmonės pavadinimas arba sritis (nebūtina, bet padeda pritaikyti toną); [įklijuok] → įklijuok savo darbo skelbimo tekstą.', '[company] → company and US location (e.g., San Francisco, CA); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [salary range] → use $, commas as thousands separators, and decimal points where needed (e.g., $85,000–$105,000 or $1,250.50); [paste] → paste your job ad text.'],
  ['Reikia daugiau kandidatų – LinkedIn, pažįstami, tiesioginis parašas. Paprasti žingsniai, ne tik skelbimai.', 'You need more candidates – LinkedIn, network, direct message. Simple steps, not just job boards.'],
  ['[įmonė] → įmonės pavadinimas arba sritis; [pozicija] → tavo pozicija (pvz. Pardavimų vadovas).', '[company] → company and US location (e.g., Austin, TX); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [role] → your role (e.g., Sales Manager); phone numbers, if used, should follow +1 (XXX) XXX-XXXX; use Street Address, City, State, Zip Code for addresses.'],
  ['Nukopijuok, įklijuok į DI įrankį ir pakeisk [įmonė], [pozicija] savo duomenimis.', 'Copy, paste into your AI tool and replace [company], [role] with your data.'],
  ['Ruoši pokalbį ar nori geresnių klausimų. Struktūra padeda išgirsti tai, kas iš tikrųjų svarbu.', 'You\'re preparing for an interview or want better questions. Structure helps you hear what really matters.'],
  ['[įmonė] → įmonės pavadinimas arba sritis; [pozicija] → tavo pozicija.', '[company] → company and US location (e.g., Chicago, IL); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [role] → your role; dates should use MM/DD/YYYY.'],
  ['Kandidatai dažnai atsisako – nori suprasti kodėl. Supratus priežastis, galime koreguoti pasiūlymą arba komunikaciją.', 'Candidates often decline – you want to understand why. Knowing reasons helps you adjust the offer or communication.'],
  ['[įmonė], [pozicija], [atlygis], [ką siūlome] – įrašyk savo duomenis.', '[company], [role], [location], [salary range], [what we offer] – use US formats such as New York, NY, Remote – US, and $85,000–$105,000.'],
  ['Įklijuok į ChatGPT arba Claude – pakeisk įmonę, poziciją, atlygį ir ką siūlote.', 'Paste into ChatGPT or Claude – replace company, role, location, salary range, and what you offer.'],
  ['Formuluoji pasiūlymą kandidatui. Kai žmogus mato vertę, lengviau priimti sprendimą.', 'You\'re wording an offer. When they see the value, the decision is easier.'],
  ['[įmonė], [pozicija], [ką siūlome] – įrašyk savo duomenis.', '[company], [role], [location], [salary range], [what we offer] – use City, State, optional Zip Code, or Remote – US for location and fill in financial details using US currency formatting.'],
  ['Planuoji naujo darbuotojo pirmus mėnesius. Aiškūs lūkesčiai ir pagalba mažina išeitį per bandymo laikotarpį.', 'You\'re planning a new hire\'s first months. Clear expectations and support reduce early turnover.'],
  ['Nukopijuok ir įklijuok – įrašyk įmonę, poziciją ir gauk planą.', 'Copy and paste – enter company and role and get the plan.'],
  ['Žmonės išeina per pirmus mėnesius – nori suprasti kodėl. Supratus priežastis, galime veikti proaktyviai.', 'People leave in the first months – you want to understand why. Knowing reasons helps you act proactively.'],
  ['[priežastys] – įrašyk, ką girdėjote, kodėl žmonės išeina (arba „dar nežinome“).', '[reasons] – enter what you\'ve heard about why people left (or “we don\'t know yet”).'],
  ['Norėtum vieną integruotą atrankos planą. Viskas vienoje vietoje: problema, savaitė, skelbimas, pokalbiai, sutikimas, pirmi mėnesiai.', 'You want one integrated plan. Everything in one place: problem, week, ad, interviews, acceptance, first months.'],
  ['[įmonė], [pozicija], kandidatų skaičius, kur stringame, ką bandėme – įrašyk savo duomenis.', '[company], [role], [location], candidate count, where we\'re stuck, what we tried – fill in your data using Street Address, City, State, optional Zip Code, or Remote – US.'],
  ['Šis promptas apima viską – nukopijuok, įklijuok ir pildyk savo duomenimis.', 'This prompt covers everything – copy, paste and fill in your data.'],
];

// EN prompt content (full <pre> body for each prompt 1–10)
const PROMPTS_EN = [
  `You are a recruitment analyst. Your goal is to identify where recruitment is stuck and what to change, using the numbers.

Help me understand our recruitment challenges.

Company/location: [company, e.g., New York, NY]
Role location: [e.g., Remote – US, Hybrid – New York, NY, or On-site – Austin, TX]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., NY]
Zip Code: [optional, e.g., 10001]

We have:
- Number of candidates: [ ]
- Number of interviews: [ ]
- Number of offers: [ ]
- How many accepted: [ ]

Explain simply:
1. Where are we most stuck?
2. Why might that be?
3. What can we change this week?`,
  `You are a candidate profile specialist. Your goal is to clearly describe the ideal candidate for the role (traits, what can be taught, motivation).

Help me clearly describe who would fit us best.

Company/location: [company, e.g., New York, NY]
Role location: [e.g., Remote – US, Hybrid – New York, NY, or On-site – Austin, TX]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., NY]
Zip Code: [optional, e.g., 10001]
Best performer in this role: [what are they like?]
Why people left before: [ ]

Answer simply:
1. What 5 traits must they have?
2. What can be taught?
3. Why would this person consider changing jobs?
4. What would they fear most?`,
  `You are a job ad editor. Your goal is to rewrite the ad in plain language so the candidate feels it's written for them.

Rewrite this job ad so the person feels it's written for them.

Company/location: [company, e.g., San Francisco, CA]
Role location: [e.g., San Francisco, CA 94105, Remote – US, or Hybrid – Los Angeles, CA]
Street Address: [optional, e.g., 123 Market St]
Text: [paste here]
Compensation: [salary range, e.g., $85,000–$105,000]

Do:
- Clear opening
- Plain language
- Concrete examples
- Clear call to apply
- US-friendly location and compensation formatting`,
  `You are a candidate sourcing consultant. Your goal is to suggest concrete, simple ways to find more candidates (LinkedIn, network, direct outreach).

Give me 3 simple ways to find more candidates for this role today:

Company/location: [company, e.g., New York, NY]
Role location: [e.g., Remote – US, Hybrid – New York, NY, or On-site – Austin, TX]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., NY]
Zip Code: [optional, e.g., 10001]
Contact phone: [optional, e.g., +1 (415) 555-0198]

Suggest:
- What to write on LinkedIn
- How to ask your network
- How to message someone directly
- How to format phone or address details if needed (Street Address, City, State, Zip Code, +1 phone)`,
  `You are an interview specialist. Your goal is to create a simple interview plan: questions that help understand the person, and what to watch for.

Create a simple interview plan for this role:

Company/location: [company, e.g., New York, NY]
Role location: [e.g., Remote – US, Hybrid – New York, NY, or On-site – Austin, TX]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., NY]
Zip Code: [optional, e.g., 10001]
Contact phone: [optional, e.g., +1 (415) 555-0198]

Give:
- 5 questions that help understand the person
- 3 situational questions
- How to tell if they're really a fit
- What to watch for`,
  `You are an offer and decline analyst. Your goal is to uncover possible reasons for decline and suggest how to talk to the candidate and what to improve.

Help me understand why candidates might decline our offer.

Company/location: [company, e.g., New York, NY]
Role location: [e.g., Remote – US, Hybrid – New York, NY, or On-site – Austin, TX]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., NY]
Zip Code: [optional, e.g., 10001]
Contact phone: [optional, e.g., +1 (415) 555-0198]
Salary range: [e.g., $85,000–$105,000]
Signing bonus or budget: [optional, e.g., $1,250.50]
What we offer: [ ]

Give:
1. 3 possible reasons
2. How to talk about it with the candidate
3. What we could improve`,
  `You are a job offer writer. Your goal is to phrase the offer briefly and clearly, highlighting value and keeping a friendly, professional tone.

Help me phrase a job offer so the person feels the value.

Company/location: [company, e.g., San Francisco, CA]
Role location: [e.g., San Francisco, CA 94105, Remote – US, or Hybrid – Los Angeles, CA]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., CA]
Zip Code: [optional, e.g., 94105]
Contact phone: [optional, e.g., +1 (415) 555-0198]
Salary range: [e.g., $85,000–$105,000]
What we offer: [ ]

Do:
- Short, clear text
- Highlight the main benefit
- Friendly but professional tone`,
  `You are a new hire onboarding specialist. Your goal is to create a simple 3‑month plan: what to understand in week one, what to expect after 1 and 3 months, how the manager can help.

Create a simple 3‑month plan for a new employee.

Company/location: [company, e.g., Seattle, WA]
Role location: [e.g., Seattle, WA 98101, Remote – US, or Hybrid – Denver, CO]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., WA]
Zip Code: [optional, e.g., 98101]
Start date: [MM/DD/YYYY]
Manager contact phone: [+1 (415) 555-0198]

Give:
- What they should understand in the first week
- What we expect after one month
- What they should be able to do after 3 months
- How the manager can help`,
  `You are an employee retention analyst. Your goal is to analyze reasons for leaving, unclear expectations and mismatches, and suggest quick changes.

Help me analyze why people leave in the first 6 months.

Company/location: [company, e.g., Chicago, IL]
Role location: [e.g., Chicago, IL 60601, Remote – US, or Hybrid – Dallas, TX]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., IL]
Zip Code: [optional, e.g., 60601]
Reasons we've heard: [ ]

Tell me:
1. Where might we be unclear?
2. Where do expectations not match?
3. What can we change quickly?`,
  `You are an HR recruitment strategist. Your goal is to put the full recruitment plan in one place: from the problem and weekly actions to the ad, interviews, acceptance likelihood, and first 3 months of support. Write simply, with concrete actions only.

Help me organize hiring for this role simply and clearly:

Company/location: [company, e.g., New York, NY]
Role location: [e.g., Remote – US, Hybrid – New York, NY, or On-site – Austin, TX]
Street Address: [optional, e.g., 123 Market St]
Role: [job title]
State: [two-letter State, e.g., NY]
Zip Code: [optional, e.g., 10001]
Contact phone: [optional, e.g., +1 (415) 555-0198]
How many people are applying: [ ]
Where we're stuck: [ ]
What we've already tried: [ ]

Give:
1. Where's the problem
2. What to do this week
3. How to improve the job ad
4. How to run better interviews
5. How to increase the chance they accept
6. How to help them stay for the first three months`
];

// Apply EN replacements to html
function applyEnReplacements(html) {
  for (const [from, to] of EN_REPLACEMENTS) {
    html = html.split(from).join(to);
  }
  // Replace each prompt content
  for (let i = 1; i <= 10; i++) {
    const re = new RegExp('(<pre class="code-text" id="prompt' + i + '">)([\\s\\S]*?)(</pre>)');
    const enContent = PROMPTS_EN[i - 1];
    html = html.replace(re, function(_match, open, _body, close) {
      return open + enContent + close;
    });
  }
  // Phase labels in header (again, in case not caught)
  html = html.replace(/Diagnostika/g, 'Diagnose');
  html = html.replace(/Profilis/g, 'Define the Role');
  html = html.replace(/Pritraukimas/g, 'Source Candidates');
  html = html.replace(/Atranka/g, 'Screen & Interview');
  html = html.replace(/Pasiūlymas/g, 'Close the Offer');
  html = html.replace(/Išlaikymas/g, 'Onboard & Retain');
  html = html.replace(/analyse/g, 'analyze');
  html = html.replace(/Analyse/g, 'Analyze');
  html = html.replace(/\/\*[\s\S]*?\*\//g, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, function (_, open, body, close) {
    return open + body.replace(/\n[ \t]*\n[ \t]*\n+/g, '\n\n') + close;
  });
  return html;
}

// Prompt-specific EN UI (titles, descriptions, info boxes) – applied after main replacements
const EN_PROMPT_UI = [
  { title: 'Where are we stuck?', desc: 'Help understand our recruitment challenges', infoUse: 'You want to quickly see where recruitment is stuck. Numbers make it easier to decide where to focus.', infoReplace: 'Numbers (candidates, interviews, offers, accepted) – put your numbers in the [ ] fields.', cta: 'Copy and paste into ChatGPT or Claude – that\'s the goal of this step.' },
  { title: 'Who really fits us?', desc: 'Help describe the ideal candidate for the role', infoUse: 'You\'re describing the ideal candidate. When we know what we want, it\'s easier to spot the right person.', infoReplace: '[company] → company and US location (e.g., New York, NY); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [role] → job title; best performer – short description; why they left – reason or “–”.', cta: 'Paste into ChatGPT or Claude and replace the fields with your data.' },
  { title: 'Rewrite the job ad in plain language', desc: 'So the person feels the ad is for them', infoUse: 'You\'re rewriting the ad in plain language. Clear, simple text attracts the right candidates.', infoReplace: '[company] → company and US location (e.g., San Francisco, CA); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [salary range] → use $, commas as thousands separators, and decimal points where needed (e.g., $85,000–$105,000 or $1,250.50); [paste] → paste your job ad text.', cta: 'Copy and paste into ChatGPT or Claude – that\'s the goal of this step.' },
  { title: 'How to find more people today?', desc: '3 simple ways – LinkedIn, network, direct message', infoUse: 'You need more candidates – LinkedIn, network, direct message. Simple steps, not just job boards.', infoReplace: '[company] → company and US location (e.g., Austin, TX); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [role] → your role (e.g., Sales Manager); phone numbers, if used, should follow +1 (XXX) XXX-XXXX; use Street Address, City, State, Zip Code for addresses.', cta: 'Copy, paste into your AI tool and replace [company], [role] with your data.' },
  { title: 'How to run a better interview?', desc: 'Simple interview plan – questions and what to watch for', infoUse: 'You\'re preparing for an interview or want better questions. Structure helps you hear what really matters.', infoReplace: '[company] → company and US location (e.g., Chicago, IL); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [role] → your role; dates should use MM/DD/YYYY.', cta: 'Copy and paste into ChatGPT or Claude – that\'s the goal of this step.' },
  { title: 'Why do candidates decline?', desc: 'Understand reasons and how to talk about it', infoUse: 'Candidates often decline – you want to understand why. Knowing reasons helps you adjust the offer or communication.', infoReplace: '[company], [role], [location], [salary range], [what we offer] – use US formats such as New York, NY, Remote – US, and $85,000–$105,000.', cta: 'Paste into ChatGPT or Claude – replace company, role, location, salary range, and what you offer.' },
  { title: 'How to present the offer better?', desc: 'Phrase the offer so the person feels the value', infoUse: 'You\'re wording an offer. When they see the value, the decision is easier.', infoReplace: '[company], [role], [location], [salary range], [what we offer] – use City, State, optional Zip Code, or Remote – US for location and fill in financial details using US currency formatting.', cta: 'Copy and paste into ChatGPT or Claude – that\'s the goal of this step.' },
  { title: 'How to help the new person in the first 3 months?', desc: 'Simple 3‑month plan – week one, month one, 3 months, manager support', infoUse: 'You\'re planning a new hire\'s first months. Clear expectations and support reduce early turnover.', infoReplace: '[company] → company and US location (e.g., Chicago, IL); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [role] → your role; dates should use MM/DD/YYYY.', cta: 'Copy and paste – enter company and role and get the plan.' },
  { title: 'Why do people leave?', desc: 'Analyze reasons and what we can change quickly', infoUse: 'People leave in the first months – you want to understand why. Knowing reasons helps you act proactively.', infoReplace: '[reasons] – enter what you\'ve heard about why people left (or “we don\'t know yet”).', cta: 'Copy and paste into ChatGPT or Claude – that\'s the goal of this step.' },
  { title: 'Master prompt (one for everything)', desc: 'One integrated recruitment plan – from problem to first months', infoUse: 'You want one integrated plan. Everything in one place: problem, week, ad, interviews, acceptance, first months.', infoReplace: '[company], [role], [location], candidate count, where we\'re stuck, what we tried – fill in your data using Street Address, City, State, optional Zip Code, or Remote – US.', cta: 'This prompt covers everything – copy, paste and fill in your data.' },
];

function applyEnPromptUi(html) {
  const titles = [
    'Kur stringame?', 'Koks žmogus mums iš tikrųjų tinka?', 'Perrašyk darbo skelbimą paprastai',
    'Kaip šiandien rasti daugiau žmonių?', 'Kaip geriau vesti pokalbį?', 'Kodėl kandidatai atsisako?',
    'Kaip geriau pristatyti pasiūlymą?', 'Kaip padėti naujam žmogui pirmus 3 mėnesius?', 'Kodėl žmonės išeina?',
    'Pagrindinis promptas (vienas viskam)'
  ];
  for (let i = 0; i < 10; i++) {
    const ui = EN_PROMPT_UI[i];
    html = html.replace(new RegExp('>' + titles[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</h2>'), '>' + ui.title + '</h2>');
  }
  const descReplacements = [
    ['Padėk suprasti mūsų atrankos iššūkius', EN_PROMPT_UI[0].desc],
    ['Padėk aiškiai aprašyti idealų kandidatą pozicijai', EN_PROMPT_UI[1].desc],
    ['Kad žmogus jaustų, jog skelbimas rašytas jam', EN_PROMPT_UI[2].desc],
    ['3 paprasti būdai – LinkedIn, pažįstami, tiesioginis parašas', EN_PROMPT_UI[3].desc],
    ['Paprastas pokalbio planas – klausimai ir į ką atkreipti dėmesį', EN_PROMPT_UI[4].desc],
    ['Suprask priežastis ir kaip apie tai kalbėti', EN_PROMPT_UI[5].desc],
    ['Suformuluok pasiūlymą taip, kad žmogus jaustų vertę', EN_PROMPT_UI[6].desc],
    ['Paprastas 3 mėnesių planas – savaitė, mėnuo, 3 mėn., vadovo pagalba', EN_PROMPT_UI[7].desc],
    ['Išanalizuok priežastis ir ką galime pakeisti greitai', EN_PROMPT_UI[8].desc],
    ['Vienas integruotas atrankos planas – nuo problemos iki pirmų mėnesių', EN_PROMPT_UI[9].desc]
  ];
  for (const [from, to] of descReplacements) {
    html = html.replace(from, to);
  }
  return html;
}

const PRIVACY_PAGE_TITLE = 'Privacy Policy – Prompt Anatomy';

function buildPrivacyEn(html, sot) {
  const abs = absoluteBaseSlash();
  let out = html.replace('href="assets/styles.css"', 'href="../assets/styles.css"');
  out = injectFaviconLinks(out, abs);
  if (sot && sot.product && sot.product.contactEmail) {
    out = replaceAllGlobal(out, '{{SOT_CONTACT_EMAIL}}', sot.product.contactEmail);
  }
  if (sot && sot.product && sot.product.businessAddress) {
    out = replaceAllGlobal(out, '{{SOT_BUSINESS_ADDRESS}}', renderAddressBlock(sot));
  }
  return out;
}

function applySotMetaDescription(html, desc) {
  return html.replace(
    /<meta name="description" content="[^"]*">/i,
    '<meta name="description" content="' + escapeHtmlAttr(desc) + '">'
  );
}

function replaceAllGlobal(html, token, value) {
  if (!html.includes(token)) return html;
  return html.split(token).join(value);
}

function applySot(html, sot) {
  const email = sot.product.contactEmail;
  const m = sot.marketing;
  const h = m.hero;
  const w = m.workflowOverview;
  const p = m.pdfSection;

  html = applySotMetaDescription(html, getSeoMetaDescription(sot));
  html = html.replace(/<title>[^<]*<\/title>/i, '<title>' + escapeHtmlAttr(getSeoTitle(sot)) + '</title>');
  html = html.replace(/https:\/\/buy\.stripe\.com\/REPLACE_BEGINNER_PAYMENT_LINK/g, sot.pdfGuides.beginner.stripePaymentLink);
  html = html.replace(/https:\/\/buy\.stripe\.com\/REPLACE_ADVANCED_PAYMENT_LINK/g, sot.pdfGuides.advanced.stripePaymentLink);
  if (sot.pdfGuides.bundle && sot.pdfGuides.bundle.stripePaymentLink) {
    html = html.replace(
      /https:\/\/buy\.stripe\.com\/REPLACE_BUNDLE_PAYMENT_LINK/g,
      sot.pdfGuides.bundle.stripePaymentLink
    );
  }
  html = html.replace(/info@promptanatomy\.app/g, email);
  html = html.replace(/info@promptanatomy\.help/g, email);

  const replacements = {
    '{{SOT_SEO_TITLE}}': getSeoTitle(sot),
    '{{SOT_META_DESCRIPTION}}': getSeoMetaDescription(sot),
    '{{SOT_HERO_HEADLINE}}': h.headline,
    '{{SOT_HERO_SUBHEAD}}': h.subhead,
    '{{SOT_HERO_PRICE_TEASER}}': h.priceTeaser || '',
    '{{SOT_HERO_PRIMARY_CTA_LABEL}}': h.primaryCtaLabel,
    '{{SOT_HERO_PRIMARY_CTA_HREF}}': h.primaryCtaHref,
    '{{SOT_HERO_SECONDARY_CTA_LABEL}}': h.secondaryCtaLabel,
    '{{SOT_HERO_SECONDARY_CTA_HREF}}': h.secondaryCtaHref,
    '{{SOT_HERO_STICKY_CTA_LABEL}}': h.stickyCtaLabel || 'PDF guides',
    '{{SOT_HERO_LANE_HINT}}': h.laneHintHtml || '',
    '{{SOT_LANES_NAV_ARIA}}': (m.lanes && m.lanes.navAria) || 'On this page',
    '{{SOT_LANES_PDF_LABEL}}': (m.lanes && m.lanes.pdfLabel) || 'PDF guides',
    '{{SOT_LANES_FREE_LABEL}}': (m.lanes && m.lanes.freeLabel) || 'Free prompts',
    '{{SOT_FREE_TIER_SECTION_TITLE}}': (m.freeTier && m.freeTier.sectionTitle) || 'Free prompt toolkit',
    '{{SOT_WORKFLOW_TITLE}}': w.title,
    '{{SOT_WORKFLOW_LEDE}}': w.lede,
    '{{SOT_PDF_SECTION_TITLE}}': p.title,
    '{{SOT_PDF_SECTION_LEDE}}': p.lede,
    '{{SOT_PDF_SECTION_AUDIENCE}}': p.audienceLine || '',
    '{{SOT_PDF_SECTION_TRUST}}': p.sectionTrustHtml || '',
    '{{SOT_PDF_BEGINNER_CTA}}': p.beginnerCtaLabel || 'Buy Beginner — $5.99',
    '{{SOT_PDF_ADVANCED_CTA}}': p.advancedCtaLabel || 'Buy Advanced — $11.99',
    '{{SOT_PDF_SECTION_FREE_BRIDGE}}': p.freeBridge || '',
    '{{SOT_PDF_EXPERT_SCENARIOS_TITLE}}': (p.expertScenarios && p.expertScenarios.title) || '',
    '{{SOT_PDF_EXPERT_SCENARIOS_DISCLAIMER}}': (p.expertScenarios && p.expertScenarios.disclaimer) || '',
    '{{SOT_PDF_EXPERT_CARDS_HTML}}': buildExpertCardsHtml(sot),
    '{{SOT_FREE_TIER_LABEL}}': (m.freeTier && m.freeTier.label) || 'Free copy-paste prompts on this page',
    '{{SOT_FREE_TIER_HINT}}': (m.freeTier && m.freeTier.hint) || '',
    '{{SOT_FREE_TIER_CTA_LABEL}}': (m.freeTier && m.freeTier.ctaLabel) || '',
    '{{SOT_FREE_TIER_CTA_HREF}}': (m.freeTier && m.freeTier.ctaHref) || '#workflow-overview',
    '{{SOT_COMMUNITY_TITLE}}': (m.community && m.community.title) || 'Want more?',
    '{{SOT_COMMUNITY_TELEGRAM}}': (m.community && m.community.telegramCta) || 'Join on Telegram',
    '{{SOT_COMMUNITY_APP}}': (m.community && m.community.appCta) || 'Prompt Anatomy →',
    '{{SOT_DISCLAIMER}}': sot.legal.disclaimerShort,
    '{{SOT_BUSINESS_ADDRESS}}': renderAddressBlock(sot),
    '{{SOT_BUYER_FAQ_HTML}}': buildBuyerFaqHtml(sot),
    '{{SOT_CONTACT_EMAIL}}': email,
    '{{SOT_MOTHER_BRAND_URL}}': sot.brand.motherBrandUrl || sot.product.motherBrandUrl || 'https://www.promptanatomy.app',
  };

  Object.keys(replacements).forEach(function (token) {
    const val = replacements[token];
    if (val != null && val !== '') {
      html = replaceAllGlobal(html, token, val);
    }
  });

  return html;
}

/** Strip injected SEO between viewport and meta description so locale builds work after finalizeRootIndexHtml. */
function stripIndexForLocaleBuild(html) {
  return html.replace(
    /(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<meta name="description")/i,
    '$1$2'
  );
}

/** Strip injected SEO between viewport and <title> for privacy locale builds. */
function stripPrivacyForLocaleBuild(html) {
  return html.replace(/(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<title)/i, '$1$2');
}

/** Remove LT-only QA link block and legacy lang switcher from generated EN index (US product; /lt/ via direct URL). */
function stripLanguageSwitcher(html) {
  return html
    .replace(/\s*<div class="lt-only-qa-nav"[\s\S]*?<\/div>\s*/gi, '\n')
    .replace(/\s*<nav class="lang-switcher"[\s\S]*?<\/nav>\s*/gi, '\n');
}

function removeLegacyPrivacyOutputs() {
  const legacy = [
    path.join(ROOT, 'en', 'privatumas.html'),
    path.join(ROOT, 'privatumas.html'),
  ];
  legacy.forEach(function (file) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  });
}

// ---- Main ----
function main() {
  const sot = loadSot();
  assertNoStripePlaceholders(sot);

  let indexHtml = stripIndexForLocaleBuild(read('templates/index-lt.html'));
  let privacyHtml = stripPrivacyForLocaleBuild(read('templates/privacy.html'));

  const privacyEnDesc =
    'Prompt Anatomy – static site with US hiring prompts for HR teams. Stripe processes paid PDF purchases; Resend delivers download links.';

  let enIndex = applyEnReplacements(indexHtml);
  enIndex = applyEnPromptUi(enIndex);
  enIndex = applySot(enIndex, sot);
  enIndex = stripLanguageSwitcher(enIndex);
  enIndex = injectHead(enIndex, BASE_PATH, sot);
  write('en/index.html', enIndex);

  let enPrivacy = buildPrivacyEn(privacyHtml, sot);
  enPrivacy = injectPrivacyHead(enPrivacy, 'en/privacy.html', PRIVACY_PAGE_TITLE, privacyEnDesc);
  write('en/privacy.html', enPrivacy);

  writeRobotsAndSitemap();
  removeLegacyPrivacyOutputs();

  finalizeRootIndexHtml(sot);
  finalizeRootPrivacyHtml();

  console.log('Build done: en/index.html, en/privacy.html, privacy.html, robots.txt, sitemap.xml');
  console.log('BASE_PATH:', BASE_PATH || '(root – no subpath)');
  console.log('SITE_ORIGIN:', SITE_ORIGIN);
  console.log('SITE_PUBLIC_BASE:', SITE_PUBLIC_BASE || '(not set)');
  console.log('Absolute base:', absoluteBaseSlash());
}

main();
