# Architecture Documentation

## System Overview

The SYB Prayer Times system is a distributed application designed to automatically control music volume in commercial venues during Islamic prayer times. It integrates with Soundtrack Your Brand's API for music control and uses the Aladhan API for accurate prayer time calculations.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Web Interface │────▶│    PostgreSQL    │◀────│    Scheduler    │
│   (Next.js)     │     │    Database      │     │   (Node.js)     │
│                 │     │                  │     │                 │
└────────┬────────┘     └──────────────────┘     └────────┬────────┘
         │                                                  │
         │                                                  │
         ▼                                                  ▼
┌─────────────────┐                              ┌─────────────────┐
│  SYB GraphQL    │                              │  Aladhan API    │
│      API        │                              │ (Prayer Times)  │
└─────────────────┘                              └─────────────────┘
```

## Component Architecture

### 1. Web Interface (`/web`)

Built with Next.js 14 using App Router, providing:

- **Authentication & Authorization**
  - JWT-based session management
  - Role-based access control (Admin/Client)
  - Secure password hashing with bcrypt

- **User Interface**
  - Dashboard with real-time statistics
  - Account management for admins
  - Prayer schedule configuration
  - Responsive design with Tailwind CSS

- **API Routes**
  - RESTful endpoints for CRUD operations
  - Protected routes with middleware
  - Integration with SYB GraphQL API

### 2. Backend Scheduler (`/backend`)

Node.js service running continuous prayer time monitoring:

- **Scheduling Engine**
  - Runs every minute using node-schedule
  - Checks active prayer schedules
  - Calculates prayer times for current day
  - Manages mute/unmute operations

- **Prayer Time Calculation**
  - Fetches times from Aladhan API
  - Supports multiple calculation methods
  - Handles timezone conversions
  - Smart duration calculation based on context

- **Volume Control**
  - GraphQL mutations to SYB API
  - Tracks current volume state
  - Restores original volume after prayers
  - Handles API failures gracefully

### 3. Database Schema

PostgreSQL with Prisma ORM:

```prisma
User
├── id, email, password, name
├── role (ADMIN/CLIENT)
└── accountId (for clients)

Account
├── id, accountId, accountName
├── isActive
└── relations: users, schedules

PrayerSchedule
├── zone info (id, name)
├── location & timezone
├── calculation settings
├── mute configuration
└── enabled prayers

PrayerTime
├── daily prayer times
├── cached API responses
└── schedule relation

MuteHistory
├── mute/unmute timestamps
├── volume before/after
├── success status
└── error tracking
```

## Data Flow

### 1. Schedule Creation Flow

```
User → Web UI → API Route → Validate → Database → Response
                    ↓
                SYB API (verify zone)
```

### 2. Prayer Time Monitoring Flow

```
Scheduler (every minute)
    ↓
Check Active Schedules
    ↓
Calculate Prayer Windows
    ↓
For Each Schedule:
    ├── Is it prayer time?
    ├── Should mute this prayer?
    ├── Is Ramadan-only enabled?
    └── Pre/post buffer times
         ↓
    Mute/Unmute Zone
         ↓
    Log to History
```

### 3. Authentication Flow

```
Login Request → Validate Credentials → Generate JWT
                                           ↓
                                      Set Session
                                           ↓
                                    Return User Info
```

## Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible components
- **React Hook Form** - Form management

### Backend
- **Node.js** - JavaScript runtime
- **TypeScript** - Type safety
- **Express** - Web framework (for health checks)
- **node-schedule** - Cron-like scheduling
- **Prisma** - ORM and migrations
- **Winston** - Logging

### Infrastructure
- **PostgreSQL** - Primary database
- **Render** - Hosting platform
- **GitHub Actions** - CI/CD (optional)

### External APIs
- **Soundtrack Your Brand** - GraphQL API v2
- **Aladhan** - REST API for prayer times

## Security Architecture

### Authentication
- JWT tokens with 7-day expiration
- Secure HTTP-only cookies (when applicable)
- Session validation on each request

### Authorization
- Role-based access control (RBAC)
- Resource-level permissions
- API route protection middleware

### Data Protection
- Bcrypt password hashing (10 rounds)
- Environment variables for secrets
- HTTPS enforcement in production
- SQL injection prevention via Prisma

### API Security
- Rate limiting on login attempts
- Input validation with Zod
- CORS configuration
- API token rotation capability

## Scalability Considerations

### Current Limitations
- Single scheduler instance
- In-memory mute tracking
- Sequential zone processing
- No caching layer

### Scaling Strategies

1. **Horizontal Scaling**
   ```
   Multiple Schedulers with Zone Partitioning:
   - Scheduler 1: Zones A-M
   - Scheduler 2: Zones N-Z
   ```

2. **Caching Layer**
   ```
   Redis for:
   - Session storage
   - Prayer time cache
   - Zone state tracking
   ```

3. **Database Optimization**
   ```
   - Connection pooling
   - Read replicas
   - Indexed queries
   - Partitioned tables
   ```

4. **Queue System**
   ```
   Bull/Redis for:
   - Async mute operations
   - Retry logic
   - Dead letter queue
   ```

## Performance Optimization

### Current Optimizations
- Batch database queries
- Efficient prayer time calculations
- Minimal API calls to SYB
- Optimized React components

### Monitoring Points
- API response times
- Database query performance
- Memory usage patterns
- Background job success rates

### Bottlenecks to Watch
- Sequential zone processing
- Database connection limits
- API rate limits
- Memory leaks in scheduler

## Error Handling Strategy

### Graceful Degradation
- Continue operating if prayer API fails (use cached times)
- Skip failed zones, continue with others
- Automatic retry with exponential backoff
- Detailed error logging

### Recovery Mechanisms
- Automatic reconnection to database
- API token refresh capability
- State recovery after crashes
- Manual intervention alerts

## Development Workflow

### Local Development
```bash
# Start all services
npm run dev

# Database migrations
npx prisma migrate dev

# Type checking
npm run typecheck

# Testing
npm run test
```

### Code Organization
```
/
├── backend/           # Scheduler service
│   ├── src/
│   │   ├── services/  # Business logic
│   │   ├── lib/       # Utilities
│   │   └── index.ts   # Entry point
│   └── package.json
│
├── web/               # Next.js application
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/# React components
│   │   └── lib/       # Utilities
│   └── package.json
│
├── prisma/            # Database schema
├── scripts/           # Build scripts
└── package.json       # Root package
```

### Deployment Pipeline
1. Push to GitHub
2. Render auto-deploys from main
3. Build scripts run
4. Services restart
5. Health checks verify

## Future Enhancements

### Planned Features
- [ ] Mobile app for notifications
- [ ] SMS/Email alerts
- [ ] Advanced scheduling (holidays)
- [ ] Multi-language support
- [ ] Analytics dashboard

### Technical Improvements
- [ ] GraphQL subscriptions for real-time updates
- [ ] Webhook support for zone changes
- [ ] Kubernetes deployment option
- [ ] Automated testing suite
- [ ] Performance monitoring integration