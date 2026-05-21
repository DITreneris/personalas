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

/** Bump filename when busting Twitter/OG image cache (same URL = stale card). */
const OG_IMAGE_REL = 'images/og-default-v2.png';

/** Static alt text reused on og:image:alt, twitter:image:alt across all public pages. */
const OG_IMAGE_ALT = 'HR hiring PDF guides for US teams - Prompt Anatomy';

/** Browser chrome theme color (navy --accent-primary). Mirrored in manifest.webmanifest. */
const THEME_COLOR = '#103B5A';

/** Background color for the standalone manifest (light surface). */
const BG_COLOR = '#F7F8FA';

/**
 * IndexNow protocol key. Hosted at /{INDEXNOW_KEY}.txt with the same value as body,
 * referenced from robots.txt and pinged from scripts/indexnow-ping.js after deploy.
 * Key must be 8-128 chars of [a-zA-Z0-9-]; this is a stable per-site identifier.
 */
const INDEXNOW_KEY = '7a4b9e2c8f1d4a3b9c6e5d2a1f8b7c4d';

/**
 * Opt-in self-hosted fonts for LCP / privacy. Off by default because:
 *   1. Inter weight 500 (medium) is not shipped in docs/pdf-source/fonts/ yet.
 *   2. Removing Google Fonts requires en/privacy.html sub-processor disclosure update.
 * Flip with `BUILD_SELFHOST_FONTS=1 npm run build` once fonts and copy are aligned.
 */
const SELF_HOST_FONTS = process.env.BUILD_SELFHOST_FONTS === '1';

/**
 * Schema.org Person id fragment used by the Organization.founder reference and the
 * Person node in the same @graph. Stable per-site (so AI engines can dedupe).
 */
function personId(base) {
  return base + '/#tomas';
}

function organizationId(base) {
  return base + '/#organization';
}

function websiteId(base) {
  return base + '/#website';
}

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
  validateProofInside(m.pdfSection);
  if (!m.workflowOverview || !m.workflowOverview.title) {
    throw new Error('config/sot.json: marketing.workflowOverview.title is required');
  }
  validateGeoFields(sot);
}

/**
 * Validate the GEO/AI-optimization fields introduced in 2026 hardening:
 *   - sot.brand.socialProfiles (X + LinkedIn + Telegram for Organization.sameAs)
 *   - sot.brand.knowsAbout, brand.slogan, brand.logoUrl
 *   - sot.product.operatorLinkedin / operatorTwitter (Person.sameAs)
 *   - sot.pdfGuides.{beginner|advanced|bundle} description / priceUSD / priceValidUntil (Product/Offer)
 *   - sot.frontFaq (4 items, mirrors visible front FAQ for FAQPage parity)
 *   - sot.buyerFaq (5 items) — already required elsewhere; we re-check shape here for FAQPage parity.
 */
function validateGeoFields(sot) {
  const brand = sot.brand || {};
  if (!brand.slogan || typeof brand.slogan !== 'string') {
    throw new Error('config/sot.json: brand.slogan is required (Organization.slogan)');
  }
  if (!brand.logoUrl || typeof brand.logoUrl !== 'string') {
    throw new Error('config/sot.json: brand.logoUrl is required (Organization.logo)');
  }
  if (!Array.isArray(brand.knowsAbout) || brand.knowsAbout.length < 3) {
    throw new Error('config/sot.json: brand.knowsAbout must be a string array of >=3 topics');
  }
  const social = brand.socialProfiles;
  if (!social || typeof social !== 'object') {
    throw new Error('config/sot.json: brand.socialProfiles object is required');
  }
  ['telegram', 'x', 'linkedin'].forEach(function (k) {
    if (!social[k] || typeof social[k] !== 'string' || !/^https:\/\//.test(social[k])) {
      throw new Error('config/sot.json: brand.socialProfiles.' + k + ' must be an https URL');
    }
  });
  if (!brand.verification || typeof brand.verification !== 'object') {
    throw new Error('config/sot.json: brand.verification object is required (may be empty strings)');
  }
  const product = sot.product || {};
  ['operatorLinkedin', 'operatorTwitter'].forEach(function (k) {
    if (!product[k] || typeof product[k] !== 'string' || !/^https:\/\//.test(product[k])) {
      throw new Error('config/sot.json: product.' + k + ' must be an https URL');
    }
  });
  const guides = sot.pdfGuides || {};
  ['beginner', 'advanced', 'bundle'].forEach(function (key) {
    const g = guides[key];
    if (!g) throw new Error('config/sot.json: pdfGuides.' + key + ' is required');
    if (!g.description || typeof g.description !== 'string') {
      throw new Error('config/sot.json: pdfGuides.' + key + '.description is required (Product.description)');
    }
    if (!g.priceUSD || !/^\d+(\.\d{2})?$/.test(g.priceUSD)) {
      throw new Error('config/sot.json: pdfGuides.' + key + '.priceUSD must match /^\\d+(\\.\\d{2})?$/');
    }
    if (!g.priceValidUntil || !/^\d{4}-\d{2}-\d{2}$/.test(g.priceValidUntil)) {
      throw new Error('config/sot.json: pdfGuides.' + key + '.priceValidUntil must be ISO YYYY-MM-DD');
    }
    if (!g.sku || typeof g.sku !== 'string') {
      throw new Error('config/sot.json: pdfGuides.' + key + '.sku is required');
    }
  });
  if (!Array.isArray(sot.frontFaq) || sot.frontFaq.length !== 4) {
    throw new Error('config/sot.json: frontFaq must contain exactly 4 items (mirrors visible front FAQ)');
  }
  if (!Array.isArray(sot.buyerFaq) || sot.buyerFaq.length !== 5) {
    throw new Error('config/sot.json: buyerFaq must contain exactly 5 items');
  }
  [['frontFaq', sot.frontFaq], ['buyerFaq', sot.buyerFaq]].forEach(function ([name, list]) {
    list.forEach(function (item, idx) {
      if (!item || typeof item !== 'object' || !item.q || !item.a) {
        throw new Error('config/sot.json: ' + name + '[' + idx + '] must have q and a fields');
      }
    });
  });
}

