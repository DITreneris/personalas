/**
 * Structural tests – root EN gateway (index.html), build pipeline source (templates/),
 * EN locale build, paid PDF API skeleton, and Stripe success/terms pages.
 * Run: node tests/structure.test.js (or npm test; build runs first).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');
const PRIVACY_GATEWAY_PATH = path.join(ROOT, 'privacy.html');
const TEMPLATE_INDEX_PATH = path.join(ROOT, 'templates', 'index-lt.html');
const TEMPLATE_PRIVACY_PATH = path.join(ROOT, 'templates', 'privacy.html');
const GENERATOR_PATH = path.join(ROOT, 'generator.js');

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_e) {
    return null;
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    return false;
  }
  console.log(`PASS: ${message}`);
  return true;
}

function run() {
  let passed = 0;
  let failed = 0;
  const tally = (ok) => { if (ok) passed++; else failed++; };

  const html = readFile(INDEX_PATH);
  if (!html) {
    console.error('index.html not found:', INDEX_PATH);
    process.exit(1);
  }

  const template = readFile(TEMPLATE_INDEX_PATH);
  if (!template) {
    console.error('templates/index-lt.html (build source) not found:', TEMPLATE_INDEX_PATH);
    process.exit(1);
  }

  const templatePrivacy = readFile(TEMPLATE_PRIVACY_PATH);
  if (!templatePrivacy) {
    console.error('templates/privacy.html (build source) not found:', TEMPLATE_PRIVACY_PATH);
    process.exit(1);
  }

  // --- Root EN gateway ---
  tally(assert(html.includes('lang="en-US"'), 'root index.html lang="en-US" (gateway)'));
  tally(assert(html.includes('href="en/"') && !html.includes('<a href="lt/'), 'gateway: only EN link in body (no lt/)'));
  tally(assert(html.includes('rel="canonical"') && html.includes('/en/">'), 'root canonical points to /en/'));
  tally(
    assert(
      html.includes('http-equiv="refresh"') &&
        (html.includes('url=en/') || html.includes('/en/')),
      'root meta refresh to EN'
    )
  );
  tally(assert(html.includes('privacy.html'), 'gateway: link to privacy.html'));
  tally(assert(!html.includes('hreflang="lt"'), 'root index.html has no hreflang="lt"'));
  tally(assert(!html.includes('og:locale:alternate'), 'root index.html has no og:locale:alternate'));

  // --- 10 prompts (template) ---
  for (let i = 1; i <= 10; i++) {
    tally(assert(template.includes(`id="prompt${i}"`), `templates/index-lt.html: prompt ${i} id (prompt${i})`));
  }
  for (let i = 1; i <= 10; i++) {
    tally(assert(template.includes(`id="block${i}"`), `templates/index-lt.html: anchor block${i}`));
  }

  // --- Copy buttons (10) and shared structure ---
  const copyButtons = (template.match(/Kopijuoti promptą/g) || []).length;
  tally(assert(copyButtons >= 10, `templates/index-lt.html: copy buttons (>= 10): ${copyButtons}`));
  const codeBlocks = (template.match(/class="[^"]*code-block[^"]*"/g) || []).length;
  tally(assert(codeBlocks >= 10, `templates/index-lt.html: code-block elements (>= 10): ${codeBlocks}`));
  const checkboxes = (template.match(/class="[^"]*prompt-done[^"]*"/g) || []).length;
  tally(assert(checkboxes >= 10, `templates/index-lt.html: prompt-done checkboxes (>= 10): ${checkboxes}`));

  // --- Accessibility / semantics (template) ---
  tally(assert(template.includes('href="#main-content"') && template.includes('skip-link'), 'templates/index-lt.html: skip link'));
  tally(assert(template.includes('id="main-content"') && template.includes('<main'), 'templates/index-lt.html: main region'));
  tally(assert(template.includes('id="progressText"') && template.includes('id="progressBarFill"'), 'templates/index-lt.html: progress indicator'));
  tally(assert(template.includes('id="toast"') && template.includes('role="status"'), 'templates/index-lt.html: toast'));
  tally(assert(template.includes('t.me/prompt_anatomy'), 'templates/index-lt.html: Telegram link'));

  // --- Critical functions ---
  tally(assert(template.includes('generator.js'), 'templates/index-lt.html: generator.js script'));
  tally(assert(template.includes('copyPrompt') || template.includes('selectText'), 'copy functions reference (generator.js)'));
  const generatorJs = readFile(GENERATOR_PATH);
  tally(assert(generatorJs && generatorJs.includes('localStorage') && generatorJs.includes('di_prompt_done_'), 'generator.js: localStorage progress'));
  tally(assert(template.includes('hiddenTextarea'), 'templates/index-lt.html: hiddenTextarea for copy fallback'));

  // --- Root privacy gateway ---
  const privacyGateway = readFile(PRIVACY_GATEWAY_PATH);
  tally(assert(privacyGateway !== null && privacyGateway.length > 0, 'privacy.html gateway exists'));
  tally(assert(privacyGateway && privacyGateway.includes('lang="en-US"'), 'root privacy.html lang="en-US"'));
  tally(assert(privacyGateway && privacyGateway.includes('en/privacy.html') && !privacyGateway.includes('<a href="lt/'), 'privacy gateway: only EN link in body'));
  tally(assert(privacyGateway && !privacyGateway.includes('hreflang="lt"'), 'root privacy.html has no hreflang="lt"'));
  tally(assert(!fs.existsSync(path.join(ROOT, 'privatumas.html')), 'legacy privatumas.html removed after build'));

  // --- Built EN locale pages (npm run build) ---
  const enIndexPath = path.join(ROOT, 'en', 'index.html');
  const enPrivacyPath = path.join(ROOT, 'en', 'privacy.html');

  const enIndex = readFile(enIndexPath);
  tally(assert(enIndex !== null && enIndex.length > 0, 'en/index.html exists'));
  tally(assert(readFile(enPrivacyPath) !== null, 'en/privacy.html exists'));
  tally(assert(!fs.existsSync(path.join(ROOT, 'en', 'privatumas.html')), 'no en/privatumas.html (renamed to privacy.html)'));

  // No lt/ output
  tally(assert(!fs.existsSync(path.join(ROOT, 'lt', 'index.html')), 'no lt/index.html (EN-only output)'));
  tally(assert(!fs.existsSync(path.join(ROOT, 'lt', 'privacy.html')), 'no lt/privacy.html (EN-only output)'));

  if (enIndex) {
    tally(assert(enIndex.includes('lang="en-US"'), 'en/index.html lang="en-US"'));
    tally(assert(!enIndex.includes('id="langLtBtn"') && !enIndex.includes('class="lang-switcher"'), 'en/index.html has no language switcher'));
    tally(assert(!enIndex.includes('<div class="lt-only-qa-nav"'), 'en/index.html has no lt-only-qa-nav block'));
    tally(assert(!enIndex.includes('hreflang="lt"'), 'en/index.html has no hreflang="lt"'));
    tally(assert(!enIndex.includes('og:locale:alternate'), 'en/index.html has no og:locale:alternate'));
    tally(assert(enIndex.includes('rel="canonical"') && enIndex.includes('hreflang="en-US"') && enIndex.includes('hreflang="x-default"'), 'en/index.html canonical and EN/x-default hreflang'));
    const canonicalHttps = /<link rel="canonical" href="https:/;
    tally(assert(canonicalHttps.test(enIndex), 'en/index.html canonical uses absolute HTTPS URL'));
    tally(assert(enIndex.includes('og:image" content="https://'), 'en/index.html OG image absolute HTTPS'));
    tally(assert(enIndex.includes('<meta name="description"'), 'en/index.html meta description'));
    tally(assert(enIndex.includes('application/ld+json'), 'en/index.html JSON-LD'));

    for (let i = 1; i <= 10; i++) {
      tally(assert(enIndex.includes('id="prompt' + i + '"') && enIndex.includes('id="block' + i + '"'), 'en/index.html prompt ' + i));
    }

    tally(assert(enIndex.includes('Skip to content') && (enIndex.includes('Copy prompt') || enIndex.includes('Copy')), 'en/index.html EN strings'));

    // US localization checks
    tally(assert(enIndex.includes('New York, NY') || enIndex.includes('San Francisco, CA'), 'en/index.html includes a US city/state example'));
    tally(assert(['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chicago, IL', 'Seattle, WA'].filter((c) => enIndex.includes(c)).length >= 4, 'en/index.html includes multiple US city/state examples'));
    const roleLocationCount = (enIndex.match(/Role location:/g) || []).length;
    tally(assert(roleLocationCount >= 10, 'en/index.html: role-location placeholders for all prompts'));
    tally(assert(enIndex.includes('Remote – US') && enIndex.includes('Hybrid – New York, NY') && enIndex.includes('On-site – Austin, TX'), 'en/index.html: remote, hybrid, on-site US examples'));
    tally(assert(enIndex.includes('City, State, optional Zip Code') && enIndex.includes('San Francisco, CA 94105') && enIndex.includes('Seattle, WA 98101'), 'en/index.html: US location format with optional Zip Code'));
    tally(assert(/\$\d{1,3}(,\d{3})*(\.\d{2})?/.test(enIndex), 'en/index.html includes US dollar formatting'));
    tally(assert(enIndex.includes('MM/DD/YYYY'), 'en/index.html includes US date format guidance'));
    tally(assert(enIndex.includes('+1 (415) 555-0198'), 'en/index.html includes US phone format guidance'));
    tally(assert(enIndex.includes('Zip Code'), 'en/index.html includes US address terminology'));
    tally(assert(enIndex.includes('Address fields:') && enIndex.includes('<code>Street Address</code>') && enIndex.includes('<code>City</code>') && enIndex.includes('<code>State</code>') && enIndex.includes('<code>Zip Code</code>'), 'en/index.html: explicit US address field order'));
    tally(assert(enIndex.includes('Phone format:') && enIndex.includes('<code>+1 (XXX) XXX-XXXX</code>') && enIndex.includes('Contact phone: [optional, e.g., +1 (415) 555-0198]'), 'en/index.html: canonical US phone format'));
    const streetAddressCount = (enIndex.match(/Street Address: \[optional, e\.g\., 123 Market St\]/g) || []).length;
    tally(assert(streetAddressCount >= 10, 'en/index.html: Street Address placeholders for all prompts'));
    tally(assert(enIndex.includes('State: [two-letter State, e.g., NY]') && enIndex.includes('Zip Code: [optional, e.g., 10001]'), 'en/index.html: two-letter State and Zip Code placeholders'));
    tally(assert(!/(€|\bEUR\b|Postcode|postcode|Colour|colour|organisation|optimise|centre|grey|Analyse|analyse|Spin-off Nr\.)/.test(enIndex), 'en/index.html: no obvious non-US locale fragments'));
    tally(assert(!/[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/.test(enIndex), 'en/index.html: no Lithuanian diacritics'));
    tally(assert(enIndex.includes('terms.html'), 'en/index.html footer links to terms'));
    tally(assert(enIndex.includes('info@promptanatomy.help'), 'en/index.html uses canonical support email'));
    tally(assert(!enIndex.includes('mailto:info@promptanatomy.app'), 'en/index.html has no legacy .app support email'));
    tally(assert(enIndex.includes('legal-disclaimer') || enIndex.includes('not legal or HR advice'), 'en/index.html HR advisory disclaimer'));
    tally(assert(enIndex.includes('href="privacy.html"'), 'en/index.html privacy link uses privacy.html'));
  }

  const enPrivacy = readFile(enPrivacyPath);
  if (enPrivacy) {
    const canonicalHttps = /<link rel="canonical" href="https:/;
    tally(assert(canonicalHttps.test(enPrivacy), 'en/privacy.html canonical HTTPS'));
    tally(assert(enPrivacy.includes('property="og:image"'), 'en/privacy.html OG image'));
    tally(assert(!enPrivacy.includes('hreflang="lt"'), 'en/privacy.html has no hreflang="lt"'));
    tally(assert(enPrivacy.includes('Stripe') && enPrivacy.includes('Resend'), 'en/privacy.html discloses paid PDF sub-processors'));
    tally(assert(enPrivacy.includes('fonts.googleapis.com'), 'en/privacy.html discloses Google Fonts'));
    tally(assert(enPrivacy.includes('California') || enPrivacy.includes('Your rights'), 'en/privacy.html includes privacy rights section'));
    tally(assert(enPrivacy.includes('Effective:'), 'en/privacy.html includes effective date'));
    tally(assert(!/[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/.test(enPrivacy), 'en/privacy.html: no Lithuanian diacritics'));
  }

  // --- robots.txt and sitemap.xml ---
  const robotsPath = path.join(ROOT, 'robots.txt');
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  const robots = readFile(robotsPath);
  const sitemap = readFile(sitemapPath);
  tally(assert(robots !== null && robots.includes('Sitemap: https://'), 'robots.txt with absolute Sitemap URL'));
  tally(assert(sitemap !== null && sitemap.includes('<urlset') && sitemap.includes('<loc>https://'), 'sitemap.xml with absolute <loc>'));
  tally(assert(sitemap && !/\/lt\//.test(sitemap), 'sitemap.xml: no /lt/ entries'));
  tally(assert(sitemap && sitemap.includes('/en/'), 'sitemap.xml: includes /en/ entry'));
  tally(assert(sitemap && sitemap.includes('/en/privacy.html'), 'sitemap.xml: includes /en/privacy.html'));
  tally(assert(sitemap && sitemap.includes('/privacy.html'), 'sitemap.xml: includes /privacy.html gateway'));
  tally(assert(sitemap && !sitemap.includes('privatumas.html'), 'sitemap.xml: no privatumas.html entries'));

  // --- Paid PDF API skeleton ---
  const apiDir = path.join(ROOT, 'api');
  tally(assert(fs.existsSync(path.join(apiDir, 'stripe-webhook.js')), 'api/stripe-webhook.js exists'));
  tally(assert(fs.existsSync(path.join(apiDir, 'download.js')), 'api/download.js exists'));
  tally(assert(fs.existsSync(path.join(apiDir, 'download-link.js')), 'api/download-link.js exists'));
  const fulfillmentPath = path.join(apiDir, '_lib', 'fulfillment.js');
  tally(assert(fs.existsSync(fulfillmentPath), 'api/_lib/fulfillment.js exists'));
  const fulfillment = readFile(fulfillmentPath);
  tally(assert(fulfillment && fulfillment.includes("id: 'beginner'") && fulfillment.includes("id: 'advanced'"), 'fulfillment.js declares beginner and advanced products'));
  tally(assert(fulfillment && fulfillment.includes('STRIPE_PRICE_BEGINNER_PDF') && fulfillment.includes('STRIPE_PRICE_ADVANCED_PDF'), 'fulfillment.js references both Stripe price env vars'));

  // --- Success page ---
  const successPath = path.join(ROOT, 'success.html');
  const success = readFile(successPath);
  tally(assert(success !== null, 'success.html exists'));
  tally(assert(success && success.includes('session_id'), 'success.html reads session_id'));
  tally(assert(success && success.includes('/api/download-link'), 'success.html polls /api/download-link'));
  tally(assert(success && success.includes('lang="en-US"'), 'success.html lang="en-US"'));

  // --- Terms page ---
  const termsPath = path.join(ROOT, 'terms.html');
  const terms = readFile(termsPath);
  tally(assert(terms !== null, 'terms.html exists'));
  tally(assert(terms && terms.includes('paid-pdf-license'), 'terms.html has paid-pdf-license anchor'));
  tally(assert(terms && terms.includes('lang="en-US"'), 'terms.html lang="en-US"'));
  tally(assert(terms && terms.includes('Not professional advice'), 'terms.html HR advisory section'));
  tally(assert(terms && terms.includes('/en/privacy.html'), 'terms.html links to privacy policy'));

  tally(assert(success && success.includes('terms.html#refunds'), 'success.html links to refunds'));

  // --- PDF source HTML ---
  const beginnerPdfHtml = readFile(path.join(ROOT, 'docs', 'pdf-source', 'beginner-personalas-hr.html'));
  const advancedPdfHtml = readFile(path.join(ROOT, 'docs', 'pdf-source', 'advanced-personalas-hr.html'));
  tally(assert(beginnerPdfHtml && (beginnerPdfHtml.match(/<section class="page/g) || []).length === 12, 'beginner PDF HTML has 12 pages'));
  tally(assert(advancedPdfHtml && (advancedPdfHtml.match(/<section class="page/g) || []).length === 24, 'advanced PDF HTML has 24 pages'));
  tally(assert(beginnerPdfHtml && beginnerPdfHtml.includes('www.promptanatomy.app') && beginnerPdfHtml.includes('promptanatomy.help'), 'beginner PDF branding'));
  tally(assert(advancedPdfHtml && advancedPdfHtml.includes('www.promptanatomy.app') && advancedPdfHtml.includes('promptanatomy.help'), 'advanced PDF branding'));

  const sotPath = path.join(ROOT, 'config', 'sot.json');
  const sotRaw = readFile(sotPath);
  let sot = null;
  try {
    sot = sotRaw ? JSON.parse(sotRaw) : null;
  } catch (_e) {
    sot = null;
  }
  tally(assert(sot && sot.pdfGuides && sot.pdfGuides.beginner && Array.isArray(sot.pdfGuides.beginner.chapters) && sot.pdfGuides.beginner.chapters.length >= 8, 'sot.json beginner chapters'));
  tally(assert(sot && sot.pdfGuides && sot.pdfGuides.advanced && Array.isArray(sot.pdfGuides.advanced.chapters) && sot.pdfGuides.advanced.chapters.length >= 8, 'sot.json advanced chapters'));
  tally(assert(sot && Array.isArray(sot.buyerFaq) && sot.buyerFaq.length === 5, 'sot.json buyerFaq has 5 items'));
  tally(assert(sot && sot.legal && sot.legal.metaDescription, 'sot.json legal.metaDescription'));
  tally(assert(sot && sot.product && sot.product.contactEmail === 'info@promptanatomy.help', 'sot.json canonical contactEmail'));

  const beginnerCover = path.join(ROOT, 'assets', 'pdf-covers', 'beginner.png');
  tally(assert(fs.existsSync(beginnerCover), 'assets/pdf-covers/beginner.png exists'));
  const advancedCover = path.join(ROOT, 'assets', 'pdf-covers', 'advanced.png');
  tally(assert(fs.existsSync(advancedCover), 'assets/pdf-covers/advanced.png exists'));
  ['beginner', 'advanced'].forEach(function (prefix) {
    [2, 3, 4].forEach(function (n) {
      const sample = path.join(ROOT, 'assets', 'pdf-covers', prefix + '-p' + n + '.png');
      tally(assert(fs.existsSync(sample), 'assets/pdf-covers/' + prefix + '-p' + n + '.png exists'));
    });
  });

  // --- PDF CTAs on EN index ---
  if (enIndex) {
    tally(assert(enIndex.includes('Beginner') && enIndex.includes('Advanced'), 'en/index.html mentions Beginner and Advanced PDFs'));
    tally(assert(enIndex.includes('$5.99') && enIndex.includes('$11.99'), 'en/index.html shows $5.99 and $11.99 prices'));
    tally(assert(enIndex.includes('id="pdf-guides"'), 'en/index.html pdf-guides section'));
    tally(assert(enIndex.includes('data-product="beginner-pdf"') && enIndex.includes('data-product="advanced-pdf"'), 'PDF Stripe product markers'));
    tally(assert(enIndex.includes('class="pdf-guide-specs"') && enIndex.includes('12 pages') && enIndex.includes('24 pages'), 'PDF specs row'));
    tally(assert(enIndex.includes('Personal license') && enIndex.includes('terms.html#paid-pdf-license'), 'PDF personal license line'));
    tally(assert(enIndex.includes('class="pdf-guide-trust"') && enIndex.includes('Stripe checkout'), 'PDF trust row'));
    tally(assert(enIndex.includes('id="pdfPreviewDialog"') && enIndex.includes('data-preview-trigger="beginner"'), 'PDF preview dialog'));
    tally(assert(enIndex.includes('id="pdf-guides-faq"') && enIndex.includes('data-buyer-faq-list'), 'Buyer FAQ hook'));
    tally(assert(enIndex.includes('class="pdf-author-panel"') && enIndex.includes('promptanatomy.app'), 'Author panel'));
    tally(assert(success && success.includes('terms.html#paid-pdf-license'), 'success.html license link'));
  }

  console.log('\n---');
  console.log(`Result: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('All structural tests pass.\n');
}

run();
