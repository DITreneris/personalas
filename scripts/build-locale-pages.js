/**
 * Build LT/en-US locale pages from root index.html and privatumas.html.
 * Usage (GitHub Pages subpath): BASE_PATH=/personalas/ SITE_ORIGIN=https://ditreneris.github.io node scripts/build-locale-pages.js
 * Usage (Vercel / custom domain root): SITE_ORIGIN=https://promptanatomy.help node scripts/build-locale-pages.js
 * Optional override: SITE_PUBLIC_BASE=https://preview.vercel.app (full public origin, no trailing slash)
 * Output: lt/index.html, lt/privatumas.html, en/index.html, en/privatumas.html, robots.txt, sitemap.xml
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

function buildJsonLdWebsiteGraph(locale) {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const inLang = locale === 'lt' ? 'lt' : 'en-US';
  const graph = [
    {
      '@type': 'WebSite',
      name: locale === 'lt' ? 'Personalas – HR DI promptų rinkinys' : 'Personalas – US hiring prompts',
      url: base + '/',
      inLanguage: [inLang],
    },
    {
      '@type': 'Organization',
      name: locale === 'lt' ? 'Promptų anatomija' : 'Prompt Anatomy',
      url: base + '/',
      sameAs: ['https://t.me/prompt_anatomy'],
    },
  ];
  return (
    '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
    '</script>'
  );
}

function buildJsonLdWebPage(locale, pageUrl, name, description) {
  const graph = [
    {
      '@type': 'WebPage',
      name: name,
      description: description,
      url: pageUrl,
      inLanguage: locale === 'lt' ? 'lt' : 'en-US',
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
function injectHead(html, locale, basePath) {
  const abs = absoluteBaseSlash();
  const canonicalUrl = abs + locale + '/';
  const linkCanonical = '<link rel="canonical" href="' + escapeHtmlAttr(canonicalUrl) + '">';
  const linkLt = '<link rel="alternate" hreflang="lt" href="' + escapeHtmlAttr(abs + 'lt/') + '">';
  const linkEn = '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(abs + 'en/') + '">';
  const linkDefault = '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(abs + 'en/') + '">';
  const title = extractTitle(html);
  const description = extractMetaDescription(html);
  const ogImage = abs + 'images/og-default.png';
  const ogLocale = locale === 'lt' ? 'lt_LT' : 'en_US';
  const ogLocaleAlt = locale === 'lt' ? 'en_US' : 'lt_LT';

  const socialBlock = [
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<meta property="og:locale" content="' + ogLocale + '">',
    '<meta property="og:locale:alternate" content="' + ogLocaleAlt + '">',
    '<meta property="og:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta name="twitter:image" content="' + escapeHtmlAttr(ogImage) + '">',
  ].join('\n    ');

  const jsonLd = buildJsonLdWebsiteGraph(locale);
  const seoBlock =
    '\n    ' +
    [linkCanonical, linkLt, linkEn, linkDefault, socialBlock, jsonLd].join('\n    ') +
    '\n';
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(<meta name="description")/i, '$1' + seoBlock + '$2');

  const basePathScript = basePath
    ? '<script>window.BASE_PATH = \'' + basePath.replace(/'/g, "\\'") + '\';</script>\n    '
    : '';
  html = html.replace(/<script src="generator\.js"><\/script>/, basePathScript + '<script src="../generator.js"></script>');
  return html;
}

function injectPrivacyHead(html, locale, pathSuffix, title, description) {
  const abs = absoluteBaseSlash();
  const canonicalUrl = abs + pathSuffix;
  const ogImage = abs + 'images/og-default.png';
  const ogLocale = locale === 'lt' ? 'lt_LT' : 'en_US';
  const ogLocaleAlt = locale === 'lt' ? 'en_US' : 'lt_LT';
  const block = [
    '<link rel="canonical" href="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<link rel="alternate" hreflang="lt" href="' + escapeHtmlAttr(abs + 'lt/privatumas.html') + '">',
    '<link rel="alternate" hreflang="en-US" href="' + escapeHtmlAttr(abs + 'en/privatumas.html') + '">',
    '<link rel="alternate" hreflang="x-default" href="' + escapeHtmlAttr(abs + 'en/privatumas.html') + '">',
    '<meta name="description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta property="og:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta property="og:url" content="' + escapeHtmlAttr(canonicalUrl) + '">',
    '<meta property="og:locale" content="' + ogLocale + '">',
    '<meta property="og:locale:alternate" content="' + ogLocaleAlt + '">',
    '<meta property="og:image" content="' + escapeHtmlAttr(ogImage) + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHtmlAttr(title) + '">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(description) + '">',
    '<meta name="twitter:image" content="' + escapeHtmlAttr(ogImage) + '">',
    buildJsonLdWebPage(locale, canonicalUrl, title, description),
  ].join('\n    ');
  return html.replace(/(<meta name="viewport"[^>]*>\s*)(<title)/i, '$1' + block + '\n    $2');
}

function writeRobotsAndSitemap() {
  const abs = absoluteBaseSlash().replace(/\/+$/, '');
  const sitemapUrl = abs + '/sitemap.xml';
  const robots = 'User-agent: *\nAllow: /\n\nSitemap: ' + sitemapUrl + '\n';
  write('robots.txt', robots);

  const urls = [
    abs + '/',
    abs + '/lt/',
    abs + '/en/',
    abs + '/privatumas.html',
    abs + '/lt/privatumas.html',
    abs + '/en/privatumas.html',
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

function buildRootSeoFragment() {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const img = base + '/images/og-default.png';
  const desc =
    'Dešimt DI promptų HR atrankai: diagnostika, profilis, skelbimas, šaltiniai, pokalbiai, pasiūlymas. Kopijuok į ChatGPT arba Claude – praktinė sistema per ~30 min.';
  const lines = [
    '<link rel="canonical" href="' + base + '/">',
    '<link rel="alternate" hreflang="lt" href="' + base + '/lt/">',
    '<link rel="alternate" hreflang="en-US" href="' + base + '/en/">',
    '<link rel="alternate" hreflang="x-default" href="' + base + '/en/">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="HR kasdienė atrankos sistema – DI promptai">',
    '<meta property="og:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:url" content="' + base + '/">',
    '<meta property="og:locale" content="lt_LT">',
    '<meta property="og:locale:alternate" content="en_US">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="HR kasdienė atrankos sistema – DI promptai">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<script type="application/ld+json">' +
      JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            name: 'Personalas – HR DI promptų rinkinys',
            url: base + '/',
            inLanguage: ['lt'],
          },
          {
            '@type': 'Organization',
            name: 'Promptų anatomija',
            url: base + '/',
            sameAs: ['https://t.me/prompt_anatomy'],
          },
        ],
      }).replace(/</g, '\\u003c') +
      '</script>',
  ];
  return lines.join('\n    ') + '\n    ';
}

/** Idempotent: strip any prior head SEO between viewport and meta description, then inject root SEO. */
function finalizeRootIndexHtml() {
  let html = read('index.html');
  html = html.replace(
    /(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<meta name="description")/i,
    '$1$2'
  );
  const frag = buildRootSeoFragment();
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
  write('index.html', html);
}