function validateExpertScenarios(pdfSection) {
  const es = pdfSection && pdfSection.expertScenarios;
  if (!es) {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios is required (3 illustrative cards)');
  }
  if (!es.title || typeof es.title !== 'string') {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios.title is required');
  }
  if (!es.sectionBadgeLabel || typeof es.sectionBadgeLabel !== 'string') {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios.sectionBadgeLabel is required (e.g. "Sample workflows")');
  }
  if (!es.disclaimer || typeof es.disclaimer !== 'string') {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios.disclaimer is required (FTC-safe: e.g. "not paid endorsements")');
  }
  if (!Array.isArray(es.cards) || es.cards.length !== 3) {
    throw new Error('config/sot.json: marketing.pdfSection.expertScenarios.cards must contain exactly 3 items');
  }
  const requiredCardKeys = ['approach', 'quote', 'outcome', 'name', 'role', 'region'];
  es.cards.forEach(function (card, idx) {
    if (!card || typeof card !== 'object') {
      throw new Error('config/sot.json: expertScenarios.cards[' + idx + '] must be an object');
    }
    for (const key of requiredCardKeys) {
      if (!card[key] || typeof card[key] !== 'string') {
        throw new Error('config/sot.json: expertScenarios.cards[' + idx + '].' + key + ' is required');
      }
    }
    if (card.initials != null) {
      if (typeof card.initials !== 'string' || !/^[A-Z]{2}$/.test(card.initials)) {
        throw new Error('config/sot.json: expertScenarios.cards[' + idx + '].initials must be 2 uppercase letters (or omitted)');
      }
    }
  });
}

const ALLOWED_PREVIEW_TRIGGERS = ['beginner', 'advanced', 'bundle'];

