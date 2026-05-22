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

const LT_DIACRITICS = /[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/;

function assertPublicEnSurface(label, content) {
  if (!content) {
    return assert(false, label + ' file readable');
  }
  let ok = true;
  ok = assert(!LT_DIACRITICS.test(content), label + ': no Lithuanian diacritics') && ok;
  ok = assert(!/\bPersonalas\b/.test(content), label + ': no Personalas brand') && ok;
  ok = assert(!/Series No\. 3/i.test(content), label + ': no Series No. 3') && ok;
  ok = assert(content.includes('/_vercel/insights/script.js'), label + ': Vercel Web Analytics script') && ok;
  ok = assert(content.includes('/_vercel/speed-insights/script.js'), label + ': Vercel Speed Insights script') && ok;
  return ok;
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
  tally(assertPublicEnSurface('index.html gateway', html));

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
  tally(
    assert(
      generatorJs && generatorJs.includes("fetch('/config/sot.json'") && generatorJs.includes('PDF_PREVIEW_FALLBACK_PAGES'),
      'generator.js: absolute SOT fetch + on-disk preview fallbacks'
    )
  );
  tally(
    assert(
      generatorJs && generatorJs.includes('beginner: [6, 8, 9]') && generatorJs.includes('advanced: [10, 15, 17]'),
      'generator.js: preview fallbacks match sot.json previewPages (not legacy 2/3/4)'
    )
  );
  tally(
    assert(
      !generatorJs || !/pages:\s*\[2,\s*3,\s*4\]/.test(generatorJs),
      'generator.js: no legacy PDF_PREVIEW_DEFS pages [2,3,4]'
    )
  );
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
  const landingCss = readFile(path.join(ROOT, 'assets', 'landing.css'));
  const enSurfaceCss = (enIndex || '') + (landingCss || '');
  tally(assert(enIndex !== null && enIndex.length > 0, 'en/index.html exists'));
  tally(assert(landingCss !== null && landingCss.length > 0, 'assets/landing.css exists'));
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
    tally(assert(enIndex.includes('images/og-default-v2.png'), 'en/index.html OG image v2 (social cache bust)'));
    tally(assert(!enIndex.includes('images/og-default.png'), 'en/index.html has no legacy og-default.png meta URL'));
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
    tally(
      assert(
        enIndex.includes('optional <code>Zip Code</code>') &&
          enIndex.includes('San Francisco, CA 94105') &&
          enIndex.includes('Seattle, WA 98101'),
        'en/index.html: US location format with optional Zip Code'
      )
    );
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
    tally(assert(enIndex.includes('info@promptanatomy.app'), 'en/index.html uses canonical support email'));
    tally(assert(!enIndex.includes('mailto:info@promptanatomy.help'), 'en/index.html has no legacy .help support email in mailto'));
    tally(assert(!enIndex.includes('Built by Prompt Anatomy'), 'en/index.html footer: no redundant Built by line (variant A)'));
    tally(assert(!enIndex.includes('footer-product-link'), 'en/index.html footer: no footer-product-link'));
    tally(
      assert(
        enIndex.includes('class="footer-contact"') &&
          enIndex.includes('promptanatomy.app</a>') &&
          enIndex.includes('info@promptanatomy.app</a>'),
        'en/index.html footer: app link and email without Prompt Anatomy prefix'
      )
    );
    tally(assert(
      enIndex.includes('footer-disclaimer') || enIndex.includes('legal-disclaimer') || enIndex.includes('Not legal or HR advice'),
      'en/index.html HR advisory disclaimer'
    ));
    tally(assert(enIndex.includes('href="privacy.html"'), 'en/index.html privacy link uses privacy.html'));
    const heroBlock = enIndex.match(/<header class="header"[\s\S]*?<\/header>/);
    tally(assert(heroBlock && heroBlock[0].includes('See the PDF guides'), 'hero primary PDF CTA label'));
    tally(
      assert(
        heroBlock &&
          heroBlock[0].includes('href="#pdf-guides"') &&
          heroBlock[0].includes('class="cta-button"'),
        'hero primary CTA href is pdf-guides'
      )
    );
    tally(assert(heroBlock && !heroBlock[0].includes('header-phases'), 'phase chips not inside hero'));
    tally(
      assert(
        landingCss.includes('.header h1') && /\.header h1\s*\{[^}]*text-transform:\s*none/.test(landingCss),
        'landing.css: hero h1 sentence case (text-transform none)'
      )
    );
    tally(
      assert(
        !/\.header h1,\s*[\s\S]*?text-transform:\s*uppercase/.test(landingCss),
        'landing.css: hero h1 not grouped with uppercase rule'
      )
    );
    tally(assert(heroBlock && heroBlock[0].includes('U.S. hiring'), 'hero headline uses U.S. disambiguation'));
    const heroSubheadMatch = heroBlock && heroBlock[0].match(/<p>([^<]*)<\/p>/);
    tally(
      assert(
        heroSubheadMatch && !heroSubheadMatch[1].includes('$5.99'),
        'hero subhead has no duplicate $5.99 (price only in priceTeaser)'
      )
    );
    tally(
      assert(
        heroBlock && heroBlock[0].includes('Beginner $5.99'),
        'hero priceTeaser shows Beginner $5.99'
      )
    );
    tally(assert(!enIndex.includes('Typical live workshops'), 'en/index.html: no workshop price compare strip'));
    tally(assert(!enIndex.includes('Illustrative comparison, not a specific'), 'en/index.html: no compare-strip disclaimer'));
    tally(assert(!enIndex.includes('Quote paraphrased from pilot'), 'en/index.html: no paraphrased-quote footnote'));
    // --- DS v0.3.3 Phase D negative regression ---
    // pdf-proof-inside (auto-rendered specimen above grid), pdf-guides-social
    // (Joan/Lane/Emanuel testimonial cards), pdf-expert-* (DS v0.3.2 v2 row),
    // and hero-sample-link (tertiary hero CTA) were removed per buyer feedback:
    // no auto-loaded previews on the public landing — previews must require an
    // explicit user click ("See inside" details on each PDF guide card or the
    // <dialog id="pdfPreviewDialog"> modal). These checks block accidental
    // reintroduction.
    [
      ['id="pdf-proof-inside"', 'pdf-proof-inside section'],
      ['class="pdf-proof-inside', 'pdf-proof-inside class'],
      ['class="pdf-guides-social', 'pdf-guides-social block'],
      ['class="pdf-expert-card', 'pdf-expert-card class'],
      ['class="pdf-expert-cards"', 'pdf-expert-cards grid'],
      ['class="hero-sample-link"', 'hero-sample-link tertiary CTA'],
      ['data-analytics="hero_see_sample"', 'hero_see_sample analytics hook'],
      ['data-analytics="pdf_proof_preview_open"', 'pdf_proof_preview_open analytics hook'],
    ].forEach(function (pair) {
      tally(
        assert(
          !enIndex.includes(pair[0]),
          'en/index.html: DS v0.3.3 Phase D — ' + pair[1] + ' must not return (auto-preview pollution)'
        )
      );
    });
    // sot.json must not contain proofInside / expertScenarios after Phase D
    let phaseDSot = null;
    try {
      const sotRawPhaseD = fs.readFileSync(path.join(ROOT, 'config', 'sot.json'), 'utf8');
      phaseDSot = JSON.parse(sotRawPhaseD);
    } catch (_e) {
      phaseDSot = null;
    }
    const phaseDPdfSection = (phaseDSot && phaseDSot.marketing && phaseDSot.marketing.pdfSection) || {};
    tally(
      assert(
        phaseDPdfSection.proofInside === undefined,
        'sot.json: DS v0.3.3 Phase D — marketing.pdfSection.proofInside removed'
      )
    );
    tally(
      assert(
        phaseDPdfSection.expertScenarios === undefined,
        'sot.json: DS v0.3.3 Phase D — marketing.pdfSection.expertScenarios removed'
      )
    );
    // Free prompt FAQ rename stays (clarity fix, distinct from removed previews):
    // disambiguates the free-tier <h2> from the paid-tier <h3 id="pdf-guides-faq-title">Buyer FAQ</h3>.
    tally(
      assert(
        enIndex.includes('<h2 id="faq-title">Free prompt FAQ</h2>') &&
          !enIndex.includes('<h2 id="faq-title">Common questions before you start</h2>'),
        'en/index.html: free-tier FAQ heading renamed to "Free prompt FAQ" to disambiguate from Buyer FAQ'
      )
    );
    tally(assert(enIndex.includes('id="workflow-overview"'), 'en/index.html workflow-overview section'));
    if (enIndex) {
      tally(
        assert(
          /generator\.js\?v=/.test(enIndex),
          'en/index.html: generator.js cache-bust query (package version)'
        )
      );
      tally(
        assert(
          landingCss && /\.pdf-preview-error\s*\{/.test(landingCss),
          'landing.css: .pdf-preview-error for unavailable preview state'
        )
      );
    }
    tally(assert(fs.existsSync(path.join(ROOT, 'favicon.svg')), 'favicon.svg exists at site root'));
    tally(assert(fs.existsSync(path.join(ROOT, 'favicon.ico')), 'favicon.ico exists at site root'));
    tally(
      assert(
        /href="https:\/\/[^"]+\/favicon\.svg"/.test(enIndex) &&
          enIndex.includes('rel="apple-touch-icon"') &&
          /href="https:\/\/[^"]+\/favicon\.ico"/.test(enIndex),
        'en/index.html favicon links use absolute site-root URLs'
      )
    );
    tally(
      assert(
        !/<link rel="icon" type="image\/svg\+xml" href="favicon\.svg">/.test(enIndex),
        'en/index.html must not use broken relative favicon.svg (resolves to /en/favicon.svg)'
      )
    );
    tally(
      assert(
        /\.workflow-overview[\s\S]{0,1200}\.header-phase-link/.test(landingCss || ''),
        'landing.css: workflow-overview scoped phase chip styles'
      )
    );
    tally(
      assert(
        /\.workflow-overview[\s\S]{0,800}color:\s*var\(--text\)/.test(landingCss || ''),
        'landing.css: workflow phase chips use --text on light surface'
      )
    );
    tally(
      assert(
        /\.workflow-overview[\s\S]{0,900}background:\s*var\(--surface-2\)/.test(landingCss || ''),
        'landing.css: workflow phase chips default surface-2 (DS v0.2.1 elevation)'
      )
    );
    tally(
      assert(
        /\.pdf-guides\s*\{[\s\S]{0,400}background:\s*var\(--surface-2\)/.test(landingCss || ''),
        'landing.css: pdf-guides section uses surface-2 background (DS v0.2.1)'
      )
    );
    tally(
      assert(
        /\.pdf-guide-card\s*\{[\s\S]{0,500}box-shadow:\s*var\(--shadow-soft\)/.test(landingCss || ''),
        'landing.css: pdf-guide-card rest elevation shadow-soft (DS v0.2.1)'
      )
    );
    // DS v0.3.3 Phase B: legacy <button class="pdf-guide-preview-btn"> was
    // replaced by the merged .pdf-see-inside affordance. Validate the new
    // structure is rendered (one details per guide card, with thumbs ul +
    // chapters list + open-all escalation link).
    tally(
      assert(
        enIndex.includes('data-see-inside="beginner"') &&
          enIndex.includes('data-see-inside="advanced"'),
        'en/index.html: per-card "See inside" details for both guides (DS v0.3.3 Phase B)'
      )
    );
    tally(
      assert(
        enIndex.includes('data-see-inside-thumbs="beginner"') &&
          enIndex.includes('data-see-inside-thumbs="advanced"') &&
          enIndex.includes('data-toc-list="beginner"') &&
          enIndex.includes('data-toc-list="advanced"'),
        'en/index.html: See inside contains thumbs ul + chapter ol per guide (DS v0.3.3 Phase B)'
      )
    );
    tally(
      assert(
        (enIndex.match(/class="pdf-see-inside__open-all"[^>]*data-preview-trigger="(beginner|advanced)"/g) || []).length === 2,
        'en/index.html: each See inside has 1 "Open all pages" preview-trigger link (DS v0.3.3 Phase B)'
      )
    );
    tally(
      assert(
        !enIndex.includes('pdf-guide-preview-btn'),
        'en/index.html: legacy pdf-guide-preview-btn removed (DS v0.3.3 Phase B)'
      )
    );
    // Per-card pdf-guide-highlights are removed in Phase B; bundle keeps its
    // own highlights list (#pdf-bundle-offer). Assert exactly one occurrence
    // remains and it is the bundle one.
    const highlightsCount =
      (enIndex.match(/class="pdf-guide-highlights"/g) || []).length;
    tally(
      assert(
        highlightsCount === 1 &&
          enIndex.includes('data-guide-highlights="bundle"'),
        'en/index.html: pdf-guide-highlights only on bundle (DS v0.3.3 Phase B; got ' +
          highlightsCount +
          ' total)'
      )
    );
    const sharedCss = fs.readFileSync(path.join(ROOT, 'assets/styles.css'), 'utf8');
    tally(
      assert(/\.btn\.btn--ghost\s*\{/.test(sharedCss), 'assets/styles.css: btn--ghost component (DS v0.2.1)')
    );
    const ringFocusCount = (landingCss.match(/outline:\s*var\(--ring-focus\)/g) || []).length;
    tally(
      assert(ringFocusCount >= 8, 'landing.css: --ring-focus on >=8 components (DS v0.2)')
    );
    // --- DS v0.2.2: sticky & anchor polish ---
    tally(
      assert(
        /scroll-margin-top:\s*clamp\(/.test(landingCss),
        'landing.css: scroll-margin-top clamp() for sticky-overlapped anchors (DS v0.2.2)'
      )
    );
    tally(
      assert(
        /backdrop-filter:\s*saturate\(180%\)\s*blur\(12px\)/.test(landingCss) &&
          /@supports not \(backdrop-filter:\s*blur\(12px\)\)/.test(landingCss),
        'landing.css: .page-lanes-nav backdrop-filter glass + @supports fallback (DS v0.2.2)'
      )
    );
    tally(
      assert(
        /@media\s*\(\s*max-width:\s*768px\s*\)[\s\S]*\.page-lanes-nav\s*\{[^}]*display:\s*none/.test(
          landingCss
        ),
        'landing.css: .page-lanes-nav hidden at max-width 768px (mobile lane UX)'
      )
    );
    tally(
      assert(
        /env\(safe-area-inset-bottom\)/.test(landingCss),
        'landing.css: .pdf-sticky-cta safe-area inset for iOS (DS v0.2.2)'
      )
    );
    tally(
      assert(
        /\.skip-link:focus\s*\{[^}]*outline:\s*var\(--ring-focus\)/.test(landingCss),
        'landing.css: .skip-link:focus uses --ring-focus token (DS v0.2.2)'
      )
    );
    // --- DS v0.2.3: motion ritmu & lift token sistema ---
    const transitionLiteralMatches = (
      landingCss.match(/transition:[^;]*\b\d+(?:\.\d+)?s\s+(?:ease|var)/g) || []
    );
    tally(
      assert(
        transitionLiteralMatches.length === 0,
        `landing.css: no literal "Ns ease" transitions left (DS v0.2.3); found ${transitionLiteralMatches.length}`
      )
    );
    const liftSmCount = (landingCss.match(/translateY\(var\(--lift-sm\)\)/g) || []).length;
    const liftMdCountLanding = (landingCss.match(/translateY\(var\(--lift-md\)\)/g) || []).length;
    const liftMdCountShared = (sharedCss.match(/translateY\(var\(--lift-md\)\)/g) || []).length;
    const liftMdCountTotal = liftMdCountLanding + liftMdCountShared;
    tally(
      assert(
        liftSmCount >= 4 && liftMdCountTotal >= 2,
        `landing.css: --lift-sm >=4 (got ${liftSmCount}); --lift-md across landing+styles >=2 (got ${liftMdCountTotal}) (DS v0.2.3 + v0.2.5 .btn dedup)`
      )
    );
    tally(
      assert(
        /--lift-sm:\s*-1px/.test(sharedCss) && /--lift-md:\s*-2px/.test(sharedCss),
        'assets/styles.css: declares --lift-sm and --lift-md tokens (DS v0.2.3)'
      )
    );
    tally(
      assert(
        /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,600}transform:\s*none\s*!important/.test(landingCss),
        'landing.css: reduced-motion explicitly resets hover/focus transform (DS v0.2.3)'
      )
    );
    // --- DS v0.2.4: focus + radius + form consolidation ---
    tally(
      assert(
        /--ring-focus-on-dark:\s*3px solid #FFFFFF/.test(sharedCss) && /--r-xs:\s*4px/.test(sharedCss),
        'assets/styles.css: declares --ring-focus-on-dark and --r-xs tokens (DS v0.2.4)'
      )
    );
    const literalOutlineMatches = (
      landingCss.match(/outline:\s*\d+px solid (#|var\(--white\)|var\(--text\)|var\(--accent-dark\)|var\(--brand-prompt-anatomy-accent\))/g) || []
    );
    tally(
      assert(
        literalOutlineMatches.length === 0,
        `landing.css: no literal outline declarations left — all use --ring-focus / --ring-focus-on-dark (DS v0.2.4); found ${literalOutlineMatches.length}`
      )
    );
    const literalRadiusMatches = (
      landingCss.match(/border-radius:\s*(?:999px|8px|4px|12px)\b/g) || []
    );
    tally(
      assert(
        literalRadiusMatches.length === 0,
        `landing.css: no literal border-radius (999/8/4/12 px) — all use --r-* tokens (DS v0.2.4); found ${literalRadiusMatches.length}`
      )
    );
    tally(
      assert(
        /\.form-input:focus-visible\s*\{[^}]*border-color:\s*var\(--accent-gold-dark\)[^}]*box-shadow:\s*0\s+0\s+0\s+4px\s+rgba\(207,\s*167,\s*58/.test(landingCss),
        'landing.css: .form-input:focus-visible uses gold ring (DS v0.2.4)'
      )
    );
    tally(
      assert(
        /\.code-block\s*\{[\s\S]{0,400}border-left:\s*3px solid var\(--accent-primary\)/.test(landingCss),
        'landing.css: .code-block border-left 3px (matches .faq-panel gravitas, DS v0.2.4)'
      )
    );
    // --- DS v0.2.5: affordance & state polish ---
    tally(
      assert(
        /@supports selector\(:has\(\*\)\)[\s\S]{0,200}\.prompt:has\(\.prompt-done:checked\)/.test(landingCss),
        'landing.css: .prompt:has(.prompt-done:checked) gated by @supports (DS v0.2.5)'
      )
    );
    tally(
      assert(
        /\.code-block\.selected::after\s*\{[\s\S]{0,400}transform:\s*rotate\(45deg\)/.test(landingCss),
        'landing.css: .code-block.selected::after gold check marker (DS v0.2.5)'
      )
    );
    tally(
      assert(
        /\.prompt:hover\s*\{[\s\S]{0,300}transform:\s*translateY\(var\(--lift-sm\)\)/.test(landingCss),
        'landing.css: .prompt:hover lift matches CTA physics (DS v0.2.5)'
      )
    );
    tally(
      assert(
        /\.pdf-guide-card--featured\s*\{[\s\S]{0,300}inset 0 0 0 1px var\(--accent-gold\)/.test(landingCss),
        'landing.css: .pdf-guide-card--featured gold inset stroke (DS v0.2.5)'
      )
    );
    tally(
      assert(
        /\.code-block\s*\{[\s\S]{0,1500}scrollbar-color:\s*var\(--border-subtle-dark\)/.test(landingCss) &&
          /\.code-block::-webkit-scrollbar\s*\{/.test(landingCss),
        'landing.css: .code-block scrollbar styling (DS v0.2.5)'
      )
    );
    tally(
      assert(
        /\.business-address\s*\{[\s\S]{0,400}max-width:\s*420px/.test(landingCss),
        'landing.css: .business-address desktop max-width 420px (DS v0.2.5)'
      )
    );
    const landingBtnTopLevel = (landingCss.match(/^\s+\.btn\s*\{/gm) || []).length;
    tally(
      assert(
        landingBtnTopLevel === 0,
        `landing.css: no top-level .btn { } block (deduplicated to assets/styles.css, DS v0.2.5); found ${landingBtnTopLevel}`
      )
    );
    tally(
      assert(
        /\.prompt-footer \.btn\s*\{/.test(landingCss),
        'landing.css: .prompt-footer .btn scoped override (DS v0.2.5)'
      )
    );
    // --- DS v0.3.0 PR-1: shadow & inset system ---
    [
      '--shadow-inset-hi',
      '--shadow-inset-hi-strong',
      '--shadow-cta-press',
      '--shadow-glow-success',
      '--shadow-glow-gold',
      '--shadow-glow-gold-hover',
    ].forEach((tok) => {
      tally(
        assert(
          new RegExp(tok + ':').test(sharedCss),
          'assets/styles.css: ' + tok + ' declared (DS v0.3.0 PR-1)'
        )
      );
    });
    const insetHiUsages = (landingCss.match(/var\(--shadow-inset-hi\)/g) || []).length;
    tally(
      assert(
        insetHiUsages >= 8,
        'landing.css: --shadow-inset-hi used >=8 times (DS v0.3.0 PR-1); found ' + insetHiUsages
      )
    );
    // DS v0.3.0 PR-1: card/CTA inset highlights must use --shadow-inset-hi(-strong).
    // Two documented exceptions remain (page-specific layering, not "card highlight"):
    //   1. .badge:hover  — glass-on-navy chip (deliberately low opacity, scoped to hero)
    //   2. .code-block   — multi-shadow stack composing the accent-edge effect
    const literalInsetHi = (landingCss.match(/inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.[3-9]/g) || []).length;
    tally(
      assert(
        literalInsetHi <= 2,
        'landing.css: literal inset highlights tokenized (DS v0.3.0 PR-1; <=2 documented exceptions: .badge:hover, .code-block); found ' + literalInsetHi
      )
    );
    tally(
      assert(
        /\.btn:hover\s*\{[^}]*box-shadow:\s*var\(--shadow-medium\),\s*var\(--shadow-cta\)/.test(sharedCss),
        'styles.css: .btn:hover ladder uses shadow-medium + shadow-cta (DS v0.3.0 PR-1)'
      )
    );
    tally(
      assert(
        /\.btn:active\s*\{[^}]*box-shadow:\s*var\(--shadow-cta-press\)/.test(sharedCss),
        'styles.css: .btn:active uses shadow-cta-press (DS v0.3.0 PR-1)'
      )
    );
    tally(
      assert(
        /\.cta-button:active\s*\{[^}]*box-shadow:\s*var\(--shadow-cta-press\)/.test(landingCss),
        'landing.css: .cta-button:active uses shadow-cta-press (DS v0.3.0 PR-1)'
      )
    );
    tally(
      assert(
        /\.community-cta-primary:active\s*\{[^}]*box-shadow:\s*var\(--shadow-cta-press\)/.test(landingCss),
        'landing.css: .community-cta-primary:active press state added (DS v0.3.0 PR-1)'
      )
    );
    tally(
      assert(
        /\.form-submit:active(?::not\(:disabled\))?\s*\{[^}]*box-shadow:\s*var\(--shadow-cta-press\)/.test(landingCss),
        'landing.css: .form-submit:active press state added (DS v0.3.0 PR-1)'
      )
    );
    tally(
      assert(
        /\.next-steps-links a:active\s*\{[^}]*box-shadow:\s*var\(--shadow-cta-press\)/.test(landingCss),
        'landing.css: .next-steps-links a:active press state added (DS v0.3.0 PR-1)'
      )
    );
    tally(
      assert(
        /\.btn\.success\s*\{[^}]*box-shadow:\s*var\(--shadow-glow-success\)/.test(landingCss),
        'landing.css: .btn.success uses --shadow-glow-success (DS v0.3.0 PR-1)'
      )
    );
    tally(
      assert(
        /\.objectives li::before\s*\{[\s\S]{0,400}box-shadow:\s*var\(--shadow-glow-gold\)/.test(landingCss),
        'landing.css: .objectives li::before uses --shadow-glow-gold (DS v0.3.0 PR-1)'
      )
    );
    // --- DS v0.3.0 PR-2: typography polish ---
    tally(
      assert(
        landingCss.includes('-webkit-font-smoothing: antialiased') &&
          landingCss.includes('-moz-osx-font-smoothing: grayscale'),
        'landing.css: body font smoothing (DS v0.3.0 PR-2)'
      )
    );
    tally(
      assert(
        landingCss.includes('text-rendering: optimizeLegibility'),
        'landing.css: body text-rendering optimizeLegibility (DS v0.3.0 PR-2)'
      )
    );
    tally(
      assert(
        sharedCss.includes('color-scheme: light'),
        'styles.css: :root color-scheme: light (DS v0.3.0 PR-2)'
      )
    );
    tally(
      assert(
        /:root\s*\{[\s\S]{0,400}accent-color:\s*var\(--accent-primary\)/.test(sharedCss),
        'styles.css: :root accent-color via --accent-primary (DS v0.3.0 PR-2)'
      )
    );
    const tabularUsages = (landingCss.match(/font-variant-numeric:\s*tabular-nums/g) || []).length;
    tally(
      assert(
        tabularUsages >= 5,
        'landing.css: tabular-nums applied to >=5 numeric selectors (DS v0.3.0 PR-2); found ' + tabularUsages
      )
    );
    tally(
      assert(
        /\.header h1\s*\{[\s\S]{0,400}font-size:\s*clamp\(28px,\s*6vw \+ 8px,\s*52px\)/.test(landingCss),
        'landing.css: hero h1 fluid clamp() (DS v0.3.0 PR-2)'
      )
    );
    const literalHeroH1 = (
      landingCss.match(/\.header h1\s*\{[^}]*font-size:\s*(?:52px|44px|36px|26px|var\(--fs-3xl\)|var\(--fs-2xl\))/g) || []
    ).length;
    tally(
      assert(
        literalHeroH1 === 0,
        'landing.css: no literal .header h1 font-size in media queries (DS v0.3.0 PR-2); found ' + literalHeroH1
      )
    );
    // --- DS v0.3.0 PR-3: color & gradient tokens ---
    [
      '--gradient-hero',
      '--gradient-card-tint',
      '--gradient-jump-nav',
      '--gradient-gold-pearl',
      '--border-navy-soft',
      '--border-navy',
      '--border-navy-strong',
    ].forEach((tok) => {
      tally(
        assert(
          new RegExp(tok + ':').test(sharedCss),
          'assets/styles.css: ' + tok + ' declared (DS v0.3.0 PR-3)'
        )
      );
    });
    tally(
      assert(
        /\.header\s*\{[\s\S]{0,400}background:\s*var\(--gradient-hero\)/.test(landingCss),
        'landing.css: .header uses --gradient-hero token (DS v0.3.0 PR-3)'
      )
    );
    tally(
      assert(
        /\.instructions\s*\{[\s\S]{0,400}background:\s*var\(--gradient-card-tint\)/.test(landingCss),
        'landing.css: .instructions uses --gradient-card-tint token (DS v0.3.0 PR-3)'
      )
    );
    tally(
      assert(
        /\.objectives li::before\s*\{[\s\S]{0,400}background:\s*var\(--gradient-gold-pearl\)/.test(landingCss),
        'landing.css: .objectives li::before uses --gradient-gold-pearl token (DS v0.3.0 PR-3)'
      )
    );
    const navyLiterals = (landingCss.match(/border(?:-color)?:\s*[^;]*rgba\(16,\s*59,\s*90/g) || []).length;
    tally(
      assert(
        navyLiterals === 0,
        'landing.css: no literal navy-tint borders (use --border-navy* tokens, DS v0.3.0 PR-3); found ' + navyLiterals
      )
    );
    tally(
      assert(
        !/\.header \.header-cta \.cta-button-outline\s*\{[^}]*opacity:\s*0\.95/.test(landingCss),
        'landing.css: hero .cta-button-outline has no opacity 0.95 leftover (DS v0.3.0 PR-3)'
      )
    );
    tally(
      assert(
        /\.pdf-sticky-cta\s*\{[\s\S]{0,600}backdrop-filter:\s*saturate\(180%\)\s*blur\(12px\)/.test(landingCss),
        'landing.css: .pdf-sticky-cta uses glass backdrop-filter (DS v0.3.0 PR-3)'
      )
    );
    tally(
      assert(
        /@supports not \(backdrop-filter:\s*blur\(12px\)\)\s*\{[\s\S]{0,400}\.pdf-sticky-cta/.test(landingCss),
        'landing.css: .pdf-sticky-cta has @supports fallback (DS v0.3.0 PR-3)'
      )
    );
    // --- DS v0.3.0 PR-4: deprecated alias guard ---
    // Aliases stay declared in assets/styles.css for back-compat (REMOVED IN v0.3.1).
    // Templates and landing.css must not reference them in new code.
    const DEPRECATED_TOKENS = [
      '--orange-light',
      '--orange',
      '--blue-light',
      '--community-cta-green',
      '--community-cta-green-hover',
      '--shadow-card',
      '--shadow-card-hover',
    ];
    const deprecatedTargets = {
      'templates/index-lt.html': template,
      'assets/landing.css': landingCss,
    };
    for (const [filePath, body] of Object.entries(deprecatedTargets)) {
      if (!body) continue;
      for (const tok of DEPRECATED_TOKENS) {
        // Match `var(--token` boundaries; --shadow-card-hover must not also match --shadow-card.
        const re = new RegExp('var\\(\\s*' + tok.replace(/-/g, '\\-') + '(?![\\w-])');
        tally(
          assert(
            !re.test(body),
            'DS v0.3.0 PR-4: deprecated alias ' + tok + ' must not be used in ' + filePath
          )
        );
      }
    }
    tally(
      assert(
        /DEPRECATED ALIASES — REMOVED IN v0\.3\.1/.test(sharedCss),
        'styles.css: consolidated deprecation block declares v0.3.1 hard removal (DS v0.3.0 PR-4)'
      )
    );
    const afterPurchaseBlock = enIndex.match(
      /class="pdf-guides-after-purchase"[\s\S]*?<\/div>\s*\n\s*<\/section>/
    );
    tally(
      assert(
        afterPurchaseBlock && !afterPurchaseBlock[0].includes('class="legal-disclaimer"'),
        'en/index.html: no duplicate legal-disclaimer in pdf-guides-after-purchase (footer only)'
      )
    );
    const pdfPos = enIndex.indexOf('id="pdf-guides"');
    const block1Pos = enIndex.indexOf('id="block1"');
    tally(assert(pdfPos !== -1 && block1Pos !== -1 && pdfPos < block1Pos, 'pdf-guides appears before first free prompt'));
    const freeLabelPos = enIndex.indexOf('id="free-prompts-label"');
    tally(assert(freeLabelPos !== -1, 'en/index.html free-prompts-label element'));
    tally(
      assert(
        pdfPos !== -1 && block1Pos !== -1 && freeLabelPos !== -1 && pdfPos < freeLabelPos && freeLabelPos < block1Pos,
        'free-prompts-label between pdf-guides and first prompt'
      )
    );
    tally(assert(!enIndex.includes('header-tertiary-cta'), 'en/index.html: no hero tertiary CTA'));
    const objectivesPos = enIndex.indexOf('class="objectives"');
    tally(
      assert(
        objectivesPos !== -1 && pdfPos !== -1 && objectivesPos < pdfPos,
        'objectives section appears before pdf-guides'
      )
    );
    tally(assert(enIndex.includes('id="page-lanes-nav"'), 'en/index.html: sticky page lanes nav'));
    tally(assert(enIndex.includes('page-lane--shop') && enIndex.includes('page-lane--free'), 'en/index.html: shop and free lane wrappers'));
    const workflowPos = enIndex.indexOf('id="workflow-overview"');
    const instructionsPos = enIndex.indexOf('class="instructions"');
    tally(
      assert(
        freeLabelPos !== -1 && workflowPos !== -1 && freeLabelPos < workflowPos,
        'workflow-overview after free-prompts-label (free lane)'
      )
    );
    tally(
      assert(
        workflowPos !== -1 && instructionsPos !== -1 && workflowPos < instructionsPos,
        'workflow-overview before instructions'
      )
    );
    tally(
      assert(
        pdfPos !== -1 && workflowPos !== -1 && workflowPos > pdfPos,
        'workflow-overview not between objectives and pdf-guides'
      )
    );
    const pdfGridPos = enIndex.indexOf('class="pdf-guides-grid"');
    const buyerFaqPos = enIndex.indexOf('id="pdf-guides-faq"');
    tally(
      assert(
        pdfGridPos !== -1 && buyerFaqPos !== -1 && pdfGridPos < buyerFaqPos,
        'buyer FAQ after pdf-guides-grid'
      )
    );
    tally(
      assert(
        heroBlock && heroBlock[0].includes('href="#free-prompts-label"'),
        'hero secondary CTA targets free-prompts-label'
      )
    );
    tally(assertPublicEnSurface('en/index.html', enIndex));
    tally(assert(!enIndex.includes('badge-spinoff'), 'en/index.html: no Series badge'));
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
  tally(assert(fulfillment && fulfillment.includes('STRIPE_PRICE_BUNDLE_PDF'), 'fulfillment.js references bundle Stripe price env'));
  tally(assert(fulfillment && fulfillment.includes('REDIS_KEY_PREFIX') && fulfillment.includes('function redisKey'), 'fulfillment.js supports REDIS_KEY_PREFIX'));

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

  tally(assertPublicEnSurface('en/privacy.html', enPrivacy));
  tally(assertPublicEnSurface('privacy.html gateway', privacyGateway));
  tally(assertPublicEnSurface('terms.html', terms));
  tally(assertPublicEnSurface('success.html', success));
  tally(assert(fulfillment && !/\bPersonalas\b/.test(fulfillment), 'fulfillment.js: no customer-facing Personalas in fulfillment emails'));
  tally(assert(fulfillment && fulfillment.includes("'Beginner_HR_Hiring_Guide.pdf'"), 'fulfillment.js: beginner download filename uses HR brand'));
  tally(assert(fulfillment && fulfillment.includes("'Advanced_HR_Hiring_Guide.pdf'"), 'fulfillment.js: advanced download filename uses HR brand'));
  tally(assert(fulfillment && !/personalas-(beginner|advanced)-guide\.pdf/.test(fulfillment), 'fulfillment.js: no LT-prefixed download filenames'));

  // --- PDF source HTML ---
  const beginnerPdfHtml = readFile(path.join(ROOT, 'docs', 'pdf-source', 'beginner-personalas-hr.html'));
  const advancedPdfHtml = readFile(path.join(ROOT, 'docs', 'pdf-source', 'advanced-personalas-hr.html'));
  tally(assert(beginnerPdfHtml && (beginnerPdfHtml.match(/<section class="page/g) || []).length === 16, 'beginner PDF HTML has 16 pages'));
  tally(assert(advancedPdfHtml && (advancedPdfHtml.match(/<section class="page/g) || []).length === 32, 'advanced PDF HTML has 32 pages'));
  tally(assert(advancedPdfHtml && advancedPdfHtml.includes('Sample debrief transcript'), 'advanced PDF includes debrief transcript page'));
  tally(assert(advancedPdfHtml && advancedPdfHtml.includes('Comp &amp; pay-transparency worksheet'), 'advanced PDF includes comp worksheet'));
  tally(assert(advancedPdfHtml && advancedPdfHtml.includes('class="compare-grid"'), 'advanced PDF includes filled scorecard component'));
  tally(assert(advancedPdfHtml && advancedPdfHtml.includes('class="pilot-timeline"'), 'advanced PDF includes 4-week pilot timeline'));
  tally(assert(advancedPdfHtml && /Prompt 11/.test(advancedPdfHtml), 'advanced PDF declares Prompt 11'));
  tally(assert(beginnerPdfHtml && beginnerPdfHtml.includes('www.promptanatomy.app') && beginnerPdfHtml.includes('promptanatomy.help'), 'beginner PDF branding'));
  tally(assert(advancedPdfHtml && advancedPdfHtml.includes('www.promptanatomy.app') && advancedPdfHtml.includes('promptanatomy.help'), 'advanced PDF branding'));
  tally(assert(beginnerPdfHtml && beginnerPdfHtml.includes('cover-eyebrow">Prompt Anatomy</p>'), 'beginner PDF cover eyebrow Prompt Anatomy'));
  tally(
    assert(
      advancedPdfHtml &&
        advancedPdfHtml.includes('cover-eyebrow">Prompt Anatomy') &&
        advancedPdfHtml.includes('Advanced Edition</p>'),
      'advanced PDF cover eyebrow'
    )
  );
  tally(assert(beginnerPdfHtml && !/\bPersonalas\b/.test(beginnerPdfHtml), 'beginner PDF: no Personalas'));
  tally(assert(advancedPdfHtml && !/\bPersonalas\b/.test(advancedPdfHtml), 'advanced PDF: no Personalas'));

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
  tally(assert(sot && sot.pdfGuides.advanced.chapters.length === sot.pdfGuides.advanced.pages, 'sot advanced chapters length === pages (32)'));
  tally(assert(sot && Array.isArray(sot.buyerFaq) && sot.buyerFaq.length === 5, 'sot.json buyerFaq has 5 items'));
  tally(
    assert(
      sot &&
        sot.pdfGuides &&
        sot.pdfGuides.beginner &&
        sot.pdfGuides.beginner.stripePaymentLink &&
        !sot.pdfGuides.beginner.stripePaymentLink.includes('REPLACE_'),
      'sot.json beginner stripePaymentLink is configured'
    )
  );
  tally(
    assert(
      sot &&
        sot.pdfGuides &&
        sot.pdfGuides.advanced &&
        sot.pdfGuides.advanced.stripePaymentLink &&
        !sot.pdfGuides.advanced.stripePaymentLink.includes('REPLACE_'),
      'sot.json advanced stripePaymentLink is configured'
    )
  );
  tally(
    assert(
      sot &&
        sot.pdfGuides &&
        sot.pdfGuides.bundle &&
        sot.pdfGuides.bundle.stripePaymentLink &&
        !sot.pdfGuides.bundle.stripePaymentLink.includes('REPLACE_'),
      'sot.json bundle stripePaymentLink is configured'
    )
  );
  tally(assert(sot && sot.legal && sot.legal.metaDescription, 'sot.json legal.metaDescription'));
  tally(assert(sot && sot.positioning && sot.positioning.primaryKpi === 'pdf', 'sot.json positioning.primaryKpi is pdf'));
  tally(assert(sot && sot.marketing && sot.marketing.hero && sot.marketing.hero.primaryCtaHref === '#pdf-guides', 'sot.json hero primary CTA targets pdf-guides'));
  tally(assert(sot && sot.product && sot.product.contactEmail === 'info@promptanatomy.app', 'sot.json canonical contactEmail'));
  tally(assert(sot && sot.brand && sot.brand.publicName === 'Prompt Anatomy', 'sot.json brand.publicName'));

  // --- Business postal address (CAN-SPAM + Stripe trust + footer/privacy/terms) ---
  const businessAddress = sot && sot.product && sot.product.businessAddress;
  tally(assert(businessAddress && typeof businessAddress === 'object', 'sot.json: product.businessAddress object exists'));
  const requiredAddressKeys = ['name', 'street', 'city', 'region', 'postalCode', 'country'];
  for (const key of requiredAddressKeys) {
    tally(assert(businessAddress && typeof businessAddress[key] === 'string' && businessAddress[key].length > 0,
      'sot.json: businessAddress.' + key));
  }
  const addrStreet = businessAddress ? businessAddress.street : '';
  const addrLocality = businessAddress
    ? businessAddress.city + ', ' + businessAddress.region + ' ' + businessAddress.postalCode
    : '';
  if (enIndex) {
    tally(assert(enIndex.includes(addrStreet), 'en/index.html footer includes business street: ' + addrStreet));
    tally(assert(enIndex.includes(addrLocality), 'en/index.html footer includes business locality: ' + addrLocality));
    tally(assert(enIndex.includes('class="business-address"'), 'en/index.html footer has semantic <address class="business-address">'));
    tally(assert(enIndex.includes('"@type":"PostalAddress"') || enIndex.includes('"@type": "PostalAddress"'),
      'en/index.html JSON-LD includes PostalAddress'));
    tally(assert(enIndex.includes('"postalCode":"' + (businessAddress ? businessAddress.postalCode : '') + '"')
      || enIndex.includes('"postalCode": "' + (businessAddress ? businessAddress.postalCode : '') + '"'),
      'en/index.html JSON-LD postalCode matches SOT'));
    tally(assert(!enIndex.includes('{{SOT_BUSINESS_ADDRESS}}'),
      'en/index.html: business address token fully substituted'));
  }
  if (enPrivacy) {
    tally(assert(enPrivacy.includes(addrStreet), 'en/privacy.html includes business street'));
    tally(assert(enPrivacy.includes(addrLocality), 'en/privacy.html includes business locality'));
    tally(assert(!enPrivacy.includes('{{SOT_BUSINESS_ADDRESS}}'),
      'en/privacy.html: business address token fully substituted'));
  }
  tally(assert(terms && terms.includes(addrStreet), 'terms.html includes business street'));
  tally(assert(terms && terms.includes(addrLocality), 'terms.html includes business locality'));
  tally(assert(success && success.includes(addrStreet), 'success.html includes business street'));
  tally(assert(success && success.includes(addrLocality), 'success.html includes business locality'));
  tally(assert(fulfillment && fulfillment.includes('businessAddressTextLines'),
    'fulfillment.js exposes businessAddressTextLines helper'));
  tally(assert(fulfillment && fulfillment.includes('BUSINESS_ADDRESS') && fulfillment.includes('CAN-SPAM'),
    'fulfillment.js loads BUSINESS_ADDRESS with CAN-SPAM note'));
  tally(assert(fulfillment && fulfillment.includes('buildBusinessAddressHtml'),
    'fulfillment.js HTML emails include buildBusinessAddressHtml'));

  const beginnerCover = path.join(ROOT, 'assets', 'pdf-covers', 'beginner.png');
  tally(assert(fs.existsSync(beginnerCover), 'assets/pdf-covers/beginner.png exists'));
  const advancedCover = path.join(ROOT, 'assets', 'pdf-covers', 'advanced.png');
  tally(assert(fs.existsSync(advancedCover), 'assets/pdf-covers/advanced.png exists'));
  const previewPagesByGuide = {
    beginner: (sot && sot.pdfGuides && sot.pdfGuides.beginner && sot.pdfGuides.beginner.previewPages) || [6, 8, 9],
    advanced: (sot && sot.pdfGuides && sot.pdfGuides.advanced && sot.pdfGuides.advanced.previewPages) || [10, 15, 17]
  };
  Object.keys(previewPagesByGuide).forEach(function (prefix) {
    previewPagesByGuide[prefix].forEach(function (n) {
      const sample = path.join(ROOT, 'assets', 'pdf-covers', prefix + '-p' + n + '.png');
      tally(assert(fs.existsSync(sample), 'assets/pdf-covers/' + prefix + '-p' + n + '.png exists'));
    });
  });
  if (enIndex) {
    tally(assert(enIndex.includes('loading="eager"') && enIndex.includes('beginner.png'), 'en/index.html beginner cover eager load'));
    tally(assert(enIndex.includes('pdf-guide-highlights'), 'en/index.html PDF highlights'));
    tally(assert(enIndex.includes('pdf-sticky-cta'), 'en/index.html sticky PDF CTA'));
    tally(assert(enIndex.includes('28E9ATfGAebzcO011ufjG06'), 'en/index.html live beginner Stripe link'));
    tally(assert(enIndex.includes('14A14n660d7vcO0aC4fjG07'), 'en/index.html live advanced Stripe link'));
    tally(assert(enIndex.includes('5kQ6oH660ebz29m39CfjG08'), 'en/index.html live bundle Stripe link'));
    tally(assert(!enIndex.includes('REPLACE_BUNDLE_PAYMENT_LINK'), 'en/index.html no bundle placeholder'));
    tally(assert(!enIndex.includes('REPLACE_BEGINNER_PAYMENT_LINK'), 'en/index.html no beginner Stripe placeholder'));
    tally(assert(!enIndex.includes('REPLACE_ADVANCED_PAYMENT_LINK'), 'en/index.html no advanced Stripe placeholder'));
  }

  // --- PDF CTAs on EN index ---
  if (enIndex) {
    tally(assert(enIndex.includes('Beginner') && enIndex.includes('Advanced'), 'en/index.html mentions Beginner and Advanced PDFs'));
    tally(assert(enIndex.includes('$5.99') && enIndex.includes('$11.99'), 'en/index.html shows $5.99 and $11.99 prices'));
    tally(assert(enIndex.includes('id="pdf-guides"'), 'en/index.html pdf-guides section'));
    tally(assert(enIndex.includes('data-product="beginner-pdf"') && enIndex.includes('data-product="advanced-pdf"'), 'PDF Stripe product markers'));
    tally(assert(enIndex.includes('class="pdf-guide-specs"') && enIndex.includes('16 pages') && enIndex.includes('32 pages'), 'PDF specs row'));
    tally(assert(enIndex.includes('data-sample-link="beginner"') && enIndex.includes('data-sample-link="advanced"'), 'PDF sample links: both beginner + advanced'));
    tally(assert(enIndex.includes('prompt-anatomy-advanced-scorecard-sample.pdf'), 'en/index.html links advanced sample PDF'));
    tally(assert(enIndex.includes('Personal license') && enIndex.includes('terms.html#paid-pdf-license'), 'PDF personal license line'));
    tally(
      assert(
        enIndex.includes('id="pdf-section-trust"') && enIndex.includes('Stripe checkout') && enIndex.includes('14-day refund'),
        'PDF section trust row'
      )
    );
    tally(assert(enIndex.includes('id="pdfPreviewDialog"') && enIndex.includes('data-preview-trigger="beginner"'), 'PDF preview dialog'));
    tally(assert(enIndex.includes('id="pdf-guides-faq"') && enIndex.includes('data-buyer-faq-list'), 'Buyer FAQ hook'));
    tally(assert(!enIndex.includes('class="pdf-author-panel"'), 'PDF author panel relict removed (info lives in footer)'));
    tally(
      assert(
        /\.pdf-guide-cta[^{]*:visited[^{]*\{/.test(enSurfaceCss) ||
          /\.pdf-guide-cta:link[\s\S]{0,200}:visited/.test(enSurfaceCss),
        'PDF Buy CTA defines :visited (no dark visited link on navy)'
      )
    );
    tally(
      assert(
        /\.pdf-guide-cta[\s\S]{0,400}var\(--text-on-accent\)/.test(enSurfaceCss),
        'PDF Buy CTA uses --text-on-accent token'
      )
    );
    tally(
      assert(
        enIndex.includes('class="pdf-guides-after-purchase"'),
        'PDF after-purchase block (FAQ + free-bridge)'
      )
    );
    tally(
      assert(
        !/--orange-light|--community-cta-green|--blue-light/.test(enSurfaceCss),
        'built EN surface CSS must not use deprecated DS color aliases'
      )
    );
    tally(
      assert(
        enIndex.includes('../assets/landing.css?v='),
        'en/index.html: versioned landing.css cache bust'
      )
    );
    tally(
      assert(
        enIndex.includes('../assets/styles.css?v='),
        'en/index.html: versioned styles.css cache bust'
      )
    );
    tally(
      assert(
        /data-buyer-faq-list[^>]*>\s*<details class="faq-details"/.test(enIndex),
        'Buyer FAQ pre-rendered at build time (no JS fetch needed)'
      )
    );
    tally(assert(success && success.includes('terms.html#paid-pdf-license'), 'success.html license link'));
  }

  // ----------------------------------------------------------------------------
  // GEO + AI crawler surface (2026 hardening) — locks all contracts emitted by
  // scripts/build-locale-pages.js so they can't silently regress on rebuild.
  // ----------------------------------------------------------------------------
  tally(assertGeoSurface({
    robots: robots,
    sitemap: sitemap,
    enIndex: enIndex,
    enPrivacy: enPrivacy,
    rootIndex: html,
    terms: terms,
    success: success,
    sot: sot,
  }));

  console.log('\n---');
  console.log(`Result: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('All structural tests pass.\n');
}

const ROBOTS_AI_UAS = [
  'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User',
  'Claude-SearchBot', 'Claude-User', 'Applebot-Extended',
  'GPTBot', 'ClaudeBot', 'Google-Extended', 'Amazonbot',
  'anthropic-ai', 'cohere-ai', 'CCBot', 'Bytespider', 'Meta-ExternalAgent',
];
const ROBOTS_META_FULL =
  '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">';
const OG_IMAGE_ALT_LITERAL = 'HR hiring PDF guides for US teams - Prompt Anatomy';
const INDEXNOW_KEY_LITERAL = '7a4b9e2c8f1d4a3b9c6e5d2a1f8b7c4d';

function assertGeoSurface(ctx) {
  let ok = true;
  const tallyLocal = (cond, msg) => { ok = assert(cond, msg) && ok; };

  // --- robots.txt: per-AI-bot policy + IndexNow + /api disallow ---
  if (ctx.robots) {
    ROBOTS_AI_UAS.forEach((ua) => {
      tallyLocal(new RegExp('^User-agent: ' + ua + '\\b', 'm').test(ctx.robots),
        'robots.txt: User-agent ' + ua);
    });
    tallyLocal(/^Disallow: \/api\//m.test(ctx.robots), 'robots.txt: Disallow /api/');
    tallyLocal(/Allow: \//.test(ctx.robots), 'robots.txt: at least one Allow: /');
    tallyLocal(ctx.robots.includes('Sitemap: https://'), 'robots.txt: absolute Sitemap');
    tallyLocal(ctx.robots.includes('IndexNow: https://') && ctx.robots.includes(INDEXNOW_KEY_LITERAL + '.txt'),
      'robots.txt: IndexNow reference with key');
    tallyLocal(/^Disallow: \/assets\/samples\//m.test(ctx.robots),
      'robots.txt: Disallow /assets/samples/ (training carveout)');
    tallyLocal(/^Disallow: \/assets\/pdf-covers\//m.test(ctx.robots),
      'robots.txt: Disallow /assets/pdf-covers/ (training carveout)');
  }

  // --- sitemap.xml: image namespace, lastmod, image:loc entries ---
  if (ctx.sitemap) {
    tallyLocal(ctx.sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'),
      'sitemap.xml: image namespace declared');
    const lastmodCount = (ctx.sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length;
    tallyLocal(lastmodCount >= 5, 'sitemap.xml: >=5 ISO-date <lastmod> entries (got ' + lastmodCount + ')');
    const imageCount = (ctx.sitemap.match(/<image:loc>/g) || []).length;
    tallyLocal(imageCount >= 3, 'sitemap.xml: >=3 <image:loc> entries on /en/ (got ' + imageCount + ')');
    tallyLocal(ctx.sitemap.includes('og-default-v2.png'), 'sitemap.xml: OG image in image:image');
    tallyLocal(ctx.sitemap.includes('beginner.png') && ctx.sitemap.includes('advanced.png'),
      'sitemap.xml: PDF cover images in image:image');
  }

  // --- en/index.html: meta robots + OG enrichments + social handles ---
  if (ctx.enIndex) {
    tallyLocal(ctx.enIndex.includes(ROBOTS_META_FULL),
      'en/index.html: meta robots max-snippet:-1 etc.');
    tallyLocal(ctx.enIndex.includes('<meta property="og:site_name" content="Prompt Anatomy">'),
      'en/index.html: og:site_name');
    tallyLocal(ctx.enIndex.includes('og:image:alt') && ctx.enIndex.includes(OG_IMAGE_ALT_LITERAL),
      'en/index.html: og:image:alt with canonical alt text');
    tallyLocal(ctx.enIndex.includes('twitter:image:alt'), 'en/index.html: twitter:image:alt');
    tallyLocal(ctx.enIndex.includes('<meta name="twitter:site" content="@promptanatom">'),
      'en/index.html: twitter:site @promptanatom');
    tallyLocal(ctx.enIndex.includes('<link rel="manifest" href="/manifest.webmanifest">'),
      'en/index.html: link rel=manifest');
    tallyLocal(ctx.enIndex.includes('<meta name="theme-color" content="#103B5A">'),
      'en/index.html: theme-color navy');
  }

  // --- en/index.html: FAQPage JSON-LD (9 questions, parity check) ---
  if (ctx.enIndex && ctx.sot) {
    tallyLocal(/"@type":"FAQPage"/.test(ctx.enIndex), 'en/index.html: FAQPage JSON-LD');
    const qCount = (ctx.enIndex.match(/"@type":"Question"/g) || []).length;
    tallyLocal(qCount >= 9, 'en/index.html: >=9 Question entries (got ' + qCount + ')');
    const allFaq = (ctx.sot.frontFaq || []).concat(ctx.sot.buyerFaq || []);
    let parityOk = 0;
    allFaq.forEach((item) => {
      const qInJsonLd = ctx.enIndex.includes('"name":"' + item.q.replace(/"/g, '\\"') + '"')
        || ctx.enIndex.includes('"name":' + JSON.stringify(item.q));
      if (qInJsonLd) parityOk++;
    });
    tallyLocal(parityOk >= 7, 'en/index.html: FAQ question parity (>=7 of 9 matched, got ' + parityOk + ')');
  }

  // --- en/index.html: Product JSON-LD (x3) + Offer fields ---
  if (ctx.enIndex && ctx.sot) {
    const productCount = (ctx.enIndex.match(/"@type":"Product"/g) || []).length;
    tallyLocal(productCount === 3, 'en/index.html: exactly 3 Product nodes (got ' + productCount + ')');
    tallyLocal(/"priceCurrency":"USD"/.test(ctx.enIndex), 'en/index.html: priceCurrency USD');
    tallyLocal(/"availability":"https:\/\/schema.org\/InStock"/.test(ctx.enIndex),
      'en/index.html: availability InStock');
    tallyLocal(/"hasMerchantReturnPolicy"/.test(ctx.enIndex),
      'en/index.html: MerchantReturnPolicy on Offer');
    ['beginner', 'advanced', 'bundle'].forEach((k) => {
      const g = ctx.sot.pdfGuides && ctx.sot.pdfGuides[k];
      if (g && g.priceUSD) {
        tallyLocal(ctx.enIndex.includes('"price":"' + g.priceUSD + '"'),
          'en/index.html: Product ' + k + ' price ' + g.priceUSD);
      }
    });
    tallyLocal(!/"aggregateRating"/.test(ctx.enIndex),
      'en/index.html: NO aggregateRating (would be policy violation without real reviews)');
  }

  // --- en/index.html: Organization + Person + sameAs ---
  if (ctx.enIndex) {
    tallyLocal(/"@type":"Person"/.test(ctx.enIndex), 'en/index.html: Person node');
    tallyLocal(ctx.enIndex.includes('"Tomas Staniulis"'), 'en/index.html: Person.name Tomas Staniulis');
    tallyLocal(ctx.enIndex.includes('"contactPoint"'), 'en/index.html: Organization.contactPoint');
    tallyLocal(ctx.enIndex.includes('"knowsAbout"'), 'en/index.html: Organization.knowsAbout');
    tallyLocal(ctx.enIndex.includes('"slogan"'), 'en/index.html: Organization.slogan');
    tallyLocal(ctx.enIndex.includes('"logo":"https://promptanatomy.help/favicon.svg"'),
      'en/index.html: Organization.logo');
    tallyLocal(ctx.enIndex.includes('https://x.com/promptanatom'),
      'en/index.html: Organization sameAs includes x.com/promptanatom');
    tallyLocal(ctx.enIndex.includes('https://www.linkedin.com/in/staniulis/'),
      'en/index.html: Person sameAs includes LinkedIn');
    tallyLocal(ctx.enIndex.includes('https://x.com/TStaniulis_NFT'),
      'en/index.html: Person sameAs includes operator X handle');
  }

  // --- en/privacy.html: breadcrumb + speakable + manifest + robots ---
  if (ctx.enPrivacy) {
    tallyLocal(ctx.enPrivacy.includes(ROBOTS_META_FULL),
      'en/privacy.html: meta robots max-snippet:-1 etc.');
    tallyLocal(/"@type":"BreadcrumbList"/.test(ctx.enPrivacy),
      'en/privacy.html: BreadcrumbList JSON-LD');
    tallyLocal(/"speakable"/.test(ctx.enPrivacy),
      'en/privacy.html: speakable SpeakableSpecification');
    tallyLocal(ctx.enPrivacy.includes('og:site_name') && ctx.enPrivacy.includes('twitter:site'),
      'en/privacy.html: og:site_name + twitter:site');
    tallyLocal(ctx.enPrivacy.includes('<link rel="manifest"'),
      'en/privacy.html: link rel=manifest');
    tallyLocal(ctx.enPrivacy.includes('theme-color'),
      'en/privacy.html: theme-color');
  }

  // --- root gateway: meta robots + enriched Org ---
  if (ctx.rootIndex) {
    tallyLocal(ctx.rootIndex.includes(ROBOTS_META_FULL),
      'index.html gateway: meta robots');
    tallyLocal(ctx.rootIndex.includes('"@type":"Person"'),
      'index.html gateway: Person node');
    tallyLocal(ctx.rootIndex.includes('<link rel="manifest"'),
      'index.html gateway: manifest link');
  }

  // --- terms.html: meta robots + BreadcrumbList + OG enrichments ---
  if (ctx.terms) {
    tallyLocal(ctx.terms.includes(ROBOTS_META_FULL),
      'terms.html: meta robots');
    tallyLocal(/"@type":"BreadcrumbList"/.test(ctx.terms),
      'terms.html: BreadcrumbList JSON-LD');
    tallyLocal(ctx.terms.includes('og:site_name') && ctx.terms.includes('twitter:site'),
      'terms.html: og:site_name + twitter:site');
    tallyLocal(ctx.terms.includes('<link rel="manifest"'),
      'terms.html: link rel=manifest');
  }

  // --- success.html: noindex preserved (transactional) + OG enrichments ---
  if (ctx.success) {
    tallyLocal(/noindex/.test(ctx.success) && /nofollow/.test(ctx.success),
      'success.html: still noindex,nofollow (transactional, must not be indexed)');
    tallyLocal(ctx.success.includes('og:site_name') && ctx.success.includes('twitter:site'),
      'success.html: og:site_name + twitter:site');
    tallyLocal(ctx.success.includes('<link rel="manifest"'),
      'success.html: link rel=manifest');
  }

  // --- new root files: 404.html, manifest.webmanifest, llms.txt, llms-full.txt, IndexNow key ---
  const fourOhFour = readFile(path.join(ROOT, '404.html'));
  tallyLocal(fourOhFour !== null, '404.html exists at site root');
  if (fourOhFour) {
    tallyLocal(/noindex/.test(fourOhFour), '404.html: noindex meta');
    tallyLocal(fourOhFour.includes('lang="en-US"'), '404.html: lang en-US');
    tallyLocal(fourOhFour.includes('href="/en/"'), '404.html: links to /en/');
    tallyLocal(assertPublicEnSurface('404.html', fourOhFour), '404.html: public EN surface invariants');
  }

  const manifest = readFile(path.join(ROOT, 'manifest.webmanifest'));
  tallyLocal(manifest !== null, 'manifest.webmanifest exists');
  if (manifest) {
    let parsed = null;
    try { parsed = JSON.parse(manifest); } catch (_e) { parsed = null; }
    tallyLocal(parsed !== null, 'manifest.webmanifest: valid JSON');
    tallyLocal(parsed && parsed.name && parsed.start_url === '/en/',
      'manifest.webmanifest: name + start_url /en/');
    tallyLocal(parsed && parsed.theme_color === '#103B5A',
      'manifest.webmanifest: theme_color navy');
    tallyLocal(parsed && Array.isArray(parsed.icons) && parsed.icons.length > 0,
      'manifest.webmanifest: icons declared');
  }

  const llms = readFile(path.join(ROOT, 'llms.txt'));
  tallyLocal(llms !== null, 'llms.txt exists');
  if (llms) {
    tallyLocal(llms.length < 5120, 'llms.txt: under 5120 bytes (got ' + llms.length + ')');
    tallyLocal(/^# Prompt Anatomy/.test(llms), 'llms.txt: starts with H1 brand');
    tallyLocal(llms.includes('> '), 'llms.txt: blockquote summary present');
    tallyLocal(llms.includes('$5.99') && llms.includes('$11.99') && llms.includes('$15.99'),
      'llms.txt: all 3 PDF prices listed');
  }

  const llmsFull = readFile(path.join(ROOT, 'llms-full.txt'));
  tallyLocal(llmsFull !== null, 'llms-full.txt exists');
  if (llmsFull) {
    tallyLocal(llmsFull.includes('Prompt 1:') && llmsFull.includes('Prompt 10:'),
      'llms-full.txt: includes Prompt 1 and Prompt 10');
    const promptHeaderCount = (llmsFull.match(/### Prompt \d+:/g) || []).length;
    tallyLocal(promptHeaderCount === 10,
      'llms-full.txt: exactly 10 prompt headers (got ' + promptHeaderCount + ')');
  }

  const indexNowFile = readFile(path.join(ROOT, INDEXNOW_KEY_LITERAL + '.txt'));
  tallyLocal(indexNowFile !== null, 'IndexNow key file exists at /' + INDEXNOW_KEY_LITERAL + '.txt');
  if (indexNowFile) {
    tallyLocal(indexNowFile.trim() === INDEXNOW_KEY_LITERAL,
      'IndexNow key file body matches filename stem');
  }

  // --- vercel.json: CSP + Origin-Agent-Cluster + new content-type rules ---
  const vercel = readFile(path.join(ROOT, 'vercel.json'));
  if (vercel) {
    tallyLocal(vercel.includes('Content-Security-Policy-Report-Only'),
      'vercel.json: CSP Report-Only header');
    tallyLocal(vercel.includes('https://buy.stripe.com'),
      'vercel.json: CSP allows Stripe checkout frame');
    tallyLocal(vercel.includes('Origin-Agent-Cluster') && vercel.includes('"?1"'),
      'vercel.json: Origin-Agent-Cluster: ?1');
    tallyLocal(vercel.includes('llms\\\\.txt'),
      'vercel.json: llms.txt header rule');
    tallyLocal(vercel.includes('manifest\\\\.webmanifest'),
      'vercel.json: manifest.webmanifest header rule');
    tallyLocal(vercel.includes(INDEXNOW_KEY_LITERAL),
      'vercel.json: IndexNow key file header rule');
    tallyLocal(/"\/404\\\\.html"/.test(vercel),
      'vercel.json: 404.html cache header rule');
  }

  // --- SOT shape: new fields present ---
  if (ctx.sot) {
    tallyLocal(Array.isArray(ctx.sot.frontFaq) && ctx.sot.frontFaq.length === 4,
      'sot.json: frontFaq has exactly 4 items');
    tallyLocal(ctx.sot.brand && ctx.sot.brand.socialProfiles && ctx.sot.brand.socialProfiles.x,
      'sot.json: brand.socialProfiles.x');
    tallyLocal(ctx.sot.brand && ctx.sot.brand.socialProfiles && ctx.sot.brand.socialProfiles.linkedin,
      'sot.json: brand.socialProfiles.linkedin');
    tallyLocal(ctx.sot.brand && Array.isArray(ctx.sot.brand.knowsAbout) && ctx.sot.brand.knowsAbout.length >= 3,
      'sot.json: brand.knowsAbout array');
    tallyLocal(ctx.sot.product && ctx.sot.product.operatorLinkedin,
      'sot.json: product.operatorLinkedin');
    tallyLocal(ctx.sot.product && ctx.sot.product.operatorTwitter,
      'sot.json: product.operatorTwitter');
    ['beginner', 'advanced', 'bundle'].forEach((k) => {
      const g = ctx.sot.pdfGuides && ctx.sot.pdfGuides[k];
      tallyLocal(g && g.description && g.priceUSD && g.priceValidUntil,
        'sot.json: pdfGuides.' + k + '.{description, priceUSD, priceValidUntil}');
    });
  }

  return ok;
}

run();
