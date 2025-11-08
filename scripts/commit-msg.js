const msg = require('fs').readFileSync(process.argv[2], 'utf-8').trim();
const validTypes = ['fix', 'feat', 'refactor', 'docs', 'test', 'chore', 'perf', 'style', 'ci', 'build', 'revert'];
const regex = new RegExp(`^(${validTypes.join('|')})(\(.+\))?: .+`);

if (!regex.test(msg)) {
  console.error(`\nInvalid commit message format.\nAllowed types: ${validTypes.join(', ')}\nExample: feat(api): add new endpoint\n`);
  process.exit(1);
}