function validateProofInside(pdfSection) {
  const pi = pdfSection && pdfSection.proofInside;
  if (!pi) {
    throw new Error('config/sot.json: marketing.pdfSection.proofInside is required (3 product-proof cards)');
  }
  if (!pi.title || typeof pi.title !== 'string') {
    throw new Error('config/sot.json: marketing.pdfSection.proofInside.title is required');
  }
  if (!pi.lede || typeof pi.lede !== 'string') {
    throw new Error('config/sot.json: marketing.pdfSection.proofInside.lede is required');
  }
  if (!Array.isArray(pi.items) || pi.items.length !== 3) {
    throw new Error('config/sot.json: marketing.pdfSection.proofInside.items must contain exactly 3 items');
  }
  const requiredItemKeys = ['id', 'label', 'blurb', 'thumbnail', 'thumbnailAlt', 'previewTrigger', 'guideRef'];
  pi.items.forEach(function (item, idx) {
    if (!item || typeof item !== 'object') {
      throw new Error('config/sot.json: proofInside.items[' + idx + '] must be an object');
    }
    for (const key of requiredItemKeys) {
      if (!item[key] || typeof item[key] !== 'string') {
        throw new Error('config/sot.json: proofInside.items[' + idx + '].' + key + ' is required');
      }
    }
    if (!item.thumbnail.startsWith('/assets/pdf-covers/')) {
      throw new Error('config/sot.json: proofInside.items[' + idx + '].thumbnail must start with /assets/pdf-covers/');
    }
    if (ALLOWED_PREVIEW_TRIGGERS.indexOf(item.previewTrigger) === -1) {
      throw new Error('config/sot.json: proofInside.items[' + idx + '].previewTrigger must be one of ' + ALLOWED_PREVIEW_TRIGGERS.join(', '));
    }
    const thumbAbs = path.join(ROOT, item.thumbnail.replace(/^\//, ''));
    if (!fs.existsSync(thumbAbs)) {
      throw new Error('config/sot.json: proofInside.items[' + idx + '].thumbnail file not found on disk: ' + item.thumbnail);
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

function deriveInitials(name) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
      const outcome = escapeHtmlText(card.outcome);
      const name = escapeHtmlText(card.name);
      const role = escapeHtmlText(card.role);
      const region = escapeHtmlText(card.region);
      const initials = escapeHtmlText(card.initials || deriveInitials(card.name));
      return (
        '<li class="pdf-expert-card ' + elev + '" role="listitem">' +
          '<header class="pdf-expert-card__header">' +
            '<span class="pdf-expert-card__avatar" aria-hidden="true">' + initials + '</span>' +
            '<span class="pdf-expert-card__approach">' + approach + '</span>' +
          '</header>' +
          '<blockquote class="pdf-expert-card__quote">' + quote + '</blockquote>' +
          '<p class="pdf-expert-card__outcome"><strong>Result:</strong> ' + outcome + '</p>' +
          '<footer class="pdf-expert-card__meta">' +
            '<strong>' + name + '</strong>' +
            '<span>' + role + ' &middot; ' + region + '</span>' +
          '</footer>' +
        '</li>'
      );
    })
    .join('');
}

/**
 * Render the "What's inside the paid PDFs" 3-card grid that sits between
 * .pdf-guides-grid and #pdf-guides-faq. Each card's <button data-preview-trigger>
 * reuses the existing pdfPreviewDialog wired in generator.js initPdfPreviewDialog
 * — no new JS needed; analytics events flow through the [data-analytics] listener.
 */
function buildProofInsideHtml(sot) {
  const pi =
    sot && sot.marketing && sot.marketing.pdfSection &&
    sot.marketing.pdfSection.proofInside;
  if (!pi || !Array.isArray(pi.items) || !pi.items.length) return '';
  const title = escapeHtmlText(pi.title);
  const lede = escapeHtmlText(pi.lede);
  const cards = pi.items
    .map(function (item) {
      const label = escapeHtmlText(item.label);
      const blurb = escapeHtmlText(item.blurb);
      const thumb = escapeHtmlText(item.thumbnail);
      const thumbAlt = escapeHtmlText(item.thumbnailAlt);
      const trigger = escapeHtmlText(item.previewTrigger);
      const guideRef = escapeHtmlText(item.guideRef);
      const ariaLabel = escapeHtmlText('Preview ' + item.label + ' sample pages');
      return (
        '<li class="pdf-proof-inside__card">' +
          '<button type="button" class="pdf-proof-inside__media"' +
            ' data-preview-trigger="' + trigger + '"' +
            ' data-analytics="pdf_proof_preview_open"' +
            ' aria-label="' + ariaLabel + '">' +
            '<img src="' + thumb + '" alt="' + thumbAlt + '" loading="lazy" decoding="async" />' +
            '<span class="pdf-proof-inside__media-overlay" aria-hidden="true">Preview pages &rarr;</span>' +
          '</button>' +
          '<div class="pdf-proof-inside__body">' +
            '<p class="pdf-proof-inside__guide-ref">' + guideRef + '</p>' +
            '<h4 class="pdf-proof-inside__label">' + label + '</h4>' +
            '<p class="pdf-proof-inside__blurb">' + blurb + '</p>' +
          '</div>' +
        '</li>'
      );
    })
    .join('');
  return (
    '<section class="pdf-proof-inside" id="pdf-proof-inside" aria-labelledby="pdf-proof-inside-title">' +
      '<header class="pdf-proof-inside__header">' +
        '<h3 id="pdf-proof-inside-title" class="pdf-proof-inside__title">' + title + '</h3>' +
        '<p class="pdf-proof-inside__lede">' + lede + '</p>' +
      '</header>' +
      '<ul class="pdf-proof-inside__grid" role="list">' + cards + '</ul>' +
    '</section>'
  );
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

/**
 * Build Organization + Person nodes consumed by both the locale-built pages
 * (en/index.html via buildJsonLdWebsiteGraph) and the root gateway SEO fragment
 * (buildRootSeoFragment). Shared so sameAs / contactPoint / founder ref stay in lockstep.
 */
function buildOrganizationAndPersonNodes(sot, base) {
  const brand = (sot && sot.brand) || {};
  const product = (sot && sot.product) || {};
  const contactEmail = product.contactEmail || '';
  const social = brand.socialProfiles || {};
  const sameAsRaw = [social.telegram, brand.motherBrandUrl, social.x, social.linkedin].filter(Boolean);
  const sameAs = Array.from(new Set(sameAsRaw));
  const personSameAs = Array.from(
    new Set([product.operatorLinkedin, product.operatorTwitter].filter(Boolean))
  );

  const org = {
    '@type': 'Organization',
    '@id': organizationId(base),
    name: brand.publicName || 'Prompt Anatomy',
    url: base + '/',
    sameAs: sameAs.length ? sameAs : ['https://t.me/prompt_anatomy'],
  };
  if (brand.logoUrl) org.logo = brand.logoUrl;
  if (brand.slogan) org.slogan = brand.slogan;
  if (sot && sot.legal && sot.legal.metaDescription) {
    org.description = sot.legal.metaDescription;
  }
  if (Array.isArray(brand.knowsAbout) && brand.knowsAbout.length) {
    org.knowsAbout = brand.knowsAbout.slice();
  }
  if (contactEmail) {
    org.email = contactEmail;
    org.contactPoint = {
      '@type': 'ContactPoint',
      email: contactEmail,
      contactType: 'customer support',
      availableLanguage: ['en'],
    };
  }
  if (product.businessAddress) {
    org.address = buildPostalAddressJsonLd(sot);
  }
  if (product.operatorName) {
    org.founder = { '@id': personId(base) };
  }

  const person = product.operatorName
    ? {
        '@type': 'Person',
        '@id': personId(base),
        name: product.operatorName,
        jobTitle: 'Operator',
        worksFor: { '@id': organizationId(base) },
        sameAs: personSameAs.length ? personSameAs : undefined,
      }
    : null;
  if (person && !person.sameAs) delete person.sameAs;

  return { org: org, person: person };
}

function buildJsonLdWebsiteGraph(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const { org, person } = buildOrganizationAndPersonNodes(sot, base);
  const website = {
    '@type': 'WebSite',
    '@id': websiteId(base),
    name: 'Prompt Anatomy – US hiring prompts',
    url: base + '/',
    inLanguage: ['en-US'],
    publisher: { '@id': organizationId(base) },
  };
  const graph = person ? [website, org, person] : [website, org];
  return (
    '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
    '</script>'
  );
}

/**
 * WebPage node + optional BreadcrumbList (Home -> page). The speakable
 * SpeakableSpecification points voice-mode assistants (Siri / Alexa / ChatGPT voice)
 * at the H1 and known lede selectors so they read the right copy aloud.
 *
 * @param {string} pageUrl       Absolute canonical URL of this page.
 * @param {string} name          Page title (matches <title>).
 * @param {string} description   Meta description (matches <meta name="description">).
 * @param {object} [opts]
 * @param {string} [opts.breadcrumbLabel]  If set, emits a BreadcrumbList Home -> {label}.
 */
function buildJsonLdWebPage(pageUrl, name, description, opts) {
  opts = opts || {};
  const siteBase = absoluteBaseSlash().replace(/\/+$/, '');
  const webPage = {
    '@type': 'WebPage',
    name: name,
    description: description,
    url: pageUrl,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', url: siteBase + '/' },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.pdf-guides-lede', '.pdf-guide-desc', '.intro'],
    },
  };
  const graph = [webPage];
  if (opts.breadcrumbLabel) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteBase + '/en/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: opts.breadcrumbLabel,
          item: pageUrl,
        },
      ],
    });
  }
  return (
    '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
    '</script>'
  );
}

