# Deployment Guide

This guide provides detailed instructions for deploying the SYB Prayer Times application on Render.

## Current Production Deployment

- **Web Interface**: https://syb-prayer-times-web.onrender.com
- **Database**: PostgreSQL on Render (Singapore region)
- **Background Worker**: Running on Render

## Prerequisites

1. Render account
2. GitHub repository connected to Render
3. Soundtrack Your Brand API token
4. Domain (optional, for custom domain)

## Environment Variables

Create these environment variables in both Web Service and Background Worker:

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?ssl=true

# Soundtrack Your Brand API
SYB_API_URL=https://api.soundtrackyourbrand.com/v2
SYB_API_TOKEN=your_syb_api_token

# Authentication
JWT_SECRET=your-secret-key-min-32-chars

# Environment
NODE_ENV=production
```

## Step-by-Step Deployment

### 1. Database Setup (PostgreSQL)

1. **Create Database**:
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `syb-prayer-times-db`
   - Region: Choose closest to your users
   - Instance Type: Starter ($7/month)
   - Click "Create Database"

2. **Get Connection String**:
   - Go to database dashboard
   - Copy "External Database URL"
   - This is your `DATABASE_URL`

3. **Run Migrations**:
   ```bash
   # From your local machine
   DATABASE_URL="your-connection-string" npx prisma migrate deploy
   ```

### 2. Deploy Backend Scheduler

1. **Create Background Worker**:
   - Go to Render Dashboard → New → Background Worker
   - Name: `syb-prayer-times-scheduler`
   - Connect GitHub repository
   - Branch: `main`

2. **Configure Build & Start**:
   - Root Directory: (leave empty)
   - Build Command: `./scripts/build-backend.sh`
   - Start Command: `cd backend && npm start`

3. **Add Environment Variables**:
   - Add all variables from the list above
   - Click "Create Background Worker"

4. **Verify Deployment**:
   - Check logs for "Prayer time scheduler started"
   - Should see "Checking prayer times..." every minute

### 3. Deploy Web Application

1. **Create Web Service**:
   - Go to Render Dashboard → New → Web Service
   - Name: `syb-prayer-times-web`
   - Connect GitHub repository
   - Branch: `main`

2. **Configure Build & Start**:
   - Root Directory: (leave empty)
   - Build Command: `./scripts/build-web.sh`
   - Start Command: `cd web && npm start`
   - Instance Type: Starter ($7/month)

3. **Add Environment Variables**:
   - Add all variables from the list above
   - Auto-Deploy: Yes (recommended)

4. **Create Web Service**:
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

### 4. Initial Setup

1. **Seed Admin User**:
   ```bash
   # In Render Web Service Shell
   cd web
   npm run db:seed
   ```

2. **Verify Login**:
   - Navigate to https://your-app.onrender.com/login
   - Login with: admin@syb-prayer.com / prayer2024
   - Change password immediately

## Monitoring & Maintenance

### Check Service Health

1. **Web Service**:
   - Visit `/api/health` endpoint
   - Check Render dashboard for CPU/Memory usage
   - Monitor response times

2. **Background Worker**:
   - Check logs for regular "Checking prayer times..." messages
   - Verify no error messages
   - Monitor prayer mute history in database

### View Logs

1. **Render Dashboard**:
   - Go to service → Logs
   - Filter by time range
   - Search for specific errors

2. **Common Log Patterns**:
   ```
   # Successful prayer mute
   "Muting zone for prayer"
   
   # Prayer time check
   "Checking prayer times..."
   
   # API errors
   "SYB API error"
   ```

### Database Maintenance

1. **Backup**:
   - Render provides daily automated backups
   - Can also create manual backups

2. **Monitor Size**:
   ```sql
   -- Check database size
   SELECT pg_database_size('prayer_time_db');
   
   -- Check table sizes
   SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC;
   ```

3. **Clean Old Data** (optional):
   ```sql
   -- Delete mute history older than 6 months
   DELETE FROM "MuteHistory" 
   WHERE "mutedAt" < NOW() - INTERVAL '6 months';
   ```

## Troubleshooting

### Build Failures

1. **Check build logs** in Render dashboard
2. **Common issues**:
   - Missing dependencies: Check package.json
   - TypeScript errors: Run `npm run typecheck` locally
   - Prisma issues: Ensure schema is valid

### Runtime Errors

1. **Web Service Won't Start**:
   - Check if PORT is hardcoded (should use process.env.PORT)
   - Verify all environment variables are set
   - Check for database connection issues

2. **Scheduler Not Running**:
   - Verify DATABASE_URL is correct
   - Check if SYB_API_TOKEN is valid
   - Look for error messages in logs

3. **Prayer Times Not Muting**:
   - Ensure schedules are active
   - Verify timezone is correct
   - Check if background worker is running
   - Test SYB API token permissions

### Performance Issues

1. **Slow Page Loads**:
   - Check database query performance
   - Enable Render's performance monitoring
   - Consider upgrading instance type

2. **High Memory Usage**:
   - Check for memory leaks in scheduler
   - Monitor concurrent zone operations
   - Implement connection pooling

## Scaling Considerations

### When to Scale

- More than 100 active prayer schedules
- Response times > 1 second
- Memory usage consistently > 80%
- Database connections exhausted

### How to Scale

1. **Vertical Scaling**:
   - Upgrade Render instance types
   - Increase database resources

2. **Horizontal Scaling**:
   - Run multiple scheduler instances with zone partitioning
   - Implement Redis for session storage
   - Use CDN for static assets

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable Render's DDoS protection
- [ ] Regularly update dependencies
- [ ] Monitor for suspicious login attempts
- [ ] Backup database regularly
- [ ] Use HTTPS only (Render provides by default)

## Cost Optimization

### Current Monthly Costs (Estimate)
- PostgreSQL Starter: $7/month
- Web Service Starter: $7/month  
- Background Worker: $7/month
- **Total**: ~$21/month

### Tips to Reduce Costs
- Use free tier while testing
- Combine services if low traffic
- Implement efficient caching
- Clean old mute history records

## Rollback Procedure

If deployment fails:

1. **Render Auto-Rollback**:
   - Go to service → Deploys
   - Click "Rollback" on last working deploy

2. **Manual Rollback**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database Rollback**:
   - Restore from Render backup
   - Or run migration rollback:
   ```bash
   npx prisma migrate reset
   ```

## Support Contacts

- **Render Support**: support@render.com
- **Project Issues**: benorbe@brightears.com
- **Emergency**: Check Render status page