function buildRootPrivacyFragment() {
  const base = absoluteBaseSlash().replace(/\/+$/, '');
  const img = base + '/images/og-default.png';
  const desc =
    'Personalas – statinė svetainė su HR DI promptų rinkiniu. Asmens duomenų nerinkame; pažymėti žingsniai saugomi tik naršyklės localStorage.';
  const lines = [
    '<link rel="canonical" href="' + base + '/privatumas.html">',
    '<link rel="alternate" hreflang="lt" href="' + base + '/lt/privatumas.html">',
    '<link rel="alternate" hreflang="en-US" href="' + base + '/en/privatumas.html">',
    '<link rel="alternate" hreflang="x-default" href="' + base + '/en/privatumas.html">',
    '<meta name="description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="Privatumo politika – Personalas">',
    '<meta property="og:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta property="og:url" content="' + base + '/privatumas.html">',
    '<meta property="og:locale" content="lt_LT">',
    '<meta property="og:locale:alternate" content="en_US">',
    '<meta property="og:image" content="' + img + '">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:type" content="image/png">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="Privatumo politika – Personalas">',
    '<meta name="twitter:description" content="' + escapeHtmlAttr(desc) + '">',
    '<meta name="twitter:image" content="' + img + '">',
    '<script type="application/ld+json">' +
      JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            name: 'Privatumo politika – Personalas',
            description: desc,
            url: base + '/privatumas.html',
            inLanguage: 'lt',
            isPartOf: { '@type': 'WebSite', url: base + '/' },
          },
        ],
      }).replace(/</g, '\\u003c') +
      '</script>',
  ];
  return lines.join('\n    ') + '\n    ';
}