/**
 * Strip simple HTML tags + entity-decode a few common entities so JSON-LD
 * answer.text equals the visible plain-text answer (Google requires parity
 * between FAQPage acceptedAnswer.text and the rendered FAQ panel text).
 */
function stripFaqHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * FAQPage JSON-LD aggregating frontFaq (4) + buyerFaq (5) so visible FAQ text
 * has an entity-linked structured equivalent. Per 2026 GEO research, FAQPage
 * markup yields 3.2x AI Overview citations vs. plain text.
 */
function buildJsonLdFaqPage(sot) {
  const front = (sot && Array.isArray(sot.frontFaq)) ? sot.frontFaq : [];
  const buyer = (sot && Array.isArray(sot.buyerFaq)) ? sot.buyerFaq : [];
  const all = front.concat(buyer);
  if (!all.length) return '';
  const questions = all.map(function (item) {
    return {
      '@type': 'Question',
      name: stripFaqHtml(item.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: stripFaqHtml(item.a),
      },
    };
  });
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions,
  };
  return (
    '<script type="application/ld+json">' +
    JSON.stringify(payload).replace(/</g, '\\u003c') +
    '</script>'
  );
}

/**
 * Product + Offer JSON-LD for one PDF guide. Wraps the seller in a stable
 * Organization @id reference so it dedupes with the WebSite graph.
 * NO aggregateRating intentionally (no real reviews; faking it is a Google penalty).
 */
function buildProductNode(guide, sot, base) {
  if (!guide) return null;
  const product = sot.product || {};
  const coverPath = guide.coverImage || (guide.previewPrefix
    ? '/assets/pdf-covers/' + guide.previewPrefix + '.png'
    : '/assets/pdf-covers/beginner.png');
  const image = base + coverPath;
  const sku = guide.sku || guide.id || 'unknown';
  const node = {
    '@type': 'Product',
    '@id': base + '/en/#product-' + sku,
    name: guide.title,
    description: guide.description,
    image: image,
    sku: sku,
    category: 'HR / Hiring guides',
    isAccessibleForFree: false,
    inLanguage: 'en-US',
    brand: { '@id': organizationId(base) },
    audience: { '@type': 'BusinessAudience', audienceType: 'US HR teams' },
  };
  if (typeof guide.pages === 'number' && guide.pages > 0) {
    node.numberOfPages = guide.pages;
  }
  const seller = {
    '@type': 'Organization',
    '@id': organizationId(base),
    name: (sot.brand && sot.brand.publicName) || 'Prompt Anatomy',
  };
  if (product.businessAddress) {
    seller.address = buildPostalAddressJsonLd(sot);
  }
  node.offers = {
    '@type': 'Offer',
    price: guide.priceUSD,
    priceCurrency: 'USD',
    priceValidUntil: guide.priceValidUntil,
    availability: 'https://schema.org/InStock',
    url: base + '/en/#pdf-guides',
    itemCondition: 'https://schema.org/NewCondition',
    seller: seller,
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'US',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 14,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn',
    },
  };
  return node;
}

function buildJsonLdProducts(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const guides = (sot && sot.pdfGuides) || {};
  const order = ['beginner', 'advanced', 'bundle'];
  const nodes = order
    .map(function (key) { return buildProductNode(guides[key], sot, base); })
    .filter(Boolean);
  if (!nodes.length) return '';
  return nodes
    .map(function (node) {
      const payload = { '@context': 'https://schema.org' };
      Object.keys(node).forEach(function (k) { payload[k] = node[k]; });
      return (
        '<script type="application/ld+json">' +
        JSON.stringify(payload).replace(/</g, '\\u003c') +
        '</script>'
      );
    })
    .join('\n    ');
}

