'use strict';

const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs', 'pdf-source', 'advanced-personalas-hr.html');

function footer(n) {
  return `<motion class="brand-footer">
    <span class="brand-footer-left">Personalas · HR Hiring Guides</span>
    <span class="brand-footer-url">www.promptanatomy.app</span>
    <span class="brand-footer-right">Page ${n}</span>
  </motion>`;
}

const pages = [];

pages.push(`<section class="page cover">
  <div>
    <p class="cover-eyebrow">Personalas · Advanced Edition · Prompt Anatomy</p>
    <h1 class="cover-title">Advanced HR Hiring Guide</h1>
    <p class="cover-subtitle">Scorecards, rubrics, calibration, and debrief protocols for HR leads scaling structured US hiring.</p>
    <div class="cover-spinoff">
      <strong>Free tool:</strong> 10 live prompts at <strong>promptanatomy.help/en/</strong><br>
      <span class="tiny">Mother brand: www.promptanatomy.app · Pair with the 12-page Beginner guide</span>
    </div>
    <p class="cover-meta"><strong>Audience:</strong> HRBPs, lead recruiters, people managers<br><strong>Length:</strong> 24 pages · May 2026</p>
  </div>
  ${footer(1)}
</section>`);

const bodyPages = [
  { eyebrow: 'Method', tag: 'Foundation', title: 'Scorecards vs rubrics', body: `<p class="lead">A scorecard lists what you measure. A rubric defines what each score level looks like with behavioral anchors.</p>
  <table><tr><th>Tool</th><th>Answers</th></tr>
  <tr><td>Scorecard</td><td>Which 7–10 competencies matter for this role family?</td></tr>
  <tr><td>Rubric</td><td>What does a 3 vs 4 look like for each competency?</td></tr></table>
  <div class="callout"><strong>Rule</strong>Assign each competency to one interviewer. When everyone owns everything, nothing is scored rigorously.</motion>` },
  { eyebrow: 'Ch 1', tag: 'Prompts 1–2', title: 'Diagnostics & competency model', body: `<p>Advanced Prompt 1 adds trend context and stage labels to funnel numbers. Prompt 2 outputs competencies + knockouts.</p>
  <pre class="prompt-block">Role: senior recruitment analyst.
Task: Map funnel metrics to bottleneck stage; recommend 3 interventions with owners.
Context: [role], [90-day applicant/interview/offer counts], target time-to-fill [days].
Format: table Stage | Signal | Action | Owner.</pre>
  <pre class="prompt-block">Role: workforce planning partner.
Task: Define 7 competencies and up to 2 knockout criteria for [role].
Format: competency | why it matters | how to assess | knockout Y/N.</pre>` },
  { eyebrow: 'Ch 1', tag: 'Knockouts', title: 'Minimum bar & role family', body: `<p>Before interviews, document minimum total score and knockouts (e.g., must score 3+ on Communication).</p>
  <ul><li>Individual contributor sales: discovery, objection handling, pipeline discipline</li>
  <li>HR generalist: judgment, stakeholder communication, process orientation</li>
  <li>Operations: systems thinking, prioritization, data accuracy</li></ul>
  <motion class="callout callout-warn"><strong>Legal note</strong>Document job-related criteria. Avoid undocumented "culture" vetoes.</motion>` },
  { eyebrow: 'Ch 2', tag: 'Prompts 3–4', title: 'Inclusive JD & sourcing', body: `<pre class="prompt-block">Role: inclusive job description editor.
Task: Rewrite JD for [role]; flag biased language; add EEO statement placeholder for counsel review.
Constraints: plain US English; pay transparency where required by state.</pre>
  <pre class="prompt-block">Role: sourcing strategist.
Task: Boolean search strings (LinkedIn), 3 outreach templates, employee referral ask for [role].
Format: table Channel | Tactic | Sample copy (no PII).</pre>` },
  { eyebrow: 'Ch 2', tag: 'Outreach', title: 'Sourcing quality bar', body: `<p>Verify AI-generated Boolean strings in your ATS/LinkedIn — they often over-filter or miss synonyms.</p>
  <h3>Outreach checklist</h3>
  <ul class="check-list"><li>Role and location specific</li><li>No demographic proxies</li><li>Clear CTA and timeline</li><li>Tracked in ATS</li></ul>` },
  { eyebrow: 'Ch 3', tag: 'Interview kit', title: 'Prompt 5 — full kit', body: `<pre class="prompt-block">Role: structured interview designer.
Task: Build interview kit for [role] with assigned competencies per panel member.
Output: opening script; 5 behavioral (STAR); 3 situational; work-sample prompt; debrief notes template.
Format: tables with Question | Competency | Listen for | Probe.</pre>` },
  { eyebrow: 'Ch 3', tag: 'STAR bank', title: 'Behavioral question bank', body: `<table>
  <tr><th>Competency</th><th>Question</th><th>Strong signal</th></tr>
  <tr><td>Ownership</td><td>Tell me about a goal you missed. What did you do next?</td><td>Owns outcome; specific recovery steps</td></tr>
  <tr><td>Communication</td><td>Explain a complex decision to a non-expert.</td><td>Clear structure; checks understanding</td></tr>
  <tr><td>Collaboration</td><td>Describe conflict with a peer and resolution.</td><td>Focus on behavior, not blame</td></tr></table>` },
  { eyebrow: 'Ch 3', tag: 'Work sample', title: 'Work-sample prompts', body: `<p>Use when role output is observable (writing sample, case exercise, portfolio review).</p>
  <ul><li>Same exercise for every finalist</li><li>Rubric scored before seeing names</li><li>Time-boxed to reduce unpaid labor burden</li></ul>
  <div class="callout"><strong>Fairness</strong>Accommodate disabilities; document alternatives in advance.</motion>` },
  { eyebrow: 'Ch 4', tag: 'Rubric', title: 'Rubric: Communication (1–4)', body: `<table>
  <tr><th>4</th><td>Exceptional — proactive updates; frames trade-offs for stakeholders</td></tr>
  <tr><th>3</th><td>Strong — clear updates; occasional reactive communication</td></tr>
  <tr><th>2</th><td>Developing — vague updates; defends position without business framing</td></tr>
  <tr><th>1</th><td>Does not meet bar — surprises stakeholders; poor documentation</td></tr></table>
  <p class="muted">Build similar tables for each competency on your scorecard.</p>` },
  { eyebrow: 'Ch 4', tag: 'Rubric', title: 'Rubric: Ownership & blank scorecard', body: `<table>
  <tr><th>4</th><td>Anticipates blockers; delivers without reminders</td></tr>
  <tr><th>3</th><td>Delivers on commitments with light guidance</td></tr>
  <tr><th>2</th><td>Needs frequent direction; partial delivery</td></tr>
  <tr><th>1</th><td>Unreliable follow-through</td></tr></table>
  <h3>Blank scorecard (copy)</h3>
  <table><tr><th>Competency</th><th>Owner</th><th>1–4</th><th>Evidence</th></tr>
  <tr><td>&nbsp;</td><td></td><td></td><td></td></tr>
  <tr><td>&nbsp;</td><td></td><td></td><td></td></tr></table>` },
  { eyebrow: 'Ch 4', tag: 'Scorecard', title: 'Universal scorecard template', body: `<p>Candidate: ______ Role: ______ Interviewer: ______ Stage: ______</p>
  <table><tr><th>Competency</th><th>Rating 1–4</th><th>Evidence (required)</th></tr>
  <tr><td></td><td></td><td></td></tr></table>
  <p>Overall: Strong hire / Hire / No hire / Strong no hire</p>
  <p class="tiny">No evidence = invalid score in debrief.</p>` },
  { eyebrow: 'Ch 5', tag: 'Calibration', title: '90-minute calibration training', body: `<p><strong>Part 1 (20 min):</strong> Why these competencies for this role family.</p>
  <p><strong>Part 2 (40 min):</strong> Watch a sample interview clip; score independently; compare to rubric anchors.</p>
  <p><strong>Part 3 (30 min):</strong> Debrief protocol walkthrough with fictional candidate.</p>` },
  { eyebrow: 'Ch 5', tag: 'Debrief', title: 'Debrief protocol', body: `<ol>
  <li>Scores submitted before the meeting — no exceptions</li>
  <li>Review competency-by-competency, not "overall gut feel" first</li>
  <li>Discuss 2 vs 4 splits with cited evidence</li>
  <li>Hiring manager states decision tied to competency scores</li></ol>
  <div class="callout callout-danger"><strong>Anti-anchoring</strong>Do not lead with "I loved them" before evidence review.</motion>` },
  { eyebrow: 'Ch 6', tag: 'Prompts 6–7', title: 'Decline & offer scenarios', body: `<pre class="prompt-block">Task: Analyze decline patterns for [role] band; separate comp vs role vs process issues.
Output: 3 root causes | talk track | process fix | timeline.</pre>
  <pre class="prompt-block">Task: Draft offer call script + email; include benefits headline; handle counter-offer scenario.
Tone: confident, transparent, US comp format.</pre>` },
  { eyebrow: 'Ch 6', tag: 'Negotiation', title: 'Offer negotiation plays', body: `<ul><li>Pre-approved bands before the call</li><li>Separate level vs start date vs bonus</li><li>Document every verbal promise in writing</li></ul>` },
  { eyebrow: 'Ch 7', tag: 'Prompts 8–9', title: 'Onboarding & retention', body: `<pre class="prompt-block">Task: 30-60-90 plan for [role] with manager checkpoints and success metrics.</pre>
  <pre class="prompt-block">Task: Analyze early attrition themes; separate expectation gap vs manager vs role design.</pre>` },
  { eyebrow: 'Ch 7', tag: 'Retention', title: 'First-90-day checkpoints', body: `<table><tr><th>When</th><th>Focus</th></tr>
  <tr><td>Week 1</td><td>Tools, team, role clarity</td></tr>
  <tr><td>Day 30</td><td>Delivery vs expectations</td></tr>
  <tr><td>Day 90</td><td>Performance conversation; development plan</td></tr></table>` },
  { eyebrow: 'Ch 8', tag: 'Master', title: 'Prompt 10 — chained workflow', body: `<pre class="prompt-block">Role: HR recruitment strategist.
Task: Using outputs from prior steps [paste summaries], produce integrated plan:
1. Bottleneck 2. This week 3. JD fixes 4. Interview improvements 5. Offer acceptance 6. 90-day retention
Constraints: concrete actions only; flag gaps needing human data.</pre>` },
  { eyebrow: 'Compliance', tag: 'Bias', title: 'Bias & documentation guardrails', body: `<ul class="check-list">
  <li>Same questions per role and stage</li>
  <li>Evidence-based scorecard notes only</li>
  <li>Quarterly score distribution review by interviewer</li>
  <li>Culture assessed as values behaviors, not social likeness</li></ul>` },
  { eyebrow: 'Worksheets', tag: 'Tools', title: 'Blank rubric worksheet', body: `<p>Competency: _________________</p>
  <table><tr><th>4 Exceptional</th><td></td></tr><tr><th>3 Strong</th><td></td></tr>
  <tr><th>2 Developing</th><td></td></tr><tr><th>1 Below bar</th><td></td></tr></table>` },
  { eyebrow: 'Worksheets', tag: 'Library', title: 'Team prompt library template', body: `<p>Store approved prompts in shared drive: Name | Role family | Owner | Last verified | Link to rubric</p>
  <p>Review quarterly when comp bands or role definitions change.</p>` },
  { eyebrow: 'Rollout', tag: 'Team', title: 'HR team rollout (one page)', body: `<ol>
  <li>Pick one role family pilot</li>
  <li>Publish scorecard + rubrics</li>
  <li>Train panel (90 min calibration)</li>
  <li>Run 3 hires; retro debrief quality</li>
  <li>Expand to next family</li></ol>` }
];

