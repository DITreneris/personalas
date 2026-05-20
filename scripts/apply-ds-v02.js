'use strict';
/**
 * Restore templates/index-lt.html from en/index.html and apply Design System v0.2 CSS/HTML.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, c) => fs.writeFileSync(path.join(ROOT, f), c, 'utf8');

function loadBuildArrays() {
  const src = read('scripts/build-locale-pages.js');
  const block =
    src.match(/const EN_REPLACEMENTS = \[[\s\S]*?\n\];/)[0] +
    '\n' +
    src.match(/const EN_PROMPT_UI = \[[\s\S]*?\n\];/)[0];
  return new Function(block + '; return { EN_REPLACEMENTS, EN_PROMPT_UI };')();
}

function revertFromEn(html, sot, EN_REPLACEMENTS, EN_PROMPT_UI) {
  html = html.replace(/<script>window\.BASE_PATH[\s\S]*?<\/script>\s*/i, '');
  html = html.replace('href="../assets/styles.css"', 'href="assets/styles.css"');
  html = html.replace('<script src="../generator.js">', '<script src="generator.js">');
  html = html.replace(/lang="en-US"/i, 'lang="lt"');
  const ltHead = `    <link rel="canonical" href="https://promptanatomy.help/">
    <link rel="alternate" hreflang="lt" href="https://promptanatomy.help/lt/">
    <link rel="alternate" hreflang="en-US" href="https://promptanatomy.help/en/">
    <link rel="alternate" hreflang="x-default" href="https://promptanatomy.help/en/">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="lt_LT">
    <meta property="og:image" content="https://promptanatomy.help/images/og-default.png">
    `;
  html = html.replace(
    /(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<meta name="description")/i,
    '$1' + ltHead + '$2'
  );
  html = html.replace(
    /<meta name="description" content="[^"]*">/i,
    '<meta name="description" content="{{SOT_META_DESCRIPTION}}">'
  );
  html = html.replace(/<title>[^<]*<\/title>/i, '<title>{{SOT_SEO_TITLE}}</title>');
  for (let i = EN_REPLACEMENTS.length - 1; i >= 0; i--) {
    const [from, to] = EN_REPLACEMENTS[i];
    if (from !== to) html = html.split(to).join(from);
  }
  html = html.replace(/\bDiagnose\b/g, 'Diagnostika');
  html = html.replace(/\bDefine the Role\b/g, 'Profilis');
  html = html.replace(/\bSource Candidates\b/g, 'Pritraukimas');
  html = html.replace(/\bScreen & Interview\b/g, 'Atranka');
  html = html.replace(/\bClose the Offer\b/g, 'Pasiūlymas');
  html = html.replace(/\bOnboard & Retain\b/g, 'Išlaikymas');
  const titlesLt = [
    'Kur stringame?', 'Koks žmogus mums iš tikrųjų tinka?', 'Perrašyk darbo skelbimą paprastai',
    'Kaip šiandien rasti daugiau žmonių?', 'Kaip geriau vesti pokalbį?', 'Kodėl kandidatai atsisako?',
    'Kaip geriau pristatyti pasiūlymą?', 'Kaip padėti naujam žmogui pirmus 3 mėnesius?', 'Kodėl žmonės išeina?',
    'Pagrindinis promptas (vienas viskam)',
  ];
  const descLt = [
    'Padėk suprasti mūsų atrankos iššūkius', 'Padėk aiškiai aprašyti idealų kandidatą pozicijai',
    'Kad žmogus jaustų, jog skelbimas rašytas jam', '3 paprasti būdai – LinkedIn, pažįstami, tiesioginis parašas',
    'Paprastas pokalbio planas – klausimai ir į ką atkreipti dėmesį', 'Suprask priežastis ir kaip apie tai kalbėti',
    'Suformuluok pasiūlymą taip, kad žmogus jaustų vertę',
    'Paprastas 3 mėnesių planas – savaitė, mėnuo, 3 mėn., vadovo pagalba',
    'Išanalizuok priežastis ir ką galime pakeisti greitai',
    'Vienas integruotas atrankos planas – nuo problemos iki pirmų mėnesių',
  ];
  for (let i = 0; i < 10; i++) {
    html = html.replace('>' + EN_PROMPT_UI[i].title + '</h2>', '>' + titlesLt[i] + '</h2>');
    html = html.replace(EN_PROMPT_UI[i].desc, descLt[i]);
  }
  const m = sot.marketing;
  const pairs = [
    [m.hero.headline, '{{SOT_HERO_HEADLINE}}'], [m.hero.subhead, '{{SOT_HERO_SUBHEAD}}'],
    [m.hero.priceTeaser || '', '{{SOT_HERO_PRICE_TEASER}}'],
    [m.hero.primaryCtaLabel, '{{SOT_HERO_PRIMARY_CTA_LABEL}}'], [m.hero.primaryCtaHref, '{{SOT_HERO_PRIMARY_CTA_HREF}}'],
    [m.hero.secondaryCtaLabel, '{{SOT_HERO_SECONDARY_CTA_LABEL}}'], [m.hero.secondaryCtaHref, '{{SOT_HERO_SECONDARY_CTA_HREF}}'],
    [m.hero.stickyCtaLabel || 'PDF guides', '{{SOT_HERO_STICKY_CTA_LABEL}}'],
    [m.workflowOverview.title, '{{SOT_WORKFLOW_TITLE}}'], [m.workflowOverview.lede, '{{SOT_WORKFLOW_LEDE}}'],
    [m.pdfSection.title, '{{SOT_PDF_SECTION_TITLE}}'], [m.pdfSection.lede, '{{SOT_PDF_SECTION_LEDE}}'],
    [m.pdfSection.audienceLine || '', '{{SOT_PDF_SECTION_AUDIENCE}}'],
    [m.pdfSection.sectionTrustHtml || '', '{{SOT_PDF_SECTION_TRUST}}'],
    [m.pdfSection.beginnerCtaLabel || '', '{{SOT_PDF_BEGINNER_CTA}}'],
    [m.pdfSection.advancedCtaLabel || '', '{{SOT_PDF_ADVANCED_CTA}}'],
    [m.pdfSection.freeBridge || '', '{{SOT_PDF_SECTION_FREE_BRIDGE}}'],
    [(m.freeTier && m.freeTier.label) || '', '{{SOT_FREE_TIER_LABEL}}'],
    [(m.freeTier && m.freeTier.hint) || '', '{{SOT_FREE_TIER_HINT}}'],
    [(m.community && m.community.title) || '', '{{SOT_COMMUNITY_TITLE}}'],
    [(m.community && m.community.telegramCta) || '', '{{SOT_COMMUNITY_TELEGRAM}}'],
    [(m.community && m.community.appCta) || '', '{{SOT_COMMUNITY_APP}}'],
    [sot.legal.disclaimerShort, '{{SOT_DISCLAIMER}}'],
  ];
  if (sot.pdfGuides.beginner.stripePaymentLink) {
    html = html.split(sot.pdfGuides.beginner.stripePaymentLink).join('https://buy.stripe.com/REPLACE_BEGINNER_PAYMENT_LINK');
  }
  if (sot.pdfGuides.advanced.stripePaymentLink) {
    html = html.split(sot.pdfGuides.advanced.stripePaymentLink).join('https://buy.stripe.com/REPLACE_ADVANCED_PAYMENT_LINK');
  }
  if (sot.pdfGuides.bundle && sot.pdfGuides.bundle.stripePaymentLink) {
    html = html.split(sot.pdfGuides.bundle.stripePaymentLink).join('https://buy.stripe.com/REPLACE_BUNDLE_PAYMENT_LINK');
  }
  html = html.split(sot.product.contactEmail).join('info@promptanatomy.app');
  pairs.sort((a, b) => b[0].length - a[0].length);
  for (const [val, token] of pairs) {
    if (val) html = html.split(val).join(token);
  }
  const faqStart = html.indexOf('<div data-buyer-faq-list>');
  if (faqStart !== -1) {
    const closeTag = '</' + 'div>';
    const faqEnd = html.indexOf(closeTag, faqStart);
    if (faqEnd !== -1) {
      html =
        html.slice(0, faqStart) +
        '<div data-buyer-faq-list>{{SOT_BUYER_FAQ_HTML}}' +
        closeTag +
        html.slice(faqEnd + closeTag.length);
    }
  }
  return html;
}

