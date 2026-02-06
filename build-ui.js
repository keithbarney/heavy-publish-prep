const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'ui.src.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'heavy-theme.css'), 'utf8');
const out = src.replace('<!-- HEAVY_THEME -->', '<style>\n' + css + '\n  </style>');

fs.writeFileSync(path.join(__dirname, 'ui.html'), out);
console.log('Built ui.html');
