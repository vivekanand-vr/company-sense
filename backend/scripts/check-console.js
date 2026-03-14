const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
let hasConsole = false;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (/console\.log/.test(content)) {
    console.error(`Console.log found in ${file}`);
    hasConsole = true;
  }
});

if (hasConsole) {
  process.exit(1);
}
