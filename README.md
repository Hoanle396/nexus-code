# 🤖 AI Code Reviewer - Intelligent Code Review Platform

<div align="center">

![AI Code Reviewer](https://img.shields.io/badge/AI-Code%20Reviewer-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-orange?style=for-the-badge)

**AI-Powered Code Review Platform with Team Collaboration & Web3 Payment**

[Features](#-tính-năng-nổi-bật) • [Demo](#-demo) • [Tech Stack](#-công-nghệ) • [Setup](#-cài-đặt) • [Pricing](#-pricing)

</div>

---

## 📖 Tổng quan

**AI Code Reviewer** là nền tảng SaaS thông minh giúp tự động hóa code review bằng AI, kết hợp khả năng học từ feedback và hiểu business context. Nền tảng hỗ trợ team collaboration, subscription management, và payment qua Web3 USDC.

### 🎯 Problem Statement

Code review thủ công tốn **2-4 giờ/ngày** cho mỗi senior developer. Chất lượng review không đồng nhất, context về business logic thường bị mất, và feedback không được tái sử dụng hiệu quả.

### 💡 Solution

AI Code Reviewer cung cấp:
- ✅ AI reviewer 24/7 với khả năng hiểu business context
- ✅ Học từ team feedback để cải thiện liên tục
- ✅ Team collaboration với role-based permissions
- ✅ Subscription tiers linh hoạt (FREE → ENTERPRISE)
- ✅ Web3 payment với USDC trên multiple chains

---

## ✨ Tính năng Nổi bật

### 🤖 AI-Powered Code Review

#### Core AI Features
- **Multi-AI Support**: GPT-4, Claude, OpenRouter
- **Business Context Awareness**: AI hiểu domain từ SRS/requirements
- **Training from Feedback**: Học từ team corrections và suggestions
- **Contextual Comments**: Comment có ngữ cảnh, không generic
- **Auto Reply**: AI reply lại user comments trên PR

#### Supported Platforms
- 🐙 **GitHub**: Full integration với webhooks
- 🦊 **GitLab**: Complete API support
- 💬 **Discord**: Real-time notifications

### 👥 Team Collaboration

#### Multi-tenant System
- **Personal Workspace**: Auto-created khi đăng ký
- **Unlimited Teams**: Tạo teams cho các projects khác nhau
- **Invitation System**: Secure token-based invitations (7-day expiration)
- **Member Management**: Add, remove, update roles

#### Role-Based Permissions
| Role | Permissions |
|------|-------------|
| 👑 **OWNER** | Full control, billing, delete team |
| 🔷 **ADMIN** | Manage members, projects, settings |
| 🟢 **MEMBER** | Create projects, view reviews |
| ⚪ **VIEWER** | Read-only access |

### 💰 Subscription & Billing

#### 4 Pricing Tiers

<table>
<tr>
<th>FREE</th>
<th>STARTER</th>
<th>PROFESSIONAL</th>
<th>ENTERPRISE</th>
</tr>
<tr>
<td>

**$0/month**
- 1 project
- 1 member
- 100 reviews/month
- GitHub & GitLab
- Basic AI

</td>
<td>

**$29/month**
- 5 projects
- 5 members
- 1,000 reviews/month
- Custom rules
- Priority support

</td>
<td>

**$99/month**
- 20 projects
- 20 members
- 5,000 reviews/month
- AI training
- Analytics
- 24/7 support

</td>
<td>

**$299/month**
- ♾️ Unlimited
- ♾️ Unlimited
- ♾️ Unlimited
- Dedicated model
- SLA guarantee
- Account manager

</td>
</tr>
</table>

#### Usage Tracking
- 📊 Real-time usage monitoring
- 📈 Visual progress bars
- ⚠️ Alerts at 80% limit
- 💎 Upgrade suggestions

### ⛓️ Web3 Payment Innovation

#### Multi-Chain USDC Support

**Mainnet Networks:**
- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137) - **Recommended (Low gas)**
- Arbitrum (Chain ID: 42161)
- Base (Chain ID: 8453)

**Testnet Networks:**
- Ethereum Sepolia, Polygon Mumbai
- Arbitrum Sepolia, Base Sepolia

#### Payment Features
- 💳 **Wallet Integration**: MetaMask, WalletConnect
- ✅ **On-chain Verification**: Auto-verify transactions
- 🔒 **Secure**: Validate amount, receiver, token contract
- 🌍 **Global Access**: No credit card needed
- ⚡ **Instant Settlement**: No waiting periods
- 💸 **Low Fees**: 0.1% vs 2.9% traditional payments

---

## 🏗️ Kiến trúc Hệ thống

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐   │
│  │Dashboard│  │ Teams   │  │Projects │  │   Billing   │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────┘   │
│                          ↓ API Calls ↓                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS 10)                      │
│  ┌──────┐  ┌──────┐  ┌─────────┐  ┌──────────┐  ┌────────┐│
│  │ Auth │  │ Team │  │ Project │  │Subscription││Webhook ││
│  └──────┘  └──────┘  └─────────┘  └──────────┘  └────────┘│
│  ┌──────┐  ┌─────────┐  ┌────────────┐  ┌────────────────┐│
│  │Review│  │Training │  │     AI     │  │  Web3 Payment  ││
│  └──────┘  └─────────┘  └────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────┘
          ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────────┐    ┌─────────────┐
