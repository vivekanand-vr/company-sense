/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');

// eslint-disable-next-line no-console
console.log('🔍 Checking for console.log statements in staged files...');

try {
  // Get list of staged files (only .js, .ts, .jsx, .tsx files)
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split('\n')
    .filter(file => file.match(/\.(js|jsx|ts|tsx)$/) && !file.includes('.husky/'));

  if (stagedFiles.length === 0) {
    // eslint-disable-next-line no-console
    console.log('✅ No JS/TS files staged for commit');
    process.exit(0);
  }

  let consoleLogsFound = false;

  // Check each staged file for console statements
  stagedFiles.forEach(file => {
    if (file.trim()) {
      try {
        const fileContent = execSync(`git show :${file}`, { encoding: 'utf8' });
        const lines = fileContent.split('\n');
        
        lines.forEach((line, index) => {
          // Check for console statements but ignore eslint-disable comments and comments
          if (line.includes('console.') && 
              !line.includes('// eslint-disable') && 
              !line.includes('/* eslint-disable') &&
              !line.trim().startsWith('//') &&
              !line.trim().startsWith('*')) {
            // eslint-disable-next-line no-console
            console.log(`❌ Console statement found in ${file}:${index + 1}`);
            // eslint-disable-next-line no-console
            console.log(`   ${line.trim()}`);
            consoleLogsFound = true;
          }
        });
      } catch (error) {
        // File might be deleted or renamed, skip it
      }
    }
  });

  if (consoleLogsFound) {
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log('🚫 Commit blocked: Please remove console statements before committing.');
    // eslint-disable-next-line no-console
    console.log('💡 If you need to keep console statements for debugging, add // eslint-disable-next-line no-console');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('✅ No console statements found in staged files');
  process.exit(0);

} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Error checking for console statements:', error.message);
  process.exit(0); // Don't block commit on script errors
}