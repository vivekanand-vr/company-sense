# Git Hooks Setup with Husky

This project uses Husky to enforce code quality and commit message standards through Git hooks.

## 🔧 Setup

The following tools are configured:

- **Husky**: Git hooks management
- **lint-staged**: Run linters on staged files
- **Commitlint**: Validate commit message format
- **Console.log checker**: Prevent console statements in commits
- **Prettier**: Code formatting
- **ESLint**: Code linting

## 📝 Commit Message Format

All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Allowed Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Reverting changes

### Examples:

```bash
feat: add user authentication system
fix: resolve memory leak in data processing
docs: update API documentation
style: format code with prettier
refactor: extract utility functions
test: add unit tests for auth service
chore: update dependencies
```

## 🚫 Pre-commit Checks

Before each commit, the following checks are performed:

1. **Console.log Detection**: Scans staged files for console statements
2. **ESLint**: Checks for code quality issues
3. **Prettier**: Formats code automatically
4. **TypeScript**: Validates types

### Console.log Policy

Console statements are not allowed in commits. If you need to keep them for debugging:

```javascript
// This will be flagged:
console.log('debug info');

// This is allowed:
// eslint-disable-next-line no-console
console.log('debug info');
```

## 🛠 Manual Commands

Run these commands manually when needed:

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format all files with Prettier
npx prettier --write .

# Check commit message format
npx commitlint --from HEAD~1 --to HEAD --verbose

# Test console.log checker
node .husky/check-console.js
```

## 🔧 Troubleshooting

### Bypass Hooks (Emergency Only)

```bash
# Skip pre-commit hooks (not recommended)
git commit --no-verify -m "emergency fix"

# Skip commit-msg hook
git commit --no-verify -m "any message format"
```

### Hook Failures

1. **Console.log found**: Remove console statements or add eslint-disable comment
2. **Lint errors**: Fix the issues or run `npm run lint:fix`
3. **Commit message format**: Use conventional commit format
4. **Prettier formatting**: Run `npx prettier --write <file>`

### Reinstall Hooks

```bash
# If hooks stop working
npm run prepare
```

## 📁 Hook Files

- `.husky/pre-commit`: Runs before each commit
- `.husky/commit-msg`: Validates commit messages
- `.husky/check-console.js`: Checks for console statements
- `commitlint.config.js`: Commit message rules
- `.prettierrc`: Prettier configuration
- `package.json`: lint-staged configuration
