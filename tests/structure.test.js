/**
 * Struktūriniai testai – šaknies vartai (index.html), LT šablonas (templates/), build lt/en.
 * Paleisti: node tests/structure.test.js (arba npm test; build vyksta prieš testą)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const PRIVATUMAS_PATH = path.join(__dirname, '..', 'privatumas.html');
const LT_INDEX_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'index-lt.html');
const LT_PRIVACY_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'privatumas-lt.html');
const GENERATOR_PATH = path.join(__dirname, '..', 'generator.js');

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    return false;
  }
  console.log(`✅ ${message}`);
  return true;
}

function run() {
  let passed = 0;
  let failed = 0;

  const html = readFile(INDEX_PATH);
  if (!html) {
    console.error('❌ index.html nerastas:', INDEX_PATH);
    process.exit(1);
  }

  const ltTemplate = readFile(LT_INDEX_TEMPLATE_PATH);
  if (!ltTemplate) {
    console.error('❌ templates/index-lt.html nerastas:', LT_INDEX_TEMPLATE_PATH);
    process.exit(1);
  }

  const ltPrivacyTemplate = readFile(LT_PRIVACY_TEMPLATE_PATH);
  if (!ltPrivacyTemplate) {
    console.error('❌ templates/privatumas-lt.html nerastas:', LT_PRIVACY_TEMPLATE_PATH);
    process.exit(1);
  }

  // --- Šaknies vartai (EN numatytasis) ---
  if (assert(html.includes('lang="en-US"'), 'šaknies index.html lang="en-US" (vartai)')) passed++;
  else failed++;
  if (assert(html.includes('href="en/"') && !html.includes('<a href="lt/'), 'vartai: tik EN nuoroda body (be lt/)')) passed++;
  else failed++;
  if (assert(html.includes('rel="canonical"') && html.includes('/en/">'), 'šaknies canonical į /en/')) passed++;
  else failed++;
  if (assert(html.includes('http-equiv="refresh"') && html.includes('/en/'), 'šaknies meta refresh į EN')) passed++;
  else failed++;
  if (assert(html.includes('privatumas.html'), 'vartai: nuoroda į privatumas.html')) passed++;
  else failed++;

  // --- 10 promptų (LT šablonas) ---
  for (let i = 1; i <= 10; i++) {
    if (assert(ltTemplate.includes(`id="prompt${i}"`), `templates/index-lt.html: prompt ${i} ID (prompt${i})`)) passed++;
    else failed++;
  }
  for (let i = 1; i <= 10; i++) {
    if (assert(ltTemplate.includes(`id="block${i}"`), `templates/index-lt.html: anchor block${i}`)) passed++;
    else failed++;
  }

  // --- Kopijuoti mygtukai (10) ---
  const copyButtons = (ltTemplate.match(/Kopijuoti promptą/g) || []).length;
  if (assert(copyButtons >= 10, `templates/index-lt.html: Kopijuoti promptą mygtukų: ${copyButtons} (>= 10)`)) passed++;
  else failed++;

  // --- Code-block (10) ---
  const codeBlocks = (ltTemplate.match(/class="[^"]*code-block[^"]*"/g) || []).length;
  if (assert(codeBlocks >= 10, `templates/index-lt.html: code-block elementų: ${codeBlocks} (>= 10)`)) passed++;
  else failed++;

  // --- Pažymėjau kaip atlikau (10 checkbox) ---
  const checkboxes = (ltTemplate.match(/class="[^"]*prompt-done[^"]*"/g) || []).length;
  if (assert(checkboxes >= 10, `templates/index-lt.html: prompt-done checkbox: ${checkboxes} (>= 10)`)) passed++;
  else failed++;

  // --- Prieinamumas / semantika (LT šablonas) ---
  if (assert(ltTemplate.includes('href="#main-content"') && ltTemplate.includes('skip-link'), 'templates/index-lt.html: skip link')) passed++;
  else failed++;
  if (assert(ltTemplate.includes('id="main-content"') && ltTemplate.includes('<main'), 'templates/index-lt.html: main region')) passed++;
  else failed++;
  if (assert(ltTemplate.includes('id="progressText"') && ltTemplate.includes('id="progressBarFill"'), 'templates/index-lt.html: progreso indikatorius')) passed++;
  else failed++;
  if (assert(ltTemplate.includes('id="toast"') && ltTemplate.includes('role="status"'), 'templates/index-lt.html: toast')) passed++;
  else failed++;
  if (assert(ltTemplate.includes('t.me/prompt_anatomy'), 'templates/index-lt.html: Telegram')) passed++;
  else failed++;

  // --- Konfigūracija ir kritinės funkcijos (LT šablonas) ---
  if (assert(ltTemplate.includes('generator.js'), 'templates/index-lt.html: generator.js')) passed++;
  else failed++;
  if (assert(ltTemplate.includes('copyPrompt') || ltTemplate.includes('selectText'), 'Kopijavimo funkcijos (generator.js)')) passed++;
  else failed++;
  const generatorJs = readFile(GENERATOR_PATH);
  if (assert(generatorJs && generatorJs.includes('localStorage') && generatorJs.includes('di_prompt_done_'), 'localStorage progresui (generator.js)')) passed++;
  else failed++;
  if (assert(ltTemplate.includes('hiddenTextarea'), 'templates/index-lt.html: hiddenTextarea')) passed++;
  else failed++;

  // --- Privatumas vartai ir šablonas ---
  const privatumas = readFile(PRIVATUMAS_PATH);
  if (assert(privatumas !== null && privatumas.length > 0, 'privatumas.html egzistuoja')) passed++;
  else failed++;
  if (assert(privatumas.includes('lang="en-US"'), 'šaknies privatumas.html lang="en-US"')) passed++;
  else failed++;
  if (
    assert(
      privatumas.includes('en/privatumas.html') && !privatumas.includes('<a href="lt/privatumas.html">'),
      'privatumas vartai: tik EN nuoroda body'
    )
  )
    passed++;
  else failed++;

  // --- Lang LT šablonas ---
  if (assert(ltTemplate.includes('lang="lt"'), 'templates/index-lt.html lang="lt"')) passed++;
  else failed++;
  if (assert(ltPrivacyTemplate.includes('lang="lt"'), 'templates/privatumas-lt.html lang="lt"')) passed++;
  else failed++;

  // --- LT/en-US locale pages (built by npm run build) ---
  const ltIndexPath = path.join(__dirname, '..', 'lt', 'index.html');
  const enIndexPath = path.join(__dirname, '..', 'en', 'index.html');
  const ltPrivacyPath = path.join(__dirname, '..', 'lt', 'privatumas.html');
  const enPrivacyPath = path.join(__dirname, '..', 'en', 'privatumas.html');

  const ltIndex = readFile(ltIndexPath);
  const enIndex = readFile(enIndexPath);
  if (assert(ltIndex !== null && ltIndex.length > 0, 'lt/index.html egzistuoja')) passed++;
  else failed++;
  if (assert(enIndex !== null && enIndex.length > 0, 'en/index.html egzistuoja')) passed++;
  else failed++;
  if (assert(readFile(ltPrivacyPath) !== null, 'lt/privatumas.html egzistuoja')) passed++;
  else failed++;
  if (assert(readFile(enPrivacyPath) !== null, 'en/privatumas.html egzistuoja')) passed++;
  else failed++;

  if (ltIndex && assert(ltIndex.includes('lang="lt"'), 'lt/index.html lang="lt"')) passed++;
  else failed++;
  if (ltIndex && assert(!ltIndex.includes('Common questions before you start'), 'lt/index.html: DUK lietuvių kalba (nėra angliškos FAQ antraštės)')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('lang="en-US"'), 'en/index.html lang="en-US"')) passed++;
  else failed++;
  if (enIndex && assert(!enIndex.includes('id="langLtBtn"') && !enIndex.includes('class="lang-switcher"'), 'en/index.html be kalbos perjungiklio')) passed++;
  else failed++;
  if (ltIndex && assert(ltIndex.includes('id="langEnBtn"'), 'lt/index.html: EN perjungimas')) passed++;
  else failed++;

  if (ltIndex && assert(ltIndex.includes('rel="canonical"') && ltIndex.includes('hreflang="lt"') && ltIndex.includes('hreflang="en-US"') && ltIndex.includes('hreflang="x-default"'), 'lt/index.html canonical ir hreflang')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('rel="canonical"') && enIndex.includes('hreflang="lt"') && enIndex.includes('hreflang="en-US"') && enIndex.includes('hreflang="x-default"'), 'en/index.html canonical ir hreflang')) passed++;
  else failed++;

  const canonicalHttps = /<link rel="canonical" href="https:/;
  if (ltIndex && assert(canonicalHttps.test(ltIndex), 'lt/index.html canonical naudoja absoliutų HTTPS URL')) passed++;
  else failed++;
  if (enIndex && assert(canonicalHttps.test(enIndex), 'en/index.html canonical naudoja absoliutų HTTPS URL')) passed++;
  else failed++;
  if (ltIndex && assert(ltIndex.includes('og:image" content="https://'), 'lt/index.html OG image absoliutus HTTPS')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('og:image" content="https://'), 'en/index.html OG image absoliutus HTTPS')) passed++;
  else failed++;
  if (ltIndex && assert(ltIndex.includes('<meta name="description"'), 'lt/index.html meta description')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('<meta name="description"'), 'en/index.html meta description')) passed++;
  else failed++;
  if (ltIndex && assert(ltIndex.includes('application/ld+json'), 'lt/index.html JSON-LD')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('application/ld+json'), 'en/index.html JSON-LD')) passed++;
  else failed++;

  const ltPrivacy = readFile(ltPrivacyPath);
  const enPrivacy = readFile(enPrivacyPath);
  if (ltPrivacy && assert(canonicalHttps.test(ltPrivacy), 'lt/privatumas.html canonical HTTPS')) passed++;
  else failed++;
  if (enPrivacy && assert(canonicalHttps.test(enPrivacy), 'en/privatumas.html canonical HTTPS')) passed++;
  else failed++;
  if (ltPrivacy && assert(ltPrivacy.includes('property="og:image"'), 'lt/privatumas.html OG image')) passed++;
  else failed++;
  if (enPrivacy && assert(enPrivacy.includes('property="og:image"'), 'en/privatumas.html OG image')) passed++;
  else failed++;

  const robotsPath = path.join(__dirname, '..', 'robots.txt');
  const sitemapPath = path.join(__dirname, '..', 'sitemap.xml');
  const robots = readFile(robotsPath);
  const sitemap = readFile(sitemapPath);
  if (assert(robots !== null && robots.includes('Sitemap: https://'), 'robots.txt su absoliučiu Sitemap URL')) passed++;
  else failed++;
  if (assert(sitemap !== null && sitemap.includes('<urlset') && sitemap.includes('<loc>https://'), 'sitemap.xml su absoliučiais loc')) passed++;
  else failed++;

  if (enIndex) {
    for (let i = 1; i <= 10; i++) {
      if (assert(enIndex.includes('id="prompt' + i + '"') && enIndex.includes('id="block' + i + '"'), 'en/index.html prompt ' + i)) passed++;
      else failed++;
    }
  }
  if (enIndex && assert(enIndex.includes('Skip to content') && (enIndex.includes('Copy prompt') || enIndex.includes('Copy')), 'en/index.html EN stringai')) passed++;
  else failed++;

  if (enIndex && assert(enIndex.includes('New York, NY') || enIndex.includes('San Francisco, CA'), 'en/index.html includes a US city/state example')) passed++;
  else failed++;
  if (enIndex && assert(['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chicago, IL', 'Seattle, WA'].filter((city) => enIndex.includes(city)).length >= 4, 'en/index.html includes multiple US city/state examples')) passed++;
  else failed++;
  const roleLocationCount = enIndex ? (enIndex.match(/Role location:/g) || []).length : 0;
  if (enIndex && assert(roleLocationCount >= 10, 'en/index.html includes role-location placeholders for all prompts')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('Remote – US') && enIndex.includes('Hybrid – New York, NY') && enIndex.includes('On-site – Austin, TX'), 'en/index.html includes remote, hybrid, and on-site US location examples')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('City, State, optional Zip Code') && enIndex.includes('San Francisco, CA 94105') && enIndex.includes('Seattle, WA 98101'), 'en/index.html includes US location format with optional Zip Code examples')) passed++;
  else failed++;
  if (enIndex && assert(/\$\d{1,3}(,\d{3})*(\.\d{2})?/.test(enIndex), 'en/index.html includes US dollar formatting')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('MM/DD/YYYY'), 'en/index.html includes US date format guidance')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('+1 (415) 555-0198'), 'en/index.html includes US phone format guidance')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('Zip Code'), 'en/index.html includes US address terminology')) passed++;
  else failed++;
  if (
    enIndex &&
      assert(
        enIndex.includes('Address fields:') &&
          enIndex.includes('<code>Street Address</code>') &&
          enIndex.includes('<code>City</code>') &&
          enIndex.includes('<code>State</code>') &&
          enIndex.includes('<code>Zip Code</code>'),
        'en/index.html includes explicit US address field order'
      )
  )
    passed++;
  else failed++;
  if (
    enIndex &&
      assert(
        enIndex.includes('Phone format:') &&
          enIndex.includes('<code>+1 (XXX) XXX-XXXX</code>') &&
          enIndex.includes('Contact phone: [optional, e.g., +1 (415) 555-0198]'),
        'en/index.html includes canonical US phone format and prompt placeholder'
      )
  )
    passed++;
  else failed++;
  const streetAddressCount = enIndex ? (enIndex.match(/Street Address: \[optional, e\.g\., 123 Market St\]/g) || []).length : 0;
  if (enIndex && assert(streetAddressCount >= 10, 'en/index.html includes Street Address placeholders for all prompts')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('State: [two-letter State, e.g., NY]') && enIndex.includes('Zip Code: [optional, e.g., 10001]'), 'en/index.html includes two-letter State and Zip Code placeholders')) passed++;
  else failed++;
  if (enIndex && assert(!/(€|\bEUR\b|Postcode|postcode|Colour|colour|organisation|optimise|centre|grey|Analyse|analyse|Spin-off Nr\.)/.test(enIndex), 'en/index.html has no obvious non-US locale fragments')) passed++;
  else failed++;
  if (enIndex && assert(!/[ąčęėįšųūžĄČĘĖĮŠŲŪŽ]/.test(enIndex), 'en/index.html has no Lithuanian diacritics')) passed++;
  else failed++;


  console.log('\n---');
  console.log(`Rezultatas: ${passed} praeina, ${failed} nepraeina.`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('Visi struktūriniai testai praeina.\n');
}

run();
