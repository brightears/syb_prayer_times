# AI Assistant Instructions (CLAUDE.md)

This document provides context and guidelines for AI assistants working on the SYB Prayer Times project.

## Project Overview

SYB Prayer Times is a production application that automatically mutes music in commercial venues during Islamic prayer times. It integrates with Soundtrack Your Brand's API and serves real businesses with prayer time automation needs.

## Key Context

### Business Requirements
- Must handle multiple timezones accurately
- Prayer times must be precise (cultural sensitivity)
- System must be reliable (businesses depend on it)
- Client access must be simple and secure
- Support for Ramadan-specific scheduling

### Technical Constraints
- Soundtrack Your Brand API has rate limits
- Prayer calculations vary by region and method
- Must work across different latitudes
- Real-time scheduling with minute precision
- Multi-tenant architecture required

## Code Standards

### TypeScript
- Always use strict TypeScript
- Define interfaces for all data structures
- Avoid `any` types except for external APIs
- Use Zod for runtime validation

### React/Next.js
- Use Next.js App Router patterns
- Server components by default
- Client components only when needed
- Implement proper error boundaries
- Use Suspense for loading states

### Database
- Always use Prisma for queries
- Never use raw SQL
- Include proper indexes
- Handle cascade deletes carefully
- Migration safety is critical

### API Design
- RESTful routes for CRUD operations
- Consistent error responses
- Always validate input data
- Protected routes need authentication
- Return appropriate HTTP status codes

## Common Tasks

### Adding a New Prayer Calculation Method
1. Update Prisma enum `CalculationMethod`
2. Add to calculation method map in `prayerTimesApi.ts`
3. Update form options in schedule creation
4. Document the method in README

### Modifying Prayer Duration Logic
1. Edit `prayerDurations.ts` service
2. Consider regional variations
3. Test with different scenarios
4. Update architecture docs

### Adding New User Permissions
1. Consider Admin vs Client roles
2. Update middleware checks
3. Modify UI to show/hide features
4. Test both role types

## Important Patterns

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  logger.error('Descriptive message', { error, context });
  // Graceful degradation
}
```

### API Routes
```typescript
// Always check authentication
const user = await getSession();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validate input
const data = schema.parse(body);

// Check permissions
if (user.role === 'CLIENT' && resource.accountId !== user.accountId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Database Queries
```typescript
// Include only needed relations
const schedule = await prisma.prayerSchedule.findUnique({
  where: { id },
  include: {
    account: true,
    prayerTimes: {
      where: { date: today }
    }
  }
});
```

## Testing Checklist

Before implementing changes:
- [ ] Will this work across timezones?
- [ ] Does it handle Ramadan correctly?
- [ ] Are errors handled gracefully?
- [ ] Is the multi-tenant logic preserved?
- [ ] Will it scale with many schedules?

## Known Gotchas

1. **Timezone Handling**
   - Always store in UTC
   - Convert for display only
   - Use location timezone for calculations

2. **Prayer Time Edge Cases**
   - High latitude locations
   - Midnight sun/polar night
   - DST transitions

3. **SYB API Quirks**
   - Account IDs are base64 encoded
   - GraphQL requires specific query structure
   - Volume levels are 1-16, not percentage

4. **Deployment Issues**
   - Environment variables must match exactly
   - Build scripts must generate Prisma client
   - Dynamic routes must use consistent params

## Development Workflow

1. **Local Testing**
   ```bash
   npm run dev
   # Test with Render dashboard open
   # Check logs frequently
   ```

2. **Before Pushing**
   - Run `npm run typecheck`
   - Test both admin and client flows
   - Verify prayer calculations
   - Check responsive design

3. **Deployment**
   - Commits to main auto-deploy
   - Monitor Render dashboard
   - Check logs for errors
   - Verify schedules still run

## Debug Commands

```bash
# Check prayer times for location
curl "https://api.aladhan.com/v1/timingsByAddress?address=Dubai,UAE"

# Test database connection
npx prisma studio

# Verify environment variables
node -e "console.log(process.env.DATABASE_URL ? 'Set' : 'Not set')"

# Check TypeScript errors
npx tsc --noEmit
```

## Contact for Issues

- Technical: benorbe@brightears.com
- SYB API: Check their documentation
- Prayer calculations: Refer to Aladhan docs

## Future Considerations

When adding features, consider:
- Will this increase API calls significantly?
- Does it maintain backward compatibility?
- Is it culturally appropriate?
- Does it add complexity for clients?
- Will it work offline/degraded mode?

Remember: This is a production system serving real businesses. Reliability and accuracy are paramount.