function finalizeRootPrivacyHtml() {
  let html = read('privatumas.html');
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(?:[\s\S]*?)(<title)/i, '$1$2');
  const frag = buildRootPrivacyFragment();
  html = html.replace(/(<meta name="viewport"[^>]*>\s*)(<title)/i, '$1' + frag + '$2');
  write('privatumas.html', html);
}

// ---- EN replacement pairs (order: more specific first) ----
const EN_REPLACEMENTS = [
  ['<html lang="lt">', '<html lang="en-US">'],
  ['<title>HR kasdienė atrankos sistema – DI promptai</title>', '<title>HR hiring system – AI prompts for US teams</title>'],
  [
    '<meta name="description" content="Dešimt DI promptų HR atrankai: diagnostika, profilis, skelbimas, šaltiniai, pokalbiai, pasiūlymas. Kopijuok į ChatGPT arba Claude – praktinė sistema per ~30 min.">',
    '<meta name="description" content="Ten ready-to-use AI prompts for US hiring: diagnostics, role definition, job posts, sourcing, interviews, offers, and onboarding. Copy into ChatGPT or Claude—about 30 minutes end-to-end.">',
  ],
  ['Pereiti prie turinio', 'Skip to content'],
  ['Kalbos pasirinkimas', 'Language selection'],
  ['Perjungti į lietuvių kalbą', 'Switch to Lithuanian'],
  ['Perjungti į anglų kalbą', 'Switch to English'],
  ['Pilna Promptų anatomija – interaktyvus mokymas (atidaroma naujame lange)', 'Full Prompt Anatomy – interactive training (opens in a new tab)'],
  ['HR kasdienė atrankos sistema, Spin-off Nr. 3', 'HR hiring system for US teams, Series No. 3'],
  ['DI atrankos sistema<br>Personalo vadovui', 'AI hiring system<br>For US HR teams'],
  [
    'Pagalbinė versija iš Promptų anatomijos ekosistemos — veikianti atrankos struktūra per ~30 min.',
    'A Prompt Anatomy ecosystem helper—a practical hiring workflow in about 30 minutes.',
  ],
  ['6 sistemos fazės', '6 system phases'],
  ['1. Diagnostika', '1. Diagnose'],
  ['2. Profilis', '2. Define the Role'],
  ['3. Pritraukimas', '3. Source Candidates'],
  ['4. Atranka', '4. Screen & Interview'],
  ['5. Pasiūlymas', '5. Close the Offer'],
  ['6. Išlaikymas', '6. Onboard & Retain'],
  ['Peržiūrėti sistemą – progresas ir fazės', 'View system – progress and phases'],
  ['Peržiūrėti sistemą', 'View system'],
  ['Ką ši sistema padeda išspręsti', 'What this hiring system helps solve'],
  ['Ji skirta tam, kad nustotumėte švaistyti laiką „tuščioms“ paieškoms!', 'Stop wasting time on low-quality candidate searches.'],
  ['Nulinis srautas?', 'Zero pipeline?'],
  ['Sugeneruokite pritraukiančius skelbimus ir paieškos žinutes.', 'Generate clear job posts and outreach messages.'],
  ['Netinkami žmonės?', 'Wrong people?'],
  ['Tiksliai apibrėžkite profilį ir atsirinkite geriausius.', 'Define the role precisely and screen for the strongest fit.'],
  ['Lėtas tempas?', 'Slow pace?'],
  ['Identifikuokite „butelio kakliuką“ per 5 minutes.', 'Identify the bottleneck in 5 minutes.'],
  ['Prarandami talentai?', 'Losing talent?'],
  ['Pateikite pasiūlymą, kurio neįmanoma atsisakyti.', 'Present a clear offer candidates can evaluate quickly.'],
  ['Kaip naudoti US atrankos promptų sistemą', 'How to use the US hiring prompt system'],
  ['aria-label="4 žingsniai, apie 3–5 min vienam žingsniui"', 'aria-label="4 steps, about 3–5 minutes per step"'],
  ['4 žingsniai · 3–5 min / žingsnis', '4 steps · 3–5 min / step'],
  ['Pasirinkite fazę, atidarykite ją, tada pasirinkite konkretų promptą.', 'Choose a phase, open it, then pick a specific prompt.'],
  ['Spustelėkite <strong>„Kopijuoti promptą“</strong> arba naudokite <code>Ctrl+C</code> / <code>Cmd+C</code> ant pasirinkto prompto.', 'Click <strong>“Copy prompt”</strong> or <code>Ctrl+C</code> / <code>Cmd+C</code> on the selected prompt.'],
  ['Įklijuokite į ChatGPT, Claude, Gemini ar kitą DI (dirbtinio intelekto) įrankį.', 'Paste into ChatGPT, Claude, Gemini, or another AI tool.'],
  [
    '<li class="instructions-li-stack"><span class="instructions-li-lead">Jei prompte yra laužtinių laukų, įrašykite savo duomenis.</span><div class="instructions-subcard" role="region" aria-label="Vietininkų pavyzdžiai ir DI vaidmuo"><p class="instructions-subrow"><strong>Pavyzdžiai:</strong> <code>[įmonė]</code>, <code>[pozicija]</code>, <code>[atlygis]</code>, <code>[ ]</code> ir kiti.</p><p class="instructions-subrow"><strong>Pastaba:</strong> DI vaidmens („Tu esi…“) keisti nereikia.</p></div></li>',
    '<li class="instructions-li-stack"><span class="instructions-li-lead">Replace bracket placeholders with your data before you send the prompt.</span><div class="instructions-subcard" role="region" aria-label="Placeholders and US format examples"><p class="instructions-subrow"><strong>Placeholders:</strong> <code>[company]</code>, <code>[role]</code>, <code>[location]</code>, <code>[salary range]</code></p><p class="instructions-subrow"><strong>Locations:</strong> <code>New York, NY</code>, <code>San Francisco, CA 94105</code>, <code>Remote – US</code>, <code>Hybrid – Austin, TX</code></p><p class="instructions-subrow"><strong>Dates:</strong> <code>MM/DD/YYYY</code>. <strong>Address fields:</strong> <code>Street Address</code>, <code>City</code>, <code>State</code>, <code>Zip Code</code>.</p><p class="instructions-subrow"><strong>Phone format:</strong> <code>+1 (XXX) XXX-XXXX</code>, for example <code>+1 (415) 555-0198</code>.</p></div></li>',
  ],
  ['<section class="faq" lang="lt" aria-labelledby="faq-title">', '<section class="faq" lang="en" aria-labelledby="faq-title">'],
  ['Dažni klausimai prieš pradedant', 'Common questions before you start'],
  ['Trumpi atsakymai prieš kopijuojant pirmąjį promptą.', 'Short notes before you copy the first prompt.'],
  ['Ar būtina eiti visas 6 fazes iš eilės?', 'Do I have to go through all 6 phases in order?'],
  ['Ne, bet seka atspindi visą atrankos ciklą nuo diagnostikos iki išlaikymo. Paprastai geriausia pradėti nuo 1 fazės ir judėti pagal savo situaciją.', 'No, but the sequence reflects the full recruitment cycle from diagnosis to retention. It is usually best to start at phase 1 and move according to your situation.'],
  ['Ar reikia keisti eilutę „Tu esi…“ prompto pradžioje?', 'Do I need to change the &quot;You are…&quot; line at the start of the prompt?'],
  ['Ne. Keiskite tik laužtiniuose skliaustuose esančius vietininkus ir skaičius – DI vaidmuo jau suformuluotas aiškiam rezultatui.', 'No. Only change bracket placeholders and numbers – the AI role is already phrased to give a clear result.'],
  ['Ar tai klausimynas ar kandidatų valdymo sistema (ATS)?', 'Is this a survey or an applicant tracking system (ATS)?'],
  ['Ne. Tai tekstai, kuriuos kopijuojate ir įklijuojate į savo DI įrankį – joks serveris neatlieka atrankos už jus.', 'No. These are texts you copy and paste into your AI tool – no server runs recruitment for you.'],
  ['Kiek laiko užtrunka vienas žingsnis?', 'How long does one step take?'],
  ['Maždaug 3–5 minutes pasiruošti ir nukopijuoti; pats pokalbis su DI priklauso nuo jūsų klausimų ir atsakymų.', 'About 3–5 minutes to prepare and copy; the actual AI chat depends on your questions and answers.'],
  ['Ar tinka mažai įmonei ar vienam HR specialistui?', 'Does it work for a small company or a solo HR person?'],
  ['Taip. Promptai universūs – svarbu užpildyti vietininkus savo kontekstu, o ne bendrinėmis frazėmis.', 'Yes. The prompts are universal – what matters is filling placeholders with your context, not generic phrases.'],
  ['Ar galiu naudoti tik vieną ar kelis promptus?', 'Can I use just one or a few prompts?'],
  ['Taip. Galite pradėti nuo vienos problemos (pvz., skelbimo ar pokalbio) ir vėliau grįžti prie kitų.', 'Yes. You can start with one problem (e.g. job ad or interview) and return to others later.'],
  ['Geriausia eiti iš eilės nuo 1 iki 10. Paspaudus nuorodą pereisite prie atitinkamo prompto.', 'Best to go in order from 1 to 10. Click a link to jump to that prompt.'],
  ['Kas toliau?', 'What’s next?'],
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
  ['Sistema: 0 iš 6 fazių', 'System: 0 of 6 phases'],
  ['Progresas: 0 iš 6 fazių', 'Progress: 0 of 6 phases'],
  ['Pasirinkti ir kopijuoti promptą ', 'Select and copy prompt '],
  [' į mainų atmintinę', ' to clipboard'],
  ['Informacija: promptas ', 'Information: prompt '],
  ['Pažymėti, kad atlikai šį žingsnį', 'Mark as done'],
  ['Pažymėjau kaip atlikau', 'Marked as done'],
  ['Kopijuoti promptą', 'Copy prompt'],
  ['Kopijuoti', 'Copy'],
  ['Naudok kai:', 'Use when:'],
  ['Pakeisk prieš naudodamas:', 'Replace before using:'],
  ['Nukopijuota.', 'Copied.'],
  ['Kopijavimo pranešimas', 'Copy notification'],
  ['Kopijuojamo teksto laukas', 'Field for text to copy'],
  ['Sistema sukurta.<br>Nori daugiau?', 'System created.<br>Want more?'],
  ['Atidaryti „Promptų anatomijos“ Telegram kanalą naujame lange', 'Open Prompt Anatomy on Telegram in a new tab'],
  ['Sekite Telegram kanale', 'Join on Telegram'],
  ['Promptų anatomija →', 'Prompt anatomy →'],
  ['Promptų anatomija', 'Prompt anatomy'],
  ['">Prompt anatomy</a>', '">Prompt Anatomy</a>'],
  ['Prompt anatomy →', 'Prompt Anatomy →'],
  ['Prompt anatomy:', 'Prompt Anatomy:'],
  ['Sėkmės atrankoje', 'Good luck with hiring'],
  ['Nepamiršk pakeisti <strong>[įmonė]</strong>, <strong>[pozicija]</strong>, <strong>[atlygis]</strong>, <strong>[kandidatų skaičius]</strong> ir kitus laukus savo duomenimis.', 'Remember to replace <strong>[company]</strong>, <strong>[role]</strong>, <strong>[location]</strong>, <strong>[salary range]</strong>, <strong>[candidate count]</strong>, and other placeholders with your data. Use US examples such as <strong>123 Market St, San Francisco, CA 94105</strong>, <strong>Remote – US</strong>, <strong>+1 (415) 555-0198</strong>, and <strong>$1,250.50</strong> where applicable.'],
  ['Tai Spin-off Nr. 3 iš „Promptų anatomijos“.', 'This is Series No. 3 from “Prompt Anatomy”.'],
  ['Promptų anatomija:', 'Prompt anatomy:'],
  ['El. paštas:', 'Email:'],
  ['HR atranka', 'US hiring'],
  ['10 promptų', '10 prompts'],
  ['Veiksmų fokusas', 'Action focus'],
  ['Kasdienės atrankos problemos', 'Everyday hiring problems'],
  ['Mokymų medžiaga. Visos teisės saugomos.', 'Training material. All rights reserved.'],
  ['Privatumas', 'Privacy'],
  ['FAZĖ ', 'PHASE '],
  ['Sistema: X iš 6 fazių', 'System: X of 6 phases'],
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
  html = html.replace(/Spin-off Nr\. 3/g, 'Series No. 3');
  html = html.replace(/Spin-off No\. 3/g, 'Series No. 3');
  html = html.replace(/analyse/g, 'analyze');
  html = html.replace(/Analyse/g, 'Analyze');
  html = html.replace(/\/\*[\s\S]*?\*\//g, '');
  html = html.replace(/<!--[\s\S]*?-->/g, '');
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

// ---- Privacy EN ----
const PRIVACY_EN = {
  title: 'Privacy Policy – Personalas',
  back: '← Back to Personalas',
  backLink: '← Back to Personalas',
  intro:
    '<strong>Personalas</strong> – US hiring prompts for HR teams (Series No. 3 from Prompt Anatomy). Minimal static app; English UI is <code>en-US</code>. Briefly about your data.',
  q1: 'Do we collect your data?',
  a1: '<strong>No.</strong> We do not collect any personal data at this time. No forms, email collection or server submission.',
  q2: 'What happens on your device?',
  a2: 'Only the browser <strong>localStorage</strong> (browser local storage): we save which prompts you marked as “Marked as done”. Data stays only on your device.',
  q3: 'If we add a form later',
  a3: 'If we enable a contact form or similar, this policy will be updated – we will clearly state what we collect and how we use it.'
};

function buildPrivacyEn(html) {
  return html
    .replace('<html lang="lt">', '<html lang="en-US">')
    .replace(/<title>.*?<\/title>/, '<title>' + PRIVACY_EN.title + '</title>')
    .replace('href="favicon.svg"', 'href="../favicon.svg"')
    .replace(
      '<a href="index.html" class="back">← Grįžti į Personalą</a>',
      '<a href="index.html" class="back">' + PRIVACY_EN.back + '</a>'
    )
    .replace('Privatumo politika', 'Privacy Policy')
    .replace(/<p><strong>Personalas<\/strong>[^]*?<\/p>/, '<p>' + PRIVACY_EN.intro + '</p>')
    .replace('Ar renkame tavo duomenis?', PRIVACY_EN.q1)
    .replace(/<p><strong>Ne\.<\/strong>.*?serverius\.<\/p>/, '<p>' + PRIVACY_EN.a1 + '</p>')
    .replace('Kas vyksta tavo įrenginyje?', PRIVACY_EN.q2)
    .replace(/<p>Tik naršyklės.*?įrenginyje\.<\/p>/, '<p>' + PRIVACY_EN.a2 + '</p>')
    .replace('Jei vėliau bus forma', PRIVACY_EN.q3)
    .replace(/<p>Jei įjungsime.*?naudojame\.<\/p>/, '<p>' + PRIVACY_EN.a3 + '</p>')
    .replace(
      '<p style="margin-top: 2rem;"><a href="index.html">← Grįžti į Personalą</a></p>',
      '<p style="margin-top: 2rem;"><a href="index.html">' + PRIVACY_EN.backLink + '</a></p>'
    );
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

// ---- Main ----
function main() {
  let indexHtml = stripIndexForLocaleBuild(read('index.html'));
  let privacyHtml = stripPrivacyForLocaleBuild(read('privatumas.html'));

  const privacyLtDesc =
    'Personalas – statinė svetainė su HR DI promptų rinkiniu. Asmens duomenų nerinkame; pažymėti žingsniai saugomi tik naršyklės localStorage.';
  const privacyEnDesc =
    'Personalas – static site with US hiring prompts for HR teams. We do not collect personal data; progress uses browser localStorage only.';

  // LT
  let ltIndex = injectHead(indexHtml, 'lt', BASE_PATH);
  write('lt/index.html', ltIndex);
  let ltPrivacy = privacyHtml.replace('href="favicon.svg"', 'href="../favicon.svg"');
  ltPrivacy = injectPrivacyHead(
    ltPrivacy,
    'lt',
    'lt/privatumas.html',
    'Privatumo politika – Personalas',
    privacyLtDesc
  );
  write('lt/privatumas.html', ltPrivacy);

  // EN
  let enIndex = applyEnReplacements(indexHtml);
  enIndex = applyEnPromptUi(enIndex);
  enIndex = injectHead(enIndex, 'en', BASE_PATH);
  write('en/index.html', enIndex);

  let enPrivacy = buildPrivacyEn(privacyHtml);
  enPrivacy = enPrivacy.replace('href="../favicon.svg"', 'href="../favicon.svg"');
  enPrivacy = injectPrivacyHead(enPrivacy, 'en', 'en/privatumas.html', PRIVACY_EN.title, privacyEnDesc);
  write('en/privatumas.html', enPrivacy);

  writeRobotsAndSitemap();

  finalizeRootIndexHtml();

  finalizeRootPrivacyHtml();

  console.log('Build done: lt/index.html, lt/privatumas.html, en/index.html, en/privatumas.html, robots.txt, sitemap.xml');
  console.log('BASE_PATH:', BASE_PATH || '(root – no subpath)');
  console.log('SITE_ORIGIN:', SITE_ORIGIN);
  console.log('SITE_PUBLIC_BASE:', SITE_PUBLIC_BASE || '(not set)');
  console.log('Absolute base:', absoluteBaseSlash());
}

main();
