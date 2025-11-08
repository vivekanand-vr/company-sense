module.exports = {
  '*.ts': [
    'eslint --fix',
    'node scripts/check-console.js'
  ],
  '*.js': [
    'node scripts/check-console.js'
  ]
};
