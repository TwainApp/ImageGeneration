const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'build', 'index.html');
const dest = path.join(__dirname, 'build', '404.html');

fs.copyFileSync(src, dest);
console.log('✔ index.html copied to 404.html');