bodyPages.forEach((p, i) => {
  const pageNum = i + 2;
  pages.push(`<section class="page">
  <div class="page-eyebrow"><span>${p.eyebrow}</span><span class="page-eyebrow-tag">${p.tag}</span></div>
  <h2>${p.title}</h2>
  ${p.body}
  ${footer(pageNum)}
</section>`);
});

pages.push(`<section class="page">
  <motion class="page-eyebrow"><span>Close</span><span>Next steps</span></motion>
  <h2>Thank you — back to Personalas</h2>
  <div class="close-block">
    <h3>Free 10-prompt builder</h3>
    <p><strong>promptanatomy.help/en/</strong> — copy prompts in your browser; no account.</p>
    <h3>Beginner guide</h3>
    <p>12-page companion for first structured hiring loops.</p>
    <p><strong>License:</strong> Personal license — your HR team only. promptanatomy.help/terms.html#paid-pdf-license</p>
    <p><strong>Refund:</strong> 14 days · <strong>Help:</strong> info@promptanatomy.help</p>
    <p class="tiny">© 2026 Prompt Anatomy · www.promptanatomy.app</p>
  </div>
  ${footer(24)}
</section>`);

let html = pages.join('\n');
html = html.replace(/<motion/g, '<div').replace(/<\/motion>/g, '</div>');

const doc = `<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="utf-8">
  <title>Advanced HR Hiring Guide – Personalas – promptanatomy.help</title>
  <link rel="stylesheet" href="pdf-print.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
${html}
</body>
</html>`;

fs.writeFileSync(OUT, doc, 'utf8');
console.log('Wrote', OUT, 'with', pages.length, 'pages');
