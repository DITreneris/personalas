/**
 * Build LT/en-US locale pages from root index.html and privatumas.html.
 * Usage: BASE_PATH=/04_personalas/ node scripts/build-locale-pages.js
 * Output: lt/index.html, lt/privatumas.html, en/index.html, en/privatumas.html
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const rawBase = process.env.BASE_PATH || '';
const BASE_PATH = rawBase ? rawBase.replace(/\/*$/, '') + '/' : '';
// For canonical/hreflang: use '/' when BASE_PATH empty so local dev (e.g. /lt/) resolves correctly
const BASE_FOR_LINKS = BASE_PATH || '/';

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

// ---- Inject SEO and script path ----
function injectHead(html, locale, basePath, baseForLinks) {
  const base = baseForLinks != null ? baseForLinks : basePath;
  const canonical = base + locale + '/';
  const linkCanonical = '<link rel="canonical" href="' + canonical + '">';
  const linkLt = '<link rel="alternate" hreflang="lt" href="' + base + 'lt/">';
  const linkEn = '<link rel="alternate" hreflang="en-US" href="' + base + 'en/">';
  const linkDefault = '<link rel="alternate" hreflang="x-default" href="' + base + 'en/">';
  const seoBlock = '\n    ' + [linkCanonical, linkLt, linkEn, linkDefault].join('\n    ') + '\n';
  html = html.replace(/<meta name="viewport"[^>]*>\s*/i, '$&' + seoBlock);

  const basePathScript = basePath
    ? '<script>window.BASE_PATH = \'' + basePath.replace(/'/g, "\\'") + '\';</script>\n    '
    : '';
  html = html.replace(/<script src="generator\.js"><\/script>/, basePathScript + '<script src="../generator.js"></script>');
  return html;
}

