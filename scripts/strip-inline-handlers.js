'use strict';

const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '..', 'templates', 'index-lt.html');
let t = fs.readFileSync(p, 'utf8');
const before = t;
t = t.replace(/\s*onclick="activateCodeBlock\(this\)"/g, '');
t = t.replace(/\s*onkeydown="handleCodeBlockKeydown\(event, this\)"/g, '');
t = t.replace(/\s*onclick="copyPrompt\(this, 'prompt\d+'\)"/g, '');
if (t === before) {
  console.log('No inline handlers found to strip');
} else {
  fs.writeFileSync(p, t);
  console.log('Stripped inline handlers from templates/index-lt.html');
}
console.log('onclick left:', (t.match(/onclick=/g) || []).length);
console.log('onkeydown left:', (t.match(/onkeydown=/g) || []).length);