│  PostgreSQL  │    │  AI APIs         │    │ Blockchains │
│  Database    │    │  • OpenAI        │    │ • Ethereum  │
│              │    │  • Anthropic     │    │ • Polygon   │
│              │    │  • OpenRouter    │    │ • Arbitrum  │
└──────────────┘    └──────────────────┘    └─────────────┘
```

### Module Architecture

```
backend/src/modules/
├── auth/              → JWT authentication, user management
├── team/              → Multi-tenant team management
│   ├── entities/      → Team, TeamMember
│   ├── services/      → 12 methods (CRUD, invitations)
│   └── controllers/   → 11 REST endpoints
├── project/           → Repository integration
│   ├── entities/      → Project (linked to team)
│   └── services/      → GitHub/GitLab API
├── review/            → AI review engine
│   ├── entities/      → Review, ReviewComment
│   └── services/      → AI analysis, comment posting
├── webhook/           → GitHub/GitLab event handlers
├── training/          → ML feedback loop
│   ├── entities/      → TrainingData
│   └── services/      → Learn from feedback
├── subscription/      → Billing & usage tracking
│   ├── entities/      → Subscription, Payment
│   └── services/      → Plans, usage limits
├── ai/                → AI provider abstraction
│   └── services/      → Multi-model support
└── security/          → Web3 payment verification
    └── services/      → On-chain transaction validation
```

---

## 🛠️ Công nghệ

### Frontend Stack

```typescript
{
  "framework": "Next.js 14",         // App Router, Server Components
  "language": "TypeScript",          // Type safety
  "styling": "Tailwind CSS",         // Utility-first CSS
  "state": "Zustand",                // Lightweight state management
  "forms": "React Hook Form + Zod",  // Form validation
  "ui": "Radix UI + shadcn/ui",      // Accessible components
  "web3": "ethers.js v6",            // Blockchain integration
  "animations": "Framer Motion"      // Smooth animations
}
```

### Backend Stack

```typescript
{
  "framework": "NestJS 10",          // Enterprise architecture
  "language": "TypeScript",          // Type safety
  "database": "PostgreSQL + TypeORM", // Production-grade DB
  "auth": "JWT + Passport",          // Authentication
  "validation": "class-validator",   // DTO validation
  "ai": {
    "openai": "GPT-4",               // Primary AI
    "anthropic": "Claude",           // Alternative
    "openrouter": "Multi-model"      // Fallback
  },
  "blockchain": "ethers.js",         // Web3 integration
  "integrations": [
    "@octokit/rest",                 // GitHub API
    "@gitbeaker/node",               // GitLab API
    "discord.js"                     // Discord bot
  ]
}
```

### Infrastructure

- ☁️ **Deployment**: Docker, Docker Compose
- 🗄️ **Database**: PostgreSQL 14+
- 🔗 **RPC Providers**: Alchemy, Infura, QuickNode
- 📧 **Email**: (Ready for SendGrid/AWS SES)
- 📊 **Monitoring**: (Ready for Datadog/Sentry)

---

## 🚀 Cài đặt

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm/npm
- MetaMask wallet (for Web3 features)

### Quick Start

#### 1️⃣ Clone Repository

```bash
git clone https://github.com/yourusername/ai-code-reviewer.git
cd ai-code-reviewer
```

#### 2️⃣ Backend Setup

```bash
cd backend

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Run migrations
pnpm migration:run

# Start development server
pnpm start:dev
```

**Backend runs at:** `http://localhost:3001`

#### 3️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Setup environment (already configured)
# Edit .env.local if needed

# Start development server
pnpm dev
```

**Frontend runs at:** `http://localhost:3000`

### Environment Configuration

#### Backend `.env`

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=ai_code_reviewer

# JWT Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=7d

# AI APIs
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-claude-key

# Web3 Payment
WEB3_RECEIVER_ADDRESS=0xYourWalletAddress

# Ethereum RPCs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR-KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR-KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR-KEY

# Testnets
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-KEY
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR-KEY
```

#### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 📘 Hướng dẫn Sử dụng

### 1️⃣ Đăng ký & Đăng nhập

1. Truy cập `http://localhost:3000`
2. Click **"Đăng ký"**
3. Điền thông tin → Submit
4. System tự động tạo Personal Team
5. Redirect to Dashboard

### 2️⃣ Tạo Team (Optional)

```
Dashboard → Teams → "Tạo Team Mới"
```

- Nhập team name, description
- Chọn plan (FREE/STARTER/PRO/ENTERPRISE)
- Submit → Team created

### 3️⃣ Invite Team Members

```
Teams → [Team Detail] → Members tab → "Invite Member"
```

- Enter email → Generate invitation
- Copy link và gửi cho member
- Member click link → Accept invitation
- Member được add vào team

### 4️⃣ Cấu hình GitHub/GitLab Token

```
Dashboard → Settings → API Tokens
```

**GitHub Token:**
- Settings → Developer settings → Personal access tokens
- Scopes: `repo`, `write:discussion`

**GitLab Token:**
- Preferences → Access Tokens
- Scopes: `api`, `read_api`, `write_repository`

### 5️⃣ Tạo Project

```
Dashboard → Projects → "Tạo Project Mới"
```

**Form fields:**
- **Name**: Tên project
- **Team**: Chọn team
- **Platform**: GitHub hoặc GitLab
- **Repository URL**: `https://github.com/user/repo`
- **Business Context**: Mô tả business logic, coding standards
- **Auto Review**: Enable/Disable

### 6️⃣ Setup Webhook

**On GitHub:**
```
Repository → Settings → Webhooks → Add webhook
```
- Payload URL: `https://yourdomain.com/api/v1/webhook/github`
- Content type: `application/json`
- Events: `Pull requests`, `Pull request comments`

**On GitLab:**
```
Project → Settings → Webhooks
```
- URL: `https://yourdomain.com/api/v1/webhook/gitlab`
- Trigger: `Merge request events`, `Comments`

### 7️⃣ AI Review Flow

```
1. Tạo Pull Request trên GitHub/GitLab
2. Webhook triggers backend
3. Backend fetches code changes
4. AI analyzes với business context + training data
5. AI posts comments trực tiếp lên PR
6. Developer reply/react → Training data updated
7. Next review: AI smarter với team context
```

### 8️⃣ Upgrade Subscription (Web3)

```
Dashboard → Billing → "Upgrade Plan"
```

**Payment Flow:**
1. Connect MetaMask wallet
2. Select plan (STARTER/PRO/ENTERPRISE)
3. Choose network (Polygon recommended)
4. Confirm USDC transfer
5. Wait for blockchain confirmation
6. Subscription activated automatically

---

## 💎 Web3 Payment Guide

### Setup MetaMask

1. Install [MetaMask](https://metamask.io/)
2. Create wallet hoặc import existing
3. Add networks (Polygon, Arbitrum, Base)
4. Get testnet USDC from faucets

### Get Testnet USDC

**For Testing:**
- [Aave Faucet](https://staging.aave.com/faucet/) - Sepolia, Mumbai
- [Circle Faucet](https://faucet.circle.com/) - Testnet USDC
- [Base Faucet](https://www.coinbase.com/faucets/base-sepolia-faucet)

### Payment on Polygon (Recommended)

**Why Polygon?**
- ⚡ Ultra-low gas (~$0.01 per transaction)
- ✅ Fast confirmation (~2 seconds)
- 🔒 Ethereum security
- 💰 Perfect for recurring payments

**Steps:**
1. Switch MetaMask to Polygon network
2. Ensure sufficient USDC balance
3. Click "Pay with USDC"
4. Confirm transaction
5. Wait for confirmation
6. Done! Subscription active

---

## 🎓 AI Training System

### How It Works

```
User Comment:
"Good suggestion, but we use Zod for validation, not Joi"
         ↓
System extracts:
- Context: Validation library preference
- Team standard: Zod
- Code pattern: validation schemas
         ↓
Saves to TrainingData entity
         ↓
Next AI Review:
Prompt includes: "Team prefers Zod for validation"
         ↓
AI suggests: "Consider using Zod schema..."
```

### Training Data Types

- ✅ **Approved Comments**: Good suggestions
- ❌ **Rejected Comments**: Wrong suggestions
- 💬 **User Corrections**: Feedback to improve
- 📚 **Code Patterns**: Team conventions

---

## 📊 Database Schema

### Core Entities

```typescript
User {
  id, email, password, fullName
  githubToken, gitlabToken
  isActive, createdAt
}

Team {
  id, name, description
  ownerId, plan (FREE/STARTER/PRO/ENTERPRISE)
  isActive, createdAt
}

TeamMember {
  id, teamId, userId
  role (OWNER/ADMIN/MEMBER/VIEWER)
  status (PENDING/ACCEPTED/DECLINED)
  invitationToken, invitationExpiry
}

Project {
  id, name, type (github/gitlab)
  teamId, repositoryUrl
  businessContext, reviewRules
  autoReview, isActive
}

Review {
  id, projectId, pullRequestNumber
  pullRequestTitle, pullRequestUrl
  branch, author, status
  aiAnalysis, filesChanged
}

ReviewComment {
  id, reviewId, externalCommentId
  content, filePath, lineNumber
  author, parentCommentId
  isTrainingData
}

TrainingData {
  id, projectId, codeSnippet
  aiComment, userFeedback
  correctedComment, useCount
}

Subscription {
  id, teamId, plan
  status, billingCycle (monthly/yearly)
  currentPeriodStart, currentPeriodEnd
  walletAddress
}

Payment {
  id, subscriptionId, amount
  currency (USDC), status
  transactionHash, chainId
  fromAddress, toAddress, blockNumber
}
```

---

## 🔒 Security Features

### Authentication & Authorization
- 🔐 JWT with refresh tokens
- 🛡️ Password hashing (Argon2)
- 🎯 Role-based access control (RBAC)
- ✅ Permission checks at service layer

### Web3 Security
- ✅ Transaction verification on-chain
- 🔍 Amount validation (±1% tolerance)
- 📍 Receiver address verification
- 🎯 Token contract validation
- 🔢 Block confirmation checks

### Data Protection
- 🗄️ SQL injection prevention (TypeORM)
- 🧹 Input sanitization (class-validator)
- 🔒 Encrypted sensitive data
- 📝 Audit logs for critical actions

---

## 📈 Roadmap

### Q1 2025 - MVP Launch
- [x] Core AI review features
- [x] Team collaboration
- [x] Subscription system
- [x] Web3 payment
- [ ] Beta program (100 users)
- [ ] Public launch

### Q2 2025 - Growth
- [ ] Bitbucket support
- [ ] Slack integration
- [ ] Advanced analytics
- [ ] Custom AI model fine-tuning
- [ ] Multi-language support (VI, JP)

### Q3 2025 - Enterprise
- [ ] VS Code extension
- [ ] IDE plugins (IntelliJ, WebStorm)
- [ ] Security vulnerability detection
- [ ] CI/CD pipeline integration
- [ ] SLA guarantees

### Q4 2025 - Scale
- [ ] Mobile app
- [ ] AI-powered code generation
- [ ] Compliance checking (GDPR, SOC2)
- [ ] White-label solutions
- [ ] Marketplace partnerships

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**AI Code Reviewer Team**
- Product & Development
- Based in Vietnam 🇻🇳
- Building the future of code review

---

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) - GPT-4 API
- [Anthropic](https://anthropic.com/) - Claude API
- [NestJS](https://nestjs.com/) - Backend framework
- [Next.js](https://nextjs.org/) - Frontend framework
- [Circle](https://www.circle.com/) - USDC stablecoin
- [Alchemy](https://www.alchemy.com/) - Blockchain infrastructure

---

## 📞 Support

- 📧 Email: support@aicodereview.dev
- 💬 Discord: [Join our community](https://discord.gg/aicodereview)
- 📚 Docs: [docs.aicodereview.dev](https://docs.aicodereview.dev)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/ai-code-reviewer/issues)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/ai-code-reviewer&type=Date)](https://star-history.com/#yourusername/ai-code-reviewer&Date)

---

<div align="center">

**Made with ❤️ by AI Code Reviewer Team**

[Website](https://aicodereview.dev) • [Twitter](https://twitter.com/aicodereview) • [LinkedIn](https://linkedin.com/company/aicodereview)

</div>