// ---- EN replacement pairs (order: more specific first) ----
const EN_REPLACEMENTS = [
  ['<html lang="lt">', '<html lang="en-US">'],
  ['<title>HR kasdienė atrankos sistema – DI promptai</title>', '<title>HR hiring system – AI prompts for US teams</title>'],
  ['Pereiti prie turinio', 'Skip to content'],
  ['Kalbos pasirinkimas', 'Language selection'],
  ['Perjungti į lietuvių kalbą', 'Switch to Lithuanian'],
  ['Perjungti į anglų kalbą', 'Switch to English'],
  ['Pilna Promptų anatomija – interaktyvus mokymas (atidaroma naujame lange)', 'Full Prompt Anatomy – interactive training (opens in a new tab)'],
  ['HR kasdienė atrankos sistema, Spin-off Nr. 3', 'HR hiring system for US teams, Series No. 3'],
  ['DI atrankos sistema<br>Personalo vadovui', 'AI hiring system<br>For US HR teams'],
  ['Veikianti atrankos struktūra per ~30 min.', 'Build a practical hiring workflow in about 30 minutes.'],
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
  ['Kaip naudoti šią sistemą', 'How to use this system for US hiring'],
  ['Orientacinis laikas: 3–5 min per žingsnį', 'Estimated time: 3–5 min per step'],
  ['~3–5 min per žingsnį', '~3–5 min per step'],
  ['per žingsnį', 'per step'],
  ['Pasirink fazę, paspausk ir atidaryk. Tada pasirink konkretų promptą.', 'Choose a phase, open it, then pick a specific prompt.'],
  ['Spausk <strong>„Kopijuoti promptą“</strong> arba <code>Ctrl+C</code> / <code>Cmd+C</code> ant pasirinkto prompto.', 'Click <strong>“Copy prompt”</strong> or <code>Ctrl+C</code> / <code>Cmd+C</code> on the selected prompt.'],
  ['Įklijuok į ChatGPT, Claude, Gemini ar kitą DI (dirbtinio intelekto) įrankį.', 'Paste into ChatGPT, Claude, Gemini, or another AI tool.'],
  ['Jei prompte yra <code>[įmonė]</code>, <code>[pozicija]</code>, <code>[atlygis]</code>, <code>[ ]</code> ar kiti laukai – pakeisk savo duomenimis. DI vaidmens („Tu esi…“) keisti nereikia.', 'Replace placeholders such as <code>[company]</code>, <code>[role]</code>, <code>[location]</code>, and <code>[salary range]</code>. Use US location formats such as <code>New York, NY</code>, <code>San Francisco, CA 94105</code>, <code>Remote – US</code>, or <code>Hybrid – Austin, TX</code>; use <code>MM/DD/YYYY</code>, and follow US contact standards. Address fields: <code>Street Address</code>, <code>City</code>, <code>State</code>, <code>Zip Code</code>. Phone format: <code>+1 (XXX) XXX-XXXX</code>, for example <code>+1 (415) 555-0198</code>.'],
  ['Ne, bet seka atspindi pilną atrankos ciklą nuo diagnostikos iki išlaikymo. Dažniausiai verta pradėti nuo 1 fazės ir judėti pagal savo situaciją.', 'No, but the sequence reflects the full recruitment cycle from diagnosis to retention. It’s usually best to start at phase 1 and move according to your situation.'],
  ['Ne. Keisk tik laukus laužtiniuose skliaustuose ir skaičius – DI vaidmuo jau suformuluotas taip, kad gautum aiškų rezultatą.', 'No. Only change bracket placeholders and numbers – the AI role is already phrased to give a clear result.'],
  ['Ne. Tai tekstai, kuriuos nukopijuoji ir įklijuoji į savo DI įrankį – joks serveris nevykdo atrankos už tave.', 'No. These are texts you copy and paste into your AI tool – no server runs recruitment for you.'],
  ['Orientaciniai ~3–5 minutės pasiruošimui ir kopijavimui; pats pokalbis su DI priklauso nuo tavo klausimų ir atsakymų.', 'About 3–5 minutes to prepare and copy; the actual AI chat depends on your questions and answers.'],
  ['Taip. Promptai universalesni – svarbu pildyti laukus savo kontekstu, ne bendromis frazėmis.', 'Yes. The prompts are universal – what matters is filling placeholders with your context, not generic phrases.'],
  ['Taip. Gali pradėti nuo vienos problemos (pvz. skelbimo ar pokalbio) ir grįžti prie kitų vėliau.', 'Yes. You can start with one problem (e.g. job ad or interview) and return to others later.'],
  ['Trumpai – ką verta žinoti prieš kopijuojant pirmą promptą.', 'Quick notes before you copy the first prompt.'],
  ['Geriausia eiti iš eilės nuo 1 iki 10. Paspaudę nuorodą pereisi prie atitinkamo prompto.', 'Best to go in order from 1 to 10. Click a link to jump to that prompt.'],
  ['Ar būtina eiti visas 6 fazes iš eilės?', 'Do I have to go through all 6 phases in order?'],
  ['Ar reikia keisti eilutę „Tu esi…“ prompto pradžioje?', 'Do I need to change the “You are…” line at the start of the prompt?'],
  ['Ar tai klausimynas ar automatinė atrankų sistema (ATS)?', 'Is this a survey or an applicant tracking system (ATS)?'],
  ['Kiek laiko užtrunka vienas žingsnis?', 'How long does one step take?'],
  ['Ar tinka mažai įmonei ar HR vienui?', 'Does it work for a small company or a solo HR person?'],
  ['Ar galiu naudoti tik vieną ar kelis promptus?', 'Can I use just one or a few prompts?'],
  ['Dažniausi klausimai prieš startą', 'Common questions before you start'],
  ['Kas toliau?', 'What’s next?'],
  ['1. Kur stringame?', '1. Where are we stuck?'],
  ['2. Koks žmogus mums iš tikrųjų tinka?', '2. Who really fits us?'],
  ['3. Perrašyk darbo skelbimą paprastai', '3. Rewrite the job ad in plain language'],
  ['4. Kaip šiandien rasti daugiau žmonių?', '4. How to find more people today?'],
  ['5. Kaip geriau pravesti pokalbį?', '5. How to run a better interview?'],
  ['6. Kodėl kandidatai atsisako?', '6. Why do candidates decline?'],
  ['7. Kaip geriau pristatyti pasiūlymą?', '7. How to present the offer better?'],
  ['8. Kaip padėti naujam žmogui pirmus 3 mėnesius?', '8. How to support a new hire in the first 3 months?'],
  ['9. Kodėl žmonės išeina?', '9. Why do people leave?'],
  ['10. Pagrindinis promptas (vienas viskam)', '10. Master prompt (one for everything)'],
  ['Sistema: 0 / 6 fazės', 'System: 0 / 6 phases'],
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
  ['Atidaryti Promptų anatomija Telegram kanalą naujame lange', 'Open Prompt anatomy Telegram channel in new tab'],
  ['Prisijungti prie Telegram grupės', 'Join Telegram group'],
  ['Promptų anatomija →', 'Prompt anatomy →'],
  ['Promptų anatomija', 'Prompt anatomy'],
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
  ['Sistema: X / 6 fazės', 'System: X / 6 phases'],
  ['progresas ir fazės', 'progress and phases'],
  ['Copy promptą', 'Copy prompt'],
  // CSS comments (EN build)
  ['žalia CTA paletė', 'green CTA palette'],
  ['Pagrindinis akcentas – žalia', 'Primary accent – green'],
  ['Hero: žalia,', 'Hero: green,'],
  ['žalias tekstas', 'green text'],
  ['Tertiarinė (bibliotekos identitetas)', 'Tertiary (library identity)'],
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
  ['[įmonė] → įmonės pavadinimas arba sritis (nebūtina, bet padeda pritaikyti toną); [įklijuok] → įklijuok savo darbo skelbimo tekstą.', '[company] → company and US location (e.g., San Francisco, CA); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [salary range] → use $, comma thousands, and decimal points where needed (e.g., $85,000–$105,000 or $1,250.50); [paste] → paste your job ad text.'],
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
6. How to help them stay the first 3 months`
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
  { title: 'Rewrite the job ad in plain language', desc: 'So the person feels the ad is for them', infoUse: 'You\'re rewriting the ad in plain language. Clear, simple text attracts the right candidates.', infoReplace: '[company] → company and US location (e.g., San Francisco, CA); [location] → Street Address, City, State, optional Zip Code, or Remote – US; [salary range] → use $, comma thousands, and decimal points where needed (e.g., $85,000–$105,000 or $1,250.50); [paste] → paste your job ad text.', cta: 'Copy and paste into ChatGPT or Claude – that\'s the goal of this step.' },
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
    'Kaip šiandien rasti daugiau žmonių?', 'Kaip geriau pravesti pokalbį?', 'Kodėl kandidatai atsisako?',
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
  title: 'Privacy Policy – US Hiring Prompt Library',
  back: '← Back to library',
  backLink: '← Back to US Hiring Prompt Library',
  intro: '<strong>Personalas</strong> – US hiring prompt library for HR teams (Spin-off No. 3 from Prompt Anatomy). Minimal static app; English UI is <code>en-US</code>. Briefly about your data.',
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
    .replace('← Grįžti į biblioteką', '← Back to library')
    .replace('Privatumo politika', 'Privacy policy')
    .replace(/<p><strong>Personalas<\/strong>[^]*?<\/p>/, '<p>' + PRIVACY_EN.intro + '</p>')
    .replace('Ar renkame tavo duomenis?', PRIVACY_EN.q1)
    .replace(/<p><strong>Ne\.<\/strong>.*?serverius\.<\/p>/, '<p>' + PRIVACY_EN.a1 + '</p>')
    .replace('Kas vyksta tavo įrenginyje?', PRIVACY_EN.q2)
    .replace(/<p>Tik naršyklės.*?įrenginyje\.<\/p>/, '<p>' + PRIVACY_EN.a2 + '</p>')
    .replace('Jei vėliau bus forma', PRIVACY_EN.q3)
    .replace(/<p>Jei įjungsime.*?naudojame\.<\/p>/, '<p>' + PRIVACY_EN.a3 + '</p>')
    .replace('← Grįžti į Personalą', PRIVACY_EN.backLink);
}

// ---- Main ----
function main() {
  let indexHtml = read('index.html');
  let privacyHtml = read('privatumas.html');

  // LT
  let ltIndex = injectHead(indexHtml, 'lt', BASE_PATH, BASE_FOR_LINKS);
  write('lt/index.html', ltIndex);
  let ltPrivacy = privacyHtml.replace('href="favicon.svg"', 'href="../favicon.svg"');
  write('lt/privatumas.html', ltPrivacy);

  // EN
  let enIndex = applyEnReplacements(indexHtml);
  enIndex = applyEnPromptUi(enIndex);
  enIndex = injectHead(enIndex, 'en', BASE_PATH, BASE_FOR_LINKS);
  write('en/index.html', enIndex);

  let enPrivacy = buildPrivacyEn(privacyHtml);
  enPrivacy = enPrivacy.replace('href="../favicon.svg"', 'href="../favicon.svg"');
  write('en/privatumas.html', enPrivacy);

  console.log('Build done: lt/index.html, lt/privatumas.html, en/index.html, en/privatumas.html');
  console.log('BASE_PATH:', BASE_PATH || '(empty)');
}

main();
