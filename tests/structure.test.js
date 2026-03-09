/**
 * Struktūriniai testai – index.html
 * Tikrina, kad puslapyje yra visi būtini elementai (10 promptų, a11y, nuorodos).
 * Paleisti: node tests/structure.test.js (arba npm test)
 */
'use strict';

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');
const PRIVATUMAS_PATH = path.join(__dirname, '..', 'privatumas.html');
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

  // --- 10 promptų ---
  for (let i = 1; i <= 10; i++) {
    if (assert(html.includes(`id="prompt${i}"`), `Prompt ${i} ID (prompt${i}) egzistuoja`)) passed++;
    else failed++;
  }
  for (let i = 1; i <= 10; i++) {
    if (assert(html.includes(`id="block${i}"`), `Anchor block${i} egzistuoja`)) passed++;
    else failed++;
  }

  // --- Kopijuoti mygtukai (10) ---
  const copyButtons = (html.match(/Kopijuoti promptą/g) || []).length;
  if (assert(copyButtons >= 10, `Kopijuoti promptą mygtukų: ${copyButtons} (>= 10)`)) passed++;
  else failed++;

  // --- Code-block (10) ---
  const codeBlocks = (html.match(/class="[^"]*code-block[^"]*"/g) || []).length;
  if (assert(codeBlocks >= 10, `Code-block elementų: ${codeBlocks} (>= 10)`)) passed++;
  else failed++;

  // --- Pažymėjau kaip atlikau (10 checkbox) ---
  const checkboxes = (html.match(/class="[^"]*prompt-done[^"]*"/g) || []).length;
  if (assert(checkboxes >= 10, `Prompt-done checkbox: ${checkboxes} (>= 10)`)) passed++;
  else failed++;

  // --- Prieinamumas / semantika ---
  if (assert(html.includes('href="#main-content"') && html.includes('skip-link'), 'Skip link į main-content')) passed++;
  else failed++;
  if (assert(html.includes('id="main-content"') && html.includes('<main'), 'Main region (main-content)')) passed++;
  else failed++;
  if (assert(html.includes('id="progressText"') && html.includes('id="progressBarFill"'), 'Progreso indikatorius')) passed++;
  else failed++;
  if (assert(html.includes('id="toast"') && html.includes('role="status"'), 'Toast pranešimas')) passed++;
  else failed++;
  if (assert(html.includes('privatumas.html'), 'Nuoroda į privatumas.html')) passed++;
  else failed++;

  // --- Konfigūracija ir kritinės funkcijos ---
  if (assert(html.includes('generator.js'), 'generator.js prijungtas')) passed++;
  else failed++;
  if (assert(html.includes('copyPrompt') || html.includes('selectText'), 'Kopijavimo funkcijos (generator.js)')) passed++;
  else failed++;
  const generatorJs = readFile(GENERATOR_PATH);
  if (assert(generatorJs && generatorJs.includes('localStorage') && generatorJs.includes('di_prompt_done_'), 'localStorage progresui (generator.js)')) passed++;
  else failed++;
  if (assert(html.includes('hiddenTextarea'), 'Fallback textarea kopijavimui')) passed++;
  else failed++;

  // --- Privatumas.html egzistuoja ---
  const privatumas = readFile(PRIVATUMAS_PATH);
  if (assert(privatumas !== null && privatumas.length > 0, 'privatumas.html egzistuoja')) passed++;
  else failed++;

  // --- Lang ir prieinamumas ---
  if (assert(html.includes('lang="lt"'), 'HTML lang="lt"')) passed++;
  else failed++;

  // --- LT/EN locale pages (built by npm run build) ---
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
  if (enIndex && assert(enIndex.includes('lang="en"'), 'en/index.html lang="en"')) passed++;
  else failed++;

  if (ltIndex && assert(ltIndex.includes('rel="canonical"') && ltIndex.includes('hreflang="lt"') && ltIndex.includes('hreflang="en"') && ltIndex.includes('hreflang="x-default"'), 'lt/index.html canonical ir hreflang')) passed++;
  else failed++;
  if (enIndex && assert(enIndex.includes('rel="canonical"') && enIndex.includes('hreflang="lt"') && enIndex.includes('hreflang="en"') && enIndex.includes('hreflang="x-default"'), 'en/index.html canonical ir hreflang')) passed++;
  else failed++;

  if (enIndex) {
    for (let i = 1; i <= 10; i++) {
      if (assert(enIndex.includes('id="prompt' + i + '"') && enIndex.includes('id="block' + i + '"'), 'en/index.html prompt ' + i)) passed++;
      else failed++;
    }
  }
  if (enIndex && assert(enIndex.includes('Skip to content') && (enIndex.includes('Copy prompt') || enIndex.includes('Copy')), 'en/index.html EN stringai')) passed++;
  else failed++;

  console.log('\n---');
  console.log(`Rezultatas: ${passed} praeina, ${failed} nepraeina.`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('Visi struktūriniai testai praeina.\n');
}

run();
