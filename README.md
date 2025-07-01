# SYB Prayer Times

Automatic music pausing during prayer times for Soundtrack Your Brand. This application integrates with Soundtrack Your Brand's API to automatically pause or lower music volume during Islamic prayer times, perfect for businesses observing prayer times during Ramadan and throughout the year.

## Features

- 🕌 **Smart Prayer Time Management**
  - Automatic prayer time calculation based on location
  - Support for multiple calculation methods (ISNA, MWL, Makkah, etc.)
  - Intelligent prayer duration calculation based on prayer type, day, and customs
  - Configurable pre-prayer and post-prayer buffer times
  
- 🎵 **Soundtrack Your Brand Integration**
  - Seamless API integration for volume control
  - Support for multiple zones per account
  - Automatic restoration of original volume after prayers
  
- 👥 **Multi-Tenant Architecture**
  - Admin users can manage multiple accounts
  - Client users have restricted access to their account only
  - Secure role-based access control
  
- 📊 **Monitoring & History**
  - Prayer mute history tracking
  - Dashboard with real-time statistics
  - Activity logs for troubleshooting

- 🌍 **Flexible Configuration**
  - Support for different juristic methods (Shafi/Hanafi)
  - High latitude calculation rules
  - Ramadan-only mode option
  - Per-prayer enable/disable settings

## Live Deployment

- **Web Interface**: https://syb-prayer-times-web.onrender.com
- **Default Admin**: admin@syb-prayer.com / prayer2024

## Architecture

The project consists of three main components:

1. **Backend Scheduler** (`/backend`) - A Node.js service that:
   - Runs every minute to check prayer times
   - Fetches prayer times from Aladhan API
   - Monitors and controls music volume via SYB API
   - Stores schedules and history in PostgreSQL

2. **Web Interface** (`/web`) - A Next.js 14 application that:
   - Provides authentication and user management
   - Allows configuration of prayer schedules
   - Shows real-time prayer status and history
   - Supports both admin and client user roles

3. **Database** - PostgreSQL with Prisma ORM:
   - Stores accounts, users, and schedules
   - Tracks prayer mute history
   - Manages user sessions

## User Roles

### Admin Users
- Can view and manage all accounts
- Create/edit/delete prayer schedules for any account
- Add client users to accounts
- Access to all system features

### Client Users
- Can only access their assigned account
- Create/edit/delete prayer schedules for their zones
- Cannot see other accounts or admin features
- Perfect for giving customers self-service access

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Soundtrack Your Brand API token
- Render account (for deployment) or similar hosting

## Setup

1. **Clone the repository**:
```bash
git clone https://github.com/brightears/syb_prayer_times.git
cd syb-prayer-times
```

2. **Install dependencies**:
```bash
npm run install:all
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SYB_API_URL` - Soundtrack Your Brand API endpoint
- `SYB_API_TOKEN` - Your SYB API token
- `JWT_SECRET` - Secret for session tokens
- `NODE_ENV` - Set to "production" for deployment

4. **Set up the database**:
```bash
npx prisma migrate deploy
npx prisma generate
```

5. **Seed initial admin user**:
```bash
npm run db:seed
```

## Development

Run both backend and web services:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend scheduler
npm run dev:backend

# Web interface
npm run dev:web
```

## Configuration Guide

### Prayer Time Calculation Methods

- **MWL** - Muslim World League (General purpose, widely accepted)
- **ISNA** - Islamic Society of North America (North America)
- **EGYPT** - Egyptian General Authority of Survey (Africa, Syria, Lebanon)
- **MAKKAH** - Umm al-Qura University, Makkah (Arabian Peninsula)
- **KARACHI** - University of Islamic Sciences, Karachi (Pakistan, India)
- **TEHRAN** - Institute of Geophysics, University of Tehran (Iran)
- **JAFARI** - Shia Ithna-Ashari (Shia regions)

### Smart Prayer Duration

The system automatically calculates prayer durations based on:
- **Prayer Type**: Each prayer has typical durations (Fajr: 12min, Dhuhr: 15min, etc.)
- **Day of Week**: Friday Dhuhr is extended to 30min for Jummah
- **Ramadan**: Isha is extended to 45min to include Tarawih prayers
- **Regional Customs**: Different calculation methods have different typical durations

### Juristic Methods

- **Shafi** (Standard) - Earlier Asr time
- **Hanafi** - Later Asr time (shadow length = 2x object height)

### High Latitude Rules

For locations above 48.5° latitude:
- **Middle of the Night** - Fajr = mid-point of sunset to sunrise
- **One-Seventh of the Night** - Fajr = 1/7th of the night before sunrise
- **Angle Based** - Use twilight angle from lower latitude

## Deployment on Render

### 1. Database (PostgreSQL)

1. Create a PostgreSQL instance on Render
2. Note the external connection string
3. Run migrations: `npx prisma migrate deploy`

### 2. Backend Scheduler (Background Worker)

1. Create a new Background Worker on Render
2. Connect your GitHub repository
3. Settings:
   - Build Command: `./scripts/build-backend.sh`
   - Start Command: `cd backend && npm start`
4. Environment variables (same as .env)

### 3. Web Application (Web Service)

1. Create a new Web Service on Render
2. Connect your GitHub repository  
3. Settings:
   - Build Command: `./scripts/build-web.sh`
   - Start Command: `cd web && npm start`
4. Environment variables (same as .env)

## Usage Guide

### For Administrators

1. **Login** at `/login` with admin credentials
2. **Manage Accounts**:
   - Go to Accounts → Add Account
   - Enter SYB Account ID and name
   - Click Edit to add client users
3. **Create Client Access**:
   - In account edit, click "Add User"
   - Enter email, name, and password
   - Share credentials with client

### For Clients

1. **Login** with provided credentials
2. **Create Prayer Schedule**:
   - Go to Schedules → Add Schedule
   - Select your zone
   - Enter location (city, country)
   - Choose timezone and calculation method
   - Enable "Mute music during prayer times"
   - Save and activate

### Schedule Settings

- **Pre-prayer Mute**: Minutes before prayer to start muting
- **Post-prayer Buffer**: Extra minutes after prayer ends
- **Ramadan Only**: Only activate during Ramadan month
- **Enabled Prayers**: Choose which of the 5 daily prayers to observe

## Troubleshooting

### Zones not loading
- Verify SYB API token has correct permissions
- Check if account ID is valid in SYB system
- Look for errors in browser console

### Prayer times not muting
- Ensure schedule is marked as "Active"
- Check timezone is correctly set
- Verify background worker is running
- Check logs in Render dashboard

### Login issues
- For first time setup, run `npm run db:seed`
- Check DATABASE_URL is correct
- Verify JWT_SECRET is set

## API Integration Details

### Soundtrack Your Brand
- Uses GraphQL API v2
- Requires API token with zone control permissions
- Endpoints used:
  - Query accounts and zones
  - Mutation to set volume levels

### Aladhan Prayer Times API
- Free, no authentication required
- Provides accurate prayer times worldwide
- Automatically handles daylight saving time

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT sessions expire after 7 days
- All API routes protected with authentication
- Role-based access control (RBAC)
- Environment variables for sensitive data
- HTTPS only in production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary to Brightears.

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: benorbe@brightears.com

## Changelog

### v1.0.0 (2025-07-01)
- Initial release with full prayer time automation
- Multi-tenant support with admin/client roles
- Smart prayer duration calculation
- Soundtrack Your Brand integration
- Web interface for configuration