/** Read `git log -1 --format=%cs <file>` for an accurate sitemap <lastmod>. */
function gitLastModified(relPath) {
  try {
    const { execFileSync } = require('child_process');
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', relPath], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch (_e) {
    /* git missing, shallow clone, or untracked file -- fall through */
  }
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/**
 * llms.txt -- short (<5 KB) machine-friendly site map for AI assistants
 * (Anthropic + Perplexity actively read it; Google says not required).
 * Format per 2026 best practice: H1 + blockquote summary + sections by function.
 */
function buildLlmsTxt(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const brand = (sot && sot.brand) || {};
  const product = (sot && sot.product) || {};
  const guides = (sot && sot.pdfGuides) || {};
  const beginner = guides.beginner || {};
  const advanced = guides.advanced || {};
  const bundle = guides.bundle || {};
  const summary =
    (brand.publicName || 'Prompt Anatomy') +
    ' publishes free copy-paste AI prompts and paid PDF playbooks that help US HR teams run a repeatable hiring loop (Diagnose, Define, Source, Screen, Offer, Onboard). ' +
    'Operated by ' + (product.operatorName || 'Tomas Staniulis') +
    ' from ' + (product.businessAddress ? (product.businessAddress.city + ', ' + product.businessAddress.region) : 'the United States') +
    '. Site is English-only; paid PDFs delivered via Stripe with 14-day refund.';
  const lines = [
    '# ' + (brand.publicName || 'Prompt Anatomy') + ' - US HR hiring prompts and PDF guides',
    '',
    '> ' + summary,
    '',
    '## Free resources',
    '- [Landing - 10 free prompts and 6-phase workflow](' + base + '/en/)',
    '- [Full prompt digest (markdown)](' + base + '/llms-full.txt)',
    '',
    '## Paid PDF guides',
    '- [' + (beginner.title || 'Beginner HR Hiring Guide') + ' - $' + (beginner.priceUSD || '5.99') +
      ' - ' + (beginner.pages || 16) + ' pages](' + base + '/en/#pdf-guides)',
    '- [' + (advanced.title || 'Advanced HR Hiring Guide') + ' - $' + (advanced.priceUSD || '11.99') +
      ' - ' + (advanced.pages || 32) + ' pages](' + base + '/en/#pdf-guides)',
    '- [' + (bundle.title || 'Both HR Hiring Guides') + ' (Beginner + Advanced) - $' +
      (bundle.priceUSD || '15.99') + '](' + base + '/en/#pdf-guides)',
    '',
    '## Policies',
    '- [Privacy](' + base + '/en/privacy.html)',
    '- [Terms - Personal license, 14-day refund](' + base + '/terms.html)',
    '',
    '## Contact',
    '- Email: ' + (product.contactEmail || 'info@promptanatomy.app'),
    '',
  ];
  return lines.join('\n');
}

/**
 * llms-full.txt -- exhaustive markdown digest of the 10 free prompts and the
 * 6-phase workflow, generated from the EN PROMPTS_EN array below. Long-form
 * counterpart to llms.txt; ~15 KB, intended for AI assistants that follow
 * the secondary link from llms.txt.
 */
function buildLlmsFullTxt(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const brand = (sot && sot.brand) || {};
  const PHASE_LABELS = [
    'Diagnose',
    'Define the Role',
    'Source Candidates',
    'Screen & Interview',
    'Close the Offer',
    'Close the Offer',
    'Close the Offer',
    'Onboard & Retain',
    'Onboard & Retain',
    'Onboard & Retain',
  ];
  const TITLES = [
    'Where are we stuck?',
    'Who really fits us?',
    'Rewrite the job ad in plain language',
    'How to find more people today?',
    'How to run a better interview?',
    'Why do candidates decline?',
    'How to present the offer better?',
    'How to support a new hire in the first 3 months?',
    'Why do people leave?',
    'Master prompt (one for everything)',
  ];
  const out = [
    '# ' + (brand.publicName || 'Prompt Anatomy') + ' - Full prompt digest',
    '',
    'Source: ' + base + '/en/',
    'License: free for personal and team use. Attribution appreciated; do not republish in bulk.',
    '',
    '## 6-phase hiring workflow',
    '',
    '1. Diagnose',
    '2. Define the Role',
    '3. Source Candidates',
    '4. Screen & Interview',
    '5. Close the Offer',
    '6. Onboard & Retain',
    '',
    '## 10 free prompts',
    '',
  ];
  for (let i = 0; i < PROMPTS_EN.length; i++) {
    out.push('### Prompt ' + (i + 1) + ': ' + TITLES[i] + ' (Phase: ' + PHASE_LABELS[i] + ')');
    out.push('');
    out.push('```');
    out.push(PROMPTS_EN[i]);
    out.push('```');
    out.push('');
  }
  out.push('## Paid PDF guides (commercial; do not redistribute)');
  out.push('');
  out.push('See ' + base + '/llms.txt for the short index.');
  out.push('');
  return out.join('\n');
}

function writeLlmsTxt(sot) {
  write('llms.txt', buildLlmsTxt(sot));
  write('llms-full.txt', buildLlmsFullTxt(sot));
}

/** /<key>.txt for the IndexNow protocol (Bing, Yandex, ChatGPT Search backend). */
function writeIndexNowKey() {
  write(INDEXNOW_KEY + '.txt', INDEXNOW_KEY + '\n');
}

/**
 * BUILD_SELFHOST_FONTS=1 opt-in path: copy woff2 files from docs/pdf-source/fonts
 * into assets/fonts and emit a tiny assets/fonts.css with @font-face declarations.
 * Returns true if fonts.css was written so callers can swap the Google Fonts link.
 *
 * Inter weights mapped: 400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold).
 * Weight 500 is intentionally absent in the source set; browsers synthesize from 400.
 * JetBrains Mono weights: 500 (Regular -> medium), 600 (SemiBold).
 */
function writeSelfHostedFonts() {
  if (!SELF_HOST_FONTS) return false;
  const srcDir = path.join(ROOT, 'docs', 'pdf-source', 'fonts');
  const dstDir = path.join(ROOT, 'assets', 'fonts');
  if (!fs.existsSync(srcDir)) {
    console.warn('BUILD_SELFHOST_FONTS=1 but ' + srcDir + ' not found -- skipping');
    return false;
  }
  ensureDir(dstDir);
  const mapping = [
    { src: 'Inter-Regular.woff2', dst: 'Inter-Regular.woff2', family: 'Inter', weight: 400 },
    { src: 'Inter-SemiBold.woff2', dst: 'Inter-SemiBold.woff2', family: 'Inter', weight: 600 },
    { src: 'Inter-Bold.woff2', dst: 'Inter-Bold.woff2', family: 'Inter', weight: 700 },
    { src: 'Inter-ExtraBold.woff2', dst: 'Inter-ExtraBold.woff2', family: 'Inter', weight: 800 },
    { src: 'JetBrainsMono-Regular.woff2', dst: 'JetBrainsMono-Regular.woff2', family: 'JetBrains Mono', weight: 500 },
    { src: 'JetBrainsMono-SemiBold.woff2', dst: 'JetBrainsMono-SemiBold.woff2', family: 'JetBrains Mono', weight: 600 },
  ];
  const usable = [];
  mapping.forEach(function (m) {
    const srcPath = path.join(srcDir, m.src);
    if (!fs.existsSync(srcPath)) return;
    fs.copyFileSync(srcPath, path.join(dstDir, m.dst));
    usable.push(m);
  });
  if (!usable.length) {
    console.warn('BUILD_SELFHOST_FONTS=1 but no woff2 files copied -- skipping');
    return false;
  }
  const css = usable
    .map(function (m) {
      return (
        '@font-face {\n' +
        '  font-family: "' + m.family + '";\n' +
        '  font-style: normal;\n' +
        '  font-weight: ' + m.weight + ';\n' +
        '  font-display: swap;\n' +
        '  src: url("/assets/fonts/' + m.dst + '") format("woff2");\n' +
        '  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n' +
        '}'
      );
    })
    .join('\n\n') + '\n';
  write('assets/fonts.css', css);
  return true;
}

/**
 * When self-hosting is enabled, strip Google Fonts preconnects + stylesheet
 * link from the generated HTML and replace with our local fonts.css link.
 * No-op when SELF_HOST_FONTS is false (default), so existing behavior unchanged.
 */
function swapGoogleFontsForSelfHosted(html, isLocalePath) {
  if (!SELF_HOST_FONTS) return html;
  const localRel = isLocalePath ? '../assets/fonts.css' : '/assets/fonts.css';
  return html
    .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/i, '')
    .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/i, '')
    .replace(
      /<link href="https:\/\/fonts\.googleapis\.com\/css2[^"]*" rel="stylesheet">/i,
      '<link rel="stylesheet" href="' + localRel + '">'
    );
}

