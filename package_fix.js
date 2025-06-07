const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.dev = 'node deepseek-app.js';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('Fixed package.json with dev script');