function applyDsV02(html) {
  const reps = [
    ['justify-content: space-between;', 'justify-content: flex-start;'],
    ['opacity: 0.95;\n            backdrop-filter', 'backdrop-filter'],
    ['background: rgba(0, 0, 0, 0.6);', 'background: var(--surface-overlay);'],
    ['box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);', 'box-shadow: var(--shadow-modal);'],
    ['background: var(--accent-dark);', 'background: var(--accent-primary);'],
    ['background: var(--accent-dark-hover);', 'background: var(--accent-primary-hover);'],
    ['box-shadow: 0 4px 14px rgba(60, 72, 90, 0.25);', 'box-shadow: var(--shadow-cta);'],
    ['background: var(--green);', 'background: var(--success);'],
    ['background: rgba(46, 158, 126, 0.08);', 'background: var(--surface-2);'],
    [
      'background: linear-gradient(to right, var(--blue-light), var(--orange-light));',
      'background: var(--surface-2);',
    ],
    ['background: var(--orange-light);', 'background: var(--surface-3);'],
    ['border-color: rgba(56, 161, 105, 0.4);', 'border-color: var(--accent-gold);'],
    ['border: var(--border-width) solid rgba(56, 161, 105, 0.4);', 'border: var(--border-width) solid var(--border-subtle);'],
    ['box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);', 'box-shadow: var(--shadow-toast);'],
    ['box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.08);', 'box-shadow: var(--shadow-sticky);'],
    [
      'background: linear-gradient(to right, var(--blue-light), var(--orange-light));',
      'background: var(--gradient-soft);',
    ],
    ['var(--blue-light)', 'var(--surface-2)'],
    ['var(--orange-light)', 'var(--surface-3)'],
    ['var(--community-cta-green-hover)', 'var(--cta-primary-bg-hover)'],
    ['var(--community-cta-green)', 'var(--cta-primary-bg)'],
    ['outline: 3px solid var(--accent-gold);\n            outline-offset: 2px;', 'outline: var(--ring-focus);\n            outline-offset: 2px;'],
    ['outline: 3px solid var(--brand-prompt-anatomy-accent);\n            outline-offset: 2px;', 'outline: var(--ring-focus);\n            outline-offset: 2px;'],
    ['outline: 3px solid var(--brand-prompt-anatomy-accent); outline-offset: 2px;', 'outline: var(--ring-focus); outline-offset: 2px;'],
    ['transition: all 0.2s;', 'transition: background var(--duration-normal) var(--ease-out), transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-normal) var(--ease-out);'],
    ['font-size: 22px;', 'font-size: var(--fs-2xl);'],
    ['font-size: 24px;\n            font-weight: 800;\n            color: var(--text);', 'font-size: var(--fs-2xl);\n            font-weight: 800;\n            color: var(--text);'],
    ['font-size: 24px;\n            font-weight: 800;\n            color: var(--accent-dark);', 'font-size: var(--fs-2xl);\n            font-weight: 800;\n            color: var(--accent-dark);'],
    ['font-size: 20px;\n            font-weight: 800;\n            color: var(--accent-dark);', 'font-size: var(--fs-2xl);\n            font-weight: 800;\n            color: var(--accent-dark);'],
    ['font-size: 19px;', 'font-size: var(--fs-lg);'],
    ['font-size: 28px;\n            font-weight: 800;\n            margin-bottom: 16px;', 'font-size: var(--fs-xl);\n            font-weight: 800;\n            margin-bottom: 16px;'],
    ['font-size: 18px;\n            color: var(--text-light);\n            line-height: 1.6;\n            margin-bottom: 28px;', 'font-size: var(--fs-md);\n            color: var(--text-light);\n            line-height: 1.6;\n            margin-bottom: 28px;'],
    ['font-size: 1.1rem;', 'font-size: var(--fs-xl);'],
    ['@media (max-width: 600px)', '@media (max-width: 768px)'],
    ['box-shadow: 0 4px 12px rgba(43, 108, 176, 0.08);', 'box-shadow: var(--shadow-medium);'],
    ['box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);', 'box-shadow: var(--shadow-cta);'],
    ['box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);', 'box-shadow: var(--shadow-cta);'],
    ['box-shadow: 0 4px 14px rgba(16, 59, 90, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);', 'box-shadow: var(--shadow-cta);'],
    ['box-shadow: 0 6px 20px rgba(16, 59, 90, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);', 'box-shadow: var(--shadow-cta);'],
    ['box-shadow: 0 2px 8px rgba(16, 59, 90, 0.2);', 'box-shadow: var(--shadow-cta);'],
    ['font-size: 0.8rem;', 'font-size: var(--fs-xs);'],
    ['font-size: 0.85rem;', 'font-size: var(--fs-sm);'],
    ['font-size: 0.9rem;', 'font-size: var(--fs-sm);'],
    ['font-size: 0.95rem;', 'font-size: var(--fs-sm);'],
    ['font-size: 1.05rem;', 'font-size: var(--fs-md);'],
    ['font-size: 1.15rem;', 'font-size: var(--fs-lg);'],
    ['font-size: 1.25rem;', 'font-size: var(--fs-xl);'],
  ];
  for (const [a, b] of reps) html = html.split(a).join(b);
  if (!html.includes('.hero-price-teaser {')) {
    html = html.replace(
      '.header-note {',
      `.hero-price-teaser {
            font-size: var(--fs-sm);
            font-weight: 600;
            letter-spacing: 0.01em;
            text-transform: none;
            opacity: 0.82;
            margin-top: 0;
        }

        .header-note {`
    );
  }
  html = html.replace(
    /<p class="pdf-compare-note pdf-meta-muted">Quote paraphrased[\s\S]*?<\/p>\s*/i,
    ''
  );
  html = html.replace(
    /\s*<p class="legal-disclaimer pdf-meta-muted" data-sot-disclaimer role="note">\{\{SOT_DISCLAIMER\}\}<\/p>/i,
    ''
  );
  return html;
}

