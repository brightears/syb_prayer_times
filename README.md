# SYB Prayer Times

Automatic music pausing during prayer times for Soundtrack Your Brand. This application integrates with Soundtrack Your Brand's API to automatically pause or lower music volume during Islamic prayer times, perfect for businesses observing prayer times during Ramadan and throughout the year.

## Features

- 🕌 Automatic prayer time calculation based on location
- 🎵 Integration with Soundtrack Your Brand API
- 🌍 Support for multiple calculation methods (ISNA, MWL, Makkah, etc.)
- ⚙️ Configurable mute duration and pre-mute timing
- 📅 Ramadan-only mode option
- 🏢 Multi-tenant support for managing multiple accounts
- 📊 Prayer mute history tracking
- 🌐 Web interface for configuration

## Architecture

The project consists of two main components:

1. **Backend Scheduler** - A Node.js service that:
   - Fetches prayer times from Aladhan API
   - Monitors current time and mutes/unmutes zones
   - Stores prayer schedules and history in PostgreSQL

2. **Web Interface** - A Next.js application that:
   - Provides authentication and user management
   - Allows configuration of prayer schedules per zone
   - Shows prayer time previews and mute history

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Soundtrack Your Brand API token
- Render account (for deployment)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/brightears/syb_prayer_times.git
cd syb_prayer_times
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed initial data (optional):
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

## Configuration

### Prayer Time Calculation Methods

- **MWL** - Muslim World League
- **ISNA** - Islamic Society of North America
- **EGYPT** - Egyptian General Authority of Survey
- **MAKKAH** - Umm al-Qura University, Makkah
- **KARACHI** - University of Islamic Sciences, Karachi
- **TEHRAN** - Institute of Geophysics, University of Tehran
- **JAFARI** - Shia Ithna-Ashari, Leva Institute, Qum

### Juristic Methods

- **Shafi** - Used by Shafi, Maliki, and Hanbali schools
- **Hanafi** - Used by Hanafi school (affects Asr calculation)

### High Latitude Rules

For locations at higher latitudes where prayer times calculation can be challenging:
- **Middle of the Night**
- **One-Seventh of the Night**
- **Angle Based**

## API Integration

### Soundtrack Your Brand

The application uses GraphQL to communicate with SYB API:
- Fetches account and zone information
- Controls volume levels
- Requires API token with appropriate permissions

### Prayer Times (Aladhan API)

- Free API with no authentication required
- Provides accurate prayer times worldwide
- Supports various calculation methods

## Deployment

### Database (PostgreSQL on Render)

1. Create a PostgreSQL instance on Render
2. Copy the connection string to your environment variables

### Backend Scheduler (Render Background Worker)

1. Create a new Background Worker on Render
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build:backend`
4. Set start command: `npm run start:backend`
5. Add environment variables

### Web Application (Render Web Service)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build:web`
4. Set start command: `npm run start:web`
5. Add environment variables

## Usage

1. **Login** to the web interface with your credentials
2. **Select an account** (admin users can switch between accounts)
3. **Choose a sound zone** to configure
4. **Set location** for prayer time calculation
5. **Configure settings**:
   - Calculation method
   - Which prayers to observe
   - Mute duration
   - Volume levels
6. **Enable the schedule** to start automatic muting

## Security

- Passwords are hashed using bcrypt
- Sessions expire after 7 days
- API routes are protected with authentication
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary to Brightears.

## Support

For issues or questions, please open an issue on GitHub or contact the development team.