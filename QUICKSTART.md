# Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- API Keys:
  - OpenAI API key
  - Anthropic API key
  - GitHub personal access token
  - Discord bot token (optional)

## Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create `.env` file:**
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=ai_code_reviewer

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# GitHub
GITHUB_TOKEN=ghp_...

# Discord (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Server
PORT=3000
```

3. **Setup database:**
```bash
# Create database
createdb ai_code_reviewer

# Run migrations
npm run migration:generate
npm run migration:run
```

4. **Start backend:**
```bash
npm run start:dev
```

Backend should be running at `http://localhost:3000`

## Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Create `.env.local` file:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

3. **Start frontend:**
```bash
npm run dev
```

Frontend should be running at `http://localhost:3001`

## First Time Setup

1. **Register an account:**
   - Go to `http://localhost:3001`
   - Click "Đăng ký miễn phí"
   - Fill in your details

2. **Create a team:**
   - Go to Dashboard → Teams
   - Click "Tạo Team"
   - Enter team name and description

3. **Add a project:**
   - Go to Dashboard → Projects
   - Click "Tạo Project"
   - Enter GitHub/GitLab repository URL
   - Add business context
   - Configure webhook URL

4. **Set up webhook:**
   - Copy webhook URL from project settings
   - Add webhook to your GitHub/GitLab repository
   - Set content type to `application/json`
   - Select "Pull requests" events

5. **Configure Discord (optional):**
   - Create a Discord bot
   - Copy bot token
   - Add to project settings
   - Select or create channel

## Testing the System

1. **Create a pull request:**
   - Make changes to your repository
   - Create a pull request
   - Wait for AI review (webhook triggers automatically)

2. **View review:**
   - Go to Dashboard → Reviews
   - Click on the review
   - See AI comments and suggestions

3. **Provide feedback:**
   - Click "Provide Feedback" on a review
   - Mark as helpful or not helpful
   - AI learns from your feedback

## Team Collaboration

1. **Invite team members:**
   - Go to Teams → Your Team → Members tab
   - Click "Mời thành viên"
   - Enter email and select role
   - Member receives invitation

2. **Accept invitation:**
   - Team member logs in
   - Goes to Dashboard → Lời mời
   - Clicks "Chấp nhận"
   - Now part of the team!

## Subscription Management

1. **View pricing:**
   - Go to `/pricing`
   - Compare plans
   - Select a plan

2. **Upgrade plan:**
   - Go to Dashboard → Thanh toán
   - Click "Nâng cấp"
   - Select new plan
   - Complete payment (Stripe integration pending)

3. **Monitor usage:**
   - Dashboard → Thanh toán
   - See usage progress bars
   - Reviews, projects, members counters

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Check if port 3000 is available

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check backend is running
- Check CORS settings

### Webhook not triggering
- Verify webhook URL is correct
- Check webhook secret matches
- View webhook delivery logs in GitHub/GitLab

### AI not responding
- Check OpenAI/Anthropic API keys
- Verify API quota
- Check backend logs

## Development Tips

### Backend
```bash
# Watch mode
npm run start:dev

# Generate migration
npm run migration:generate -- -n MigrationName

# Run migration
npm run migration:run

# Revert migration
npm run migration:revert

# Build for production
npm run build

# Start production
npm run start:prod
```

### Frontend
```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint
```

## API Documentation

Once backend is running, visit:
- Swagger UI: `http://localhost:3000/api`
- JSON spec: `http://localhost:3000/api-json`

## Default Ports

- Backend: `3000`
- Frontend: `3001`
- PostgreSQL: `5432`

## Environment Variables Reference

### Backend Required
- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key

### Backend Optional
- `GITHUB_TOKEN` - GitHub personal access token
- `GITLAB_TOKEN` - GitLab personal access token
- `DISCORD_WEBHOOK_URL` - Discord webhook URL
- `PORT` - Server port (default: 3000)

### Frontend Required
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Support

For issues and questions:
- Check logs: Backend console, Frontend console
- Review this guide
- Check API documentation
- Review `COMMERCIAL_FEATURES.md` for feature details

## Next Steps

1. Complete Stripe payment integration
2. Set up email notifications (SendGrid/AWS SES)
3. Configure production database
4. Set up CI/CD pipeline
5. Deploy to production (Railway, Vercel, etc.)

Happy coding! 🚀
