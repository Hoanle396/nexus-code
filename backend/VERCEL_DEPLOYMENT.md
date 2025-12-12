# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account

## Environment Variables
Set the following environment variables in Vercel Dashboard:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `JWT_EXPIRATION` - JWT expiration time (e.g., "7d")

### Optional (based on your services)
- `OPENAI_API_KEY` - For OpenAI integration
- `ANTHROPIC_API_KEY` - For Claude/Anthropic integration
- `GITHUB_TOKEN` - For GitHub integration
- `GITLAB_TOKEN` - For GitLab integration
- `DISCORD_TOKEN` - For Discord bot
- `DISCORD_CLIENT_ID` - Discord client ID
- `CORS_ORIGIN` - Allowed CORS origin (default: *)
- `API_PREFIX` - API prefix (default: api/v1)

## Deployment Steps

### 1. Login to Vercel
```bash
vercel login
```

### 2. Link to Project (first time only)
```bash
vercel link
```

### 3. Set Environment Variables
Either through Vercel Dashboard or CLI:
```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add other variables
```

### 4. Deploy
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Important Notes

1. **Database**: Ensure your PostgreSQL database is accessible from the internet (Vercel runs on serverless infrastructure)
2. **Connection Pooling**: Consider using a connection pooler like PgBouncer or Supabase for better performance
3. **Cold Starts**: First requests may be slower due to serverless cold starts
4. **File System**: Vercel serverless functions are read-only except for /tmp directory
5. **Execution Time**: Vercel has timeout limits (10s hobby, 60s pro)

## Post-Deployment

1. Test your API: `https://your-project.vercel.app/api/v1`
2. Access Swagger docs: `https://your-project.vercel.app/api/docs`
3. Monitor logs in Vercel Dashboard

## Troubleshooting

### Build Errors
- Check that all dependencies are in `package.json` dependencies (not devDependencies)
- Ensure TypeScript compiles without errors: `pnpm build`

### Runtime Errors
- Check Vercel logs: `vercel logs`
- Verify environment variables are set correctly
- Test database connectivity

### Connection Issues
- Verify your database accepts connections from Vercel IPs
- Check if you need to whitelist Vercel IP ranges
- Consider using a serverless-compatible database (Neon, Supabase, PlanetScale)

## Development vs Production

The `main.ts` file now supports both:
- **Local development**: Run with `pnpm start:dev` (uses tunnel for webhooks)
- **Vercel production**: Runs as serverless function with Express adapter