function extractLandingCss(html) {
  const m = html.match(/<style>([\s\S]*?)<\/style>/i);
  if (!m) throw new Error('no style block');
  return m[1].trim() + '\n';
}

function injectLandingLink(html) {
  html = html.replace(
    '<link rel="stylesheet" href="assets/styles.css">',
    '<link rel="stylesheet" href="assets/styles.css">\n    <link rel="stylesheet" href="assets/landing.css">'
  );
  html = html.replace(/<style>[\s\S]*?<\/style>\s*/i, '');
  return html;
}

let html = read('templates/index-lt.html');
if (!html || html.length < 50000) {
  throw new Error('templates/index-lt.html missing or truncated — restore from git HEAD first');
}
html = applyDsV02(html);
if (!html.includes('footer-disclaimer')) {
  html = html.replace(
    /(<footer class="footer">[\s\S]*?)(<p class="footer-legal">)/,
    '$1<p class="footer-disclaimer pdf-meta-muted" role="note">{{SOT_DISCLAIMER}}</p>\n            $2'
  );
}
const landingCss = extractLandingCss(html);
write('assets/landing.css', '/* Landing page components – Design System v0.2 */\n' + landingCss);
html = injectLandingLink(html);
write('templates/index-lt.html', html);
console.log('DS v0.2 applied: templates/index-lt.html (' + html.length + ' bytes), assets/landing.css');
