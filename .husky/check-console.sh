#!/bin/bash

# Check for console.log statements in staged files
echo "🔍 Checking for console.log statements in staged files..."

# Get list of staged files (only .js, .ts, .jsx, .tsx files)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|jsx|ts|tsx)$')

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No JS/TS files staged for commit"
  exit 0
fi

CONSOLE_LOGS_FOUND=false

# Check each staged file for console.log
for FILE in $STAGED_FILES; do
  if [ -f "$FILE" ]; then
    # Check for console.log, console.warn, console.error, etc.
    CONSOLE_LINES=$(git show :$FILE | grep -n "console\." | grep -v "// eslint-disable" | grep -v "/* eslint-disable")
    
    if [ ! -z "$CONSOLE_LINES" ]; then
      echo "❌ Console statements found in $FILE:"
      echo "$CONSOLE_LINES"
      CONSOLE_LOGS_FOUND=true
    fi
  fi
done

if [ "$CONSOLE_LOGS_FOUND" = true ]; then
  echo ""
  echo "🚫 Commit blocked: Please remove console statements before committing."
  echo "💡 If you need to keep console statements for debugging, add // eslint-disable-next-line no-console"
  exit 1
fi

echo "✅ No console statements found in staged files"
exit 0