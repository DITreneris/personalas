'use strict';
const fs = require('fs');
const p = 'scripts/pdf-guides-section.fragment.html';
let s = fs.readFileSync(p, 'utf8');
const badClose = '</' + 'motion>';
const goodClose = '</div>';
s = s.split(badClose).join(goodClose);
fs.writeFileSync(p, s);
console.log('motion left:', s.includes('motion'));
