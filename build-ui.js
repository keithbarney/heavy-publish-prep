const fs = require('fs');
const path = require('path');
const { transform } = require('lightningcss');

const src = fs.readFileSync(path.join(__dirname, 'ui.src.html'), 'utf8');
let css = fs.readFileSync(path.join(__dirname, '../../heavy-design-system/dist/main.css'), 'utf8');

css = css.replace(/@font-face\s*\{[^}]*\}/g, '');
css = css.replace(/\s*\/\* Style Guide Contract Tokens[^*]*\*\/[\s\S]*?(?=\n\s*\})/g, '');
css = css.replace(/\s*\/\* Style Guide Contract Tokens \(dark\)[^*]*\*\/[\s\S]*?(?=\n\s*\})/g, '');

const result = transform({
  filename: 'main.css',
  code: Buffer.from(css),
  drafts: { nesting: true },
  targets: { chrome: 100 << 16 },
  minify: false,
});
css = result.code.toString();

const out = src.replace('<!-- HEAVY_THEME -->', '<style>\n' + css + '\n  </style>');

fs.writeFileSync(path.join(__dirname, 'ui.html'), out);
console.log('Built ui.html');
