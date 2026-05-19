'use strict';

/**
 * PDF-first layout: hero SOT placeholders, workflow section, pdf block before objectives.
 * Run: node scripts/reorder-pdf-first-layout.js && node scripts/patch-pdf-guides-section.js
 */

const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'templates', 'index-lt.html');
let html = fs.readFileSync(templatePath, 'utf8');

const pdfStart = html.indexOf('<section class="pdf-guides" id="pdf-guides"');
const communityStart = html.indexOf('<section class="community" id="community"');
if (pdfStart < 0 || communityStart < 0) {
  console.error('Could not find pdf-guides or community section');
  process.exit(1);
}

const pdfBlock = html.slice(pdfStart, communityStart);
html = html.slice(0, pdfStart) + html.slice(communityStart);

const heroStart = html.indexOf('<header class="header">');
const heroEnd = html.indexOf('</header>', heroStart) + '</header>'.length;

const heroNew = `<header class="header">
            <div class="header-badges">
                <a href="https://www.promptanatomy.app/" class="badge" target="_blank" rel="noopener noreferrer" aria-label="Pilna Promptų anatomija – interaktyvus mokymas (atidaroma naujame lange)">Promptų anatomija</a>
            </div>
            <h1>{{SOT_HERO_HEADLINE}}</h1>
            <p>{{SOT_HERO_SUBHEAD}}</p>
            <p class="hero-price-teaser">{{SOT_HERO_PRICE_TEASER}}</p>
            <p class="legal-disclaimer" data-sot-disclaimer role="note">{{SOT_DISCLAIMER}}</p>
            <div class="header-cta">
                <a href="{{SOT_HERO_PRIMARY_CTA_HREF}}" class="cta-button" aria-label="Get PDF guides">{{SOT_HERO_PRIMARY_CTA_LABEL}}</a>
                <a href="{{SOT_HERO_SECONDARY_CTA_HREF}}" class="cta-button-outline">{{SOT_HERO_SECONDARY_CTA_LABEL}}</a>
                <a href="{{SOT_HERO_TERTIARY_CTA_HREF}}" class="cta-button-outline header-tertiary-cta">{{SOT_HERO_TERTIARY_CTA_LABEL}}</a>
                <div class="lt-only-qa-nav" role="navigation" aria-label="Vieša JAV versija (EN)">
                    <a href="en/" class="cta-button-outline header-us-product-link">JAV svetainė (EN)</a>
                </div>
            </div>
        </header>

        <section class="workflow-overview" id="workflow-overview" aria-labelledby="workflow-overview-title">
            <h2 id="workflow-overview-title">{{SOT_WORKFLOW_TITLE}}</h2>
            <p class="workflow-overview-lede">{{SOT_WORKFLOW_LEDE}}</p>
            <ul class="header-phases workflow-phase-chips" aria-label="6 sistemos fazės">
                <li><button type="button" class="header-phase-link is-active" data-phase="1">1. Diagnostika</button></li>
                <li><button type="button" class="header-phase-link" data-phase="2">2. Profilis</button></li>
                <li><button type="button" class="header-phase-link" data-phase="3">3. Pritraukimas</button></li>
                <li><button type="button" class="header-phase-link" data-phase="4">4. Atranka</button></li>
                <li><button type="button" class="header-phase-link" data-phase="5">5. Pasiūlymas</button></li>
                <li><button type="button" class="header-phase-link" data-phase="6">6. Išlaikymas</button></li>
            </ul>
        </section>

`;

html = html.slice(0, heroStart) + heroNew + pdfBlock + html.slice(heroEnd);
html = html.replace(/<\/?motion>/gi, '');

const block1 = html.indexOf('id="block1"');
if (block1 > 0 && !html.includes('free-tier-label')) {
  const articleStart = html.lastIndexOf('<article class="prompt"', block1);
  const insert =
    '        <p class="free-tier-label" id="free-prompts-label">Free copy-paste prompts on this page — scroll down when you are ready.</p>\n\n        ';
  html = html.slice(0, articleStart) + insert + html.slice(articleStart);
}

fs.writeFileSync(templatePath, html, 'utf8');
console.log('Updated templates/index-lt.html: PDF-first layout');