/** Minimal PWA manifest so Android share targets and theme color resolve correctly. */
function writeManifest(sot) {
  const brand = (sot && sot.brand) || {};
  const manifest = {
    name: brand.publicName || 'Prompt Anatomy',
    short_name: brand.publicName || 'Prompt Anatomy',
    description: (sot && sot.legal && sot.legal.metaDescription) || '',
    start_url: '/en/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: BG_COLOR,
    theme_color: THEME_COLOR,
    lang: 'en-US',
    icons: [
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
  write('manifest.webmanifest', JSON.stringify(manifest, null, 2) + '\n');
}

/**
 * 404.html -- noindex, EN-only, links back to /en/. Vercel serves this when no
 * route matches; cached for 5 minutes per vercel.json.
 */
function write404Html(sot) {
  const brand = (sot && sot.brand) || {};
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const html =
    '<!DOCTYPE html>\n' +
    '<html lang="en-US">\n' +
    '<head>\n' +
    '    <meta charset="UTF-8">\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '    <meta name="robots" content="noindex, follow">\n' +
    '    <link rel="canonical" href="' + escapeHtmlAttr(base + '/en/') + '">\n' +
    '    <meta name="description" content="Page not found. Continue to the Prompt Anatomy English landing.">\n' +
    '    <meta name="theme-color" content="' + THEME_COLOR + '">\n' +
    '    <title>Page not found - ' + escapeHtmlAttr(brand.publicName || 'Prompt Anatomy') + '</title>\n' +
    '    <link rel="icon" href="/favicon.ico" sizes="any">\n' +
    '    <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n' +
    '    <link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
    '    <link rel="manifest" href="/manifest.webmanifest">\n' +
    '    <link rel="stylesheet" href="/assets/styles.css">\n' +
    '    <style>\n' +
    '        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg, #F7F8FA); color: var(--text, #1A202C); padding: 48px 20px; line-height: 1.55; }\n' +
    '        main { max-width: 36rem; margin: 0 auto; }\n' +
    '        h1 { font-size: clamp(1.75rem, 4vw, 2.25rem); margin: 0 0 16px; letter-spacing: -0.02em; }\n' +
    '        ul { padding-left: 1.25rem; }\n' +
    '        a { color: var(--accent-primary, #103B5A); font-weight: 600; }\n' +
    '        a:focus-visible { outline: var(--ring-focus, 3px solid #cfa73a); outline-offset: 2px; }\n' +
    '    </style>\n' +
    '    <script defer src="/_vercel/insights/script.js"></script>\n' +
    '    <script defer src="/_vercel/speed-insights/script.js"></script>\n' +
    '</head>\n' +
    '<body>\n' +
    '    <main>\n' +
    '        <h1>Page not found.</h1>\n' +
    '        <p>The page you requested does not exist. It may have moved, or the link may be out of date.</p>\n' +
    '        <ul>\n' +
    '            <li><a href="/en/">Continue to the Prompt Anatomy landing</a></li>\n' +
    '            <li><a href="/en/privacy.html">Privacy</a></li>\n' +
    '            <li><a href="/terms.html">Terms</a></li>\n' +
    '        </ul>\n' +
    '    </main>\n' +
    '</body>\n' +
    '</html>\n';
  write('404.html', html);
}

/**
 * Optional GSC + Bing Webmaster verification meta tags. Emitted only when
 * sot.brand.verification.{google|bing} is a non-empty string -- keeps the
 * SOT shape stable without leaking blanks into HTML.
 */
function buildVerificationMeta(sot) {
  const v = (sot && sot.brand && sot.brand.verification) || {};
  const out = [];
  if (v.google && typeof v.google === 'string' && v.google.trim()) {
    out.push('<meta name="google-site-verification" content="' + escapeHtmlAttr(v.google.trim()) + '">');
  }
  if (v.bing && typeof v.bing === 'string' && v.bing.trim()) {
    out.push('<meta name="msvalidate.01" content="' + escapeHtmlAttr(v.bing.trim()) + '">');
  }
  return out.join('\n    ');
}

/**
 * Shared meta robots + manifest + theme-color block injected into every public
 * page so AI engines can render unlimited snippets and large image previews
 * (which is the difference between being mentioned and being prominently shown
 * in AI Overviews).
 */
const ROBOTS_META = '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">';

// ---- Inject SEO and script path ----
function injectHead(html, basePath, sot) {
  const abs = absoluteBaseSlash();
  const canonicalUrl = abs + 'en/';
  const linkCanonical = '<link rel="canonical" href="' + escapeHtmlAttr(canonicalUrl) + '">';
  const linkEn = '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(canonicalUrl) + '">';
  const linkDefault = '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(canonicalUrl) + '">';
  const linkManifest = '<link rel="manifest" href="/manifest.webmanifest">';
  const metaThemeColor = '<meta name="theme-color" content="' + THEME_COLOR + '">';
  const title = extractTitle(html);
  const description = extractMetaDescription(html);
  const ogTitle = sot ? getSeoOgTitle(sot) : title;
  const ogImage = abs + OG_IMAGE_REL;
  const brandName = (sot && sot.brand && sot.brand.publicName) || 'Prompt Anatomy';

  const socialBlock = [
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + escapeHtmlAttr(brandName) + '">',
    '<meta property="og:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@promptanatom">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta name="twitter:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta name="twitter:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
  ].join('\n    ');

  const jsonLd = buildJsonLdWebsiteGraph(sot);
  const faqJsonLd = buildJsonLdFaqPage(sot);
  const productsJsonLd = buildJsonLdProducts(sot);
  const verification = buildVerificationMeta(sot);
  const seoBlock =
    '\n    ' +
    [
      ROBOTS_META,
      linkCanonical,
      linkEn,
      linkDefault,
      linkManifest,
      metaThemeColor,
      socialBlock,
      jsonLd,
      faqJsonLd,
      productsJsonLd,
      verification,
    ]
      .filter(Boolean)
      .join('\n    ') +
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
  html = swapGoogleFontsForSelfHosted(html, true);
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

function injectPrivacyHead(html, pathSuffix, title, description, opts) {
  opts = opts || {};
  const abs = absoluteBaseSlash();
  const canonicalUrl = abs + pathSuffix;
  const ogImage = abs + OG_IMAGE_REL;
  const brandName = (opts.sot && opts.sot.brand && opts.sot.brand.publicName) || 'Prompt Anatomy';
  const block = [
    ROBOTS_META,
    '<link rel="canonical" href="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<link rel="manifest" href="/manifest.webmanifest">',
    '<meta name="theme-color" content="' + THEME_COLOR + '">',
    '<meta name="description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + escapeHtmlAttr(brandName) + '">',
    '<meta property="og:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@promptanatom">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta name="twitter:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta name="twitter:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
    buildJsonLdWebPage(canonicalUrl, title, description, { breadcrumbLabel: opts.breadcrumbLabel }),
    buildVerificationMeta(opts.sot),
  ]
    .filter(Boolean)
    .join('\n    ');
  return html.replace(/(<meta name="viewport"[^>]*>\s*)(<title)/i, '$1' + block + '\n    $2');
}

/**
 * 2026 AI-crawler policy. Three classes:
 *   1. ALLOW search/citation bots that drive referral traffic.
 *   2. ALLOW-with-carveouts for training-capable bots: keep landing crawlable
 *      so our brand appears in AI answers, but block /assets/samples/,
 *      /assets/pdf-covers/, and /api/ so PDF sample content + admin endpoints
 *      do not flow into training datasets.
 *   3. BLOCK fully for training-only crawlers with no useful referral output.
 *
 * Always pair with Disallow: /api/ in the default block (no robot needs admin
 * endpoints). Reference INDEXNOW_KEY so bots that respect IndexNow can validate.
 */
function buildRobotsTxt(absRoot) {
  const sitemapUrl = absRoot + '/sitemap.xml';
  const indexNowLoc = absRoot + '/' + INDEXNOW_KEY + '.txt';

  const allowSearch = ['OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'Applebot-Extended'];
  const allowWithCarveouts = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Amazonbot'];
  const blockAll = ['anthropic-ai', 'cohere-ai', 'CCBot', 'Bytespider', 'Meta-ExternalAgent'];

  const blocks = [];
  blocks.push('# Search and citation bots -- ALLOW (drives referral traffic to PDFs).');
  allowSearch.forEach(function (ua) {
    blocks.push('User-agent: ' + ua);
    blocks.push('Allow: /');
    blocks.push('');
  });

  blocks.push('# Training-capable bots -- ALLOW landing, DISALLOW paid PDF surfaces and admin endpoints.');
  allowWithCarveouts.forEach(function (ua) {
    blocks.push('User-agent: ' + ua);
    blocks.push('Disallow: /assets/samples/');
    blocks.push('Disallow: /assets/pdf-covers/');
    blocks.push('Disallow: /api/');
    blocks.push('Allow: /');
    blocks.push('');
  });

  blocks.push('# Training-only crawlers with no useful referral -- BLOCK.');
  blockAll.forEach(function (ua) {
    blocks.push('User-agent: ' + ua);
    blocks.push('Disallow: /');
    blocks.push('');
  });

  blocks.push('# Default policy for all other bots (Googlebot, Bingbot, etc.).');
  blocks.push('User-agent: *');
  blocks.push('Disallow: /api/');
  blocks.push('Allow: /');
  blocks.push('');

  blocks.push('Sitemap: ' + sitemapUrl);
  blocks.push('# IndexNow: ' + indexNowLoc);
  blocks.push('');

  return blocks.join('\n');
}

/**
 * Sitemap entries with optional <lastmod> and <image:image> children. Source
 * file used for lastmod is provided by caller so git history of templates and
 * built outputs both flow into Google's freshness signal.
 */
function buildSitemapXml(absRoot, sot) {
  const entries = [
    { loc: absRoot + '/en/', lastmodSrc: 'templates/index-lt.html', images: [
      { loc: absRoot + '/' + OG_IMAGE_REL, caption: 'HR hiring PDF guides for US teams - Prompt Anatomy' },
      { loc: absRoot + '/assets/pdf-covers/beginner.png', caption: 'Cover of Beginner HR Hiring Guide PDF' },
      { loc: absRoot + '/assets/pdf-covers/advanced.png', caption: 'Cover of Advanced HR Hiring Guide PDF' },
    ] },
    { loc: absRoot + '/', lastmodSrc: 'index.html' },
    { loc: absRoot + '/privacy.html', lastmodSrc: 'templates/privacy-gateway.html' },
    { loc: absRoot + '/en/privacy.html', lastmodSrc: 'templates/privacy.html' },
    { loc: absRoot + '/terms.html', lastmodSrc: 'terms.html' },
    { loc: absRoot + '/success.html', lastmodSrc: 'success.html' },
  ];

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];
  entries.forEach(function (e) {
    lines.push('  <url>');
    lines.push('    <loc>' + e.loc + '</loc>');
    const lm = gitLastModified(e.lastmodSrc);
    if (lm) lines.push('    <lastmod>' + lm + '</lastmod>');
    if (Array.isArray(e.images)) {
      e.images.forEach(function (img) {
        lines.push('    <image:image>');
        lines.push('      <image:loc>' + img.loc + '</image:loc>');
        if (img.caption) lines.push('      <image:caption>' + escapeHtmlText(img.caption) + '</image:caption>');
        lines.push('    </image:image>');
      });
    }
    lines.push('  </url>');
  });
  lines.push('</urlset>');
  lines.push('');

  // sot is reserved for future per-product entries (sample PDFs once linkable).
  void sot;
  return lines.join('\n');
}

function writeRobotsAndSitemap(sot) {
  const abs = absoluteBaseSlash().replace(/\/+$/, '');
  write('robots.txt', buildRobotsTxt(abs));
  write('sitemap.xml', buildSitemapXml(abs, sot));
}

function buildRootSeoFragment(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const img = base + '/' + OG_IMAGE_REL;
  const enLanding = base + '/en/';
  const desc = getSeoMetaDescription(sot);
  const ogTitle = getSeoOgTitle(sot);
  const brandName = (sot.brand && sot.brand.publicName) || 'Prompt Anatomy';
  const { org, person } = buildOrganizationAndPersonNodes(sot, base);
  const website = {
    '@type': 'WebSite',
    '@id': websiteId(base),
    name: brandName + ' – US hiring prompts',
    url: base + '/',
    inLanguage: ['en-US'],
    publisher: { '@id': organizationId(base) },
  };
  const graph = person ? [website, org, person] : [website, org];
  const verification = buildVerificationMeta(sot);
  const lines = [
    '<meta http-equiv="refresh" content="0; url=en/">',
    ROBOTS_META,
    '<link rel="canonical" href="' + escapeHtmlAttr(enLanding) + '">',
    '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(enLanding) + '">',
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(enLanding) + '">',
    '<link rel="manifest" href="/manifest.webmanifest">',
    '<meta name="theme-color" content="' + THEME_COLOR + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + escapeHtmlAttr(brandName) + '">',
    '<meta property="og:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(enLanding) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@promptanatom">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(ogTitle) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<meta name="twitter:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
    '<script type="application/ld+json">' +
      JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
      '</script>',
  ];
  if (verification) lines.push(verification);
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

function buildRootPrivacyFragment(sot) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const img = base + '/' + OG_IMAGE_REL;
  const enPrivacyUrl = base + '/en/privacy.html';
  const brandName = (sot && sot.brand && sot.brand.publicName) || 'Prompt Anatomy';
  const desc =
    'Prompt Anatomy – static site with US hiring prompts for HR teams. Stripe processes paid PDF purchases; Resend delivers download links.';
  const verification = buildVerificationMeta(sot);
  const lines = [
    '<meta http-equiv="refresh" content="0; url=en/privacy.html">',
    ROBOTS_META,
    '<link rel="canonical" href="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<link rel="manifest" href="/manifest.webmanifest">',
    '<meta name="theme-color" content="' + THEME_COLOR + '">',
    '<meta name="description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="' + escapeHtmlAttr(brandName) + '">',
    '<meta property="og:title" content="Privacy Policy – Prompt Anatomy">',
    '<meta property="og:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(enPrivacyUrl) + '">',
    '<meta property="og:locale" content="en_US">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@promptanatom">',
    '<meta name="twitter:title" content="Privacy Policy – Prompt Anatomy">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<meta name="twitter:image:alt" content="' + escapeHtmlAttr(OG_IMAGE_ALT) + '">',
    buildJsonLdWebPage(enPrivacyUrl, 'Privacy Policy – ' + brandName, desc, { breadcrumbLabel: 'Privacy' }),
  ];
  if (verification) lines.push(verification);
  return lines.join('\n    ') + '\n    ';
}

function finalizeRootPrivacyHtml(sot) {
  let html = read('templates/privacy-gateway.html');
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<title)/i, '$1$2');
  const frag = buildRootPrivacyFragment(sot);
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
  out = swapGoogleFontsForSelfHosted(out, true);
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
    '{{SOT_PDF_EXPERT_SCENARIOS_BADGE}}': (p.expertScenarios && p.expertScenarios.sectionBadgeLabel) || '',
    '{{SOT_PDF_EXPERT_SCENARIOS_DISCLAIMER}}': (p.expertScenarios && p.expertScenarios.disclaimer) || '',
    '{{SOT_PDF_EXPERT_CARDS_HTML}}': buildExpertCardsHtml(sot),
    '{{SOT_PDF_PROOF_INSIDE_HTML}}': buildProofInsideHtml(sot),
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
  enPrivacy = injectPrivacyHead(enPrivacy, 'en/privacy.html', PRIVACY_PAGE_TITLE, privacyEnDesc, {
    sot: sot,
    breadcrumbLabel: 'Privacy',
  });
  write('en/privacy.html', enPrivacy);

  writeRobotsAndSitemap(sot);
  writeLlmsTxt(sot);
  writeIndexNowKey();
  writeManifest(sot);
  write404Html(sot);
  const fontsSelfHosted = writeSelfHostedFonts();
  removeLegacyPrivacyOutputs();

  finalizeRootIndexHtml(sot);
  finalizeRootPrivacyHtml(sot);

  console.log('Build done: en/index.html, en/privacy.html, privacy.html, robots.txt, sitemap.xml, llms.txt, llms-full.txt, manifest.webmanifest, 404.html, ' + INDEXNOW_KEY + '.txt');
  console.log('BASE_PATH:', BASE_PATH || '(root – no subpath)');
  console.log('SITE_ORIGIN:', SITE_ORIGIN);
  console.log('SITE_PUBLIC_BASE:', SITE_PUBLIC_BASE || '(not set)');
  console.log('Absolute base:', absoluteBaseSlash());
  console.log('Self-hosted fonts:', fontsSelfHosted ? 'YES (assets/fonts.css)' : 'no (Google Fonts CDN)');
}

main();
