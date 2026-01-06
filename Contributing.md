# Contributing to EVID-DGC

## Welcome Contributors! 🎉

Thank you for your interest in contributing to EVID-DGC. This guide will help you get started with contributing to our blockchain evidence management system.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Git
- MetaMask browser extension
- Supabase account (for database testing)

### Development Setup
1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub
   # Clone your fork
   git clone https://github.com/YOUR_USERNAME/blockchain-evidence.git
   cd blockchain-evidence
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your test credentials
   ```

4. **Database Setup**
   ```bash
   # Run database-schema.sql in Supabase
   # Run setup-first-admin.sql with your wallet
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

## How to Contribute

### 1. Reporting Issues
- Use GitHub Issues to report bugs
- Include detailed reproduction steps
- Provide browser/OS information
- Add screenshots if helpful

### 2. Suggesting Features
- Open a GitHub Issue with "Feature Request" label
- Describe the feature and use case
- Explain why it would be valuable
- Consider implementation complexity

### 3. Code Contributions
- Fork the repository
- Create a feature branch
- Make your changes
- Test thoroughly
- Submit a pull request

## Development Guidelines

### Branch Naming
```bash
# Feature branches
feature/user-role-management
feature/evidence-upload

# Bug fixes
fix/wallet-connection-issue
fix/admin-dashboard-bug

# Documentation
docs/api-documentation
docs/setup-guide
```

### Commit Messages
Follow conventional commit format:
```bash
# Features
feat: add evidence upload functionality
feat(admin): implement user role management

# Bug fixes
fix: resolve MetaMask connection issue
fix(api): handle invalid wallet addresses

# Documentation
docs: update API documentation
docs(setup): add environment configuration guide

# Refactoring
refactor: simplify user authentication logic
refactor(ui): improve dashboard layout

# Tests
test: add unit tests for user registration
test(api): add integration tests for admin endpoints
```

### Code Style

#### JavaScript
```javascript
// Use const/let, not var
const userWallet = '0x1234...';
let isConnected = false;

// Use arrow functions for callbacks
users.map(user => user.role);

// Use template literals
const message = `Welcome ${userName}!`;

// Use async/await over promises
async function getUser(wallet) {
  try {
    const response = await fetch(`/api/user/${wallet}`);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
  }
}
```

#### HTML
```html
<!-- Use semantic HTML -->
<main class="dashboard">
  <section class="user-management">
    <h2>User Management</h2>
    <article class="user-card">
      <!-- Content -->
    </article>
  </section>
</main>

<!-- Use proper indentation -->
<div class="form-group">
  <label for="walletAddress">
    <i data-lucide="wallet"></i>
    Wallet Address
  </label>
  <input type="text" id="walletAddress" class="form-control">
</div>
```

#### CSS
```css
/* Use CSS custom properties */
:root {
  --primary-color: #D32F2F;
  --text-color: #212121;
}

/* Use BEM methodology */
.user-card {
  /* Block */
}

.user-card__header {
  /* Element */
}

.user-card--featured {
  /* Modifier */
}

/* Use logical properties */
.container {
  margin-inline: auto;
  padding-block: 2rem;
}
```

### File Structure
```
blockchain-evidence/
├── docs/                   # Documentation
├── public/                 # Frontend files
│   ├── index.html         # Main entry
│   ├── admin.html         # Admin dashboard
│   ├── dashboard-*.html   # Role dashboards
│   ├── app.js            # Main logic
│   ├── storage.js        # Database client
│   └── styles.css        # Styling
├── contracts/             # Smart contracts
├── server.js             # API server
├── database-schema.sql   # Database setup
└── package.json          # Dependencies
```

## Testing Guidelines

### Manual Testing
1. **Test All User Roles**
   - Create test accounts for each role
   - Verify role-specific permissions
   - Test dashboard functionality

2. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers
   - Different screen sizes

3. **Wallet Integration**
   - MetaMask connection
   - Network switching
   - Account switching

### Automated Testing
```javascript
// Example test structure
describe('User Registration', () => {
  test('should register new user with valid data', async () => {
    const userData = {
      walletAddress: '0x1234...',
      fullName: 'Test User',
      role: 'investigator'
    };
    
    const result = await registerUser(userData);
    expect(result.success).toBe(true);
  });
});
```

## Pull Request Process

### Before Submitting
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No console errors
- [ ] Responsive design works
- [ ] Accessibility guidelines followed

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Mobile testing completed

## Screenshots
(If applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

### Review Process
1. **Automated Checks**
   - Code style validation
   - Build verification
   - Security scanning

2. **Manual Review**
   - Code quality assessment
   - Functionality testing
   - Documentation review

3. **Approval & Merge**
   - Maintainer approval required
   - Squash and merge preferred
   - Delete feature branch after merge

## Documentation Standards

### Code Comments
```javascript
/**
 * Create a new user account with validation
 * @param {Object} userData - User registration data
 * @param {string} userData.walletAddress - Ethereum wallet address
 * @param {string} userData.fullName - User's full name
 * @param {string} userData.role - User role (investigator, analyst, etc.)
 * @returns {Promise<Object>} Registration result
 */
async function createUser(userData) {
  // Implementation
}
```

### README Updates
- Keep installation instructions current
- Update feature lists
- Add new configuration options
- Include troubleshooting tips

### API Documentation
- Document all endpoints
- Include request/response examples
- Specify error codes
- Add authentication requirements

## Security Guidelines

### Sensitive Data
- Never commit API keys or secrets
- Use environment variables
- Sanitize user inputs
- Validate wallet addresses

### Best Practices
- Implement proper error handling
- Use HTTPS in production
- Validate all user inputs
- Log security events

## Community

### Communication
- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions and reviews

### Recognition
Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

## Release Process

### Version Numbering
- **Major**: Breaking changes (v2.0.0)
- **Minor**: New features (v1.1.0)
- **Patch**: Bug fixes (v1.0.1)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Security review completed

## 👥 Contributors

<p align="left">
  <a href="https://github.com/Gooichand/blockchain-evidence/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Gooichand/blockchain-evidence" alt="Contributors" />
  </a>
</p>

See the full list of contributors and their contributions on the [`GitHub Contributors Graph`](https://github.com/Gooichand/blockchain-evidence/graphs/contributors).

<h2 align="center">
<p style="font-family:var(--ff-philosopher);font-size:3rem;"><b> Show some <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png" alt="Red Heart" width="40" height="40" /> by starring this awesome repository!
</p>
</h2>

<div align="center">
  <img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">
</div>

---

## 📊 Repository Stats

[![GitHub stars](https://img.shields.io/github/stars/Gooichand/blockchain-evidence?style=social)](https://github.com/Gooichand/blockchain-evidence/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Gooichand/blockchain-evidence?style=social)](https://github.com/Gooichand/blockchain-evidence/network/members)
[![GitHub contributors](https://img.shields.io/github/contributors/Gooichand/blockchain-evidence)](https://github.com/Gooichand/blockchain-evidence/graphs/contributors)



## Questions?

- Check existing [Issues](https://github.com/Gooichand/blockchain-evidence/issues)
- Read the [Documentation](docs/)
- Start a [Discussion](https://github.com/Gooichand/blockchain-evidence/discussions)

Thank you for contributing to EVID-DGC! 🚀
