import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createScheduleSchema = z.object({
  accountId: z.string().min(1),
  soundZoneId: z.string().min(1),
  soundZoneName: z.string().min(1),
  location: z.string().min(1),
  timeZone: z.string().min(1),
  calculationMethod: z.string(),
  juristicMethod: z.string(),
  highLatitudeRule: z.string(),
  muteEnabled: z.boolean(),
  preMuteMinutes: z.number().min(0).max(60),
  postPrayerMinutes: z.number().min(0).max(60),
  ramadanOnly: z.boolean(),
  enabledPrayers: z.array(z.string()),
  prayerDurations: z.object({
    fajr: z.number().min(5).max(60),
    dhuhr: z.number().min(5).max(60),
    asr: z.number().min(5).max(60),
    maghrib: z.number().min(5).max(60),
    isha: z.number().min(5).max(60),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createScheduleSchema.parse(body)

    // Verify user has access to this account
    if (user.role === 'CLIENT' && user.accountId !== parseInt(data.accountId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create the schedule
    const schedule = await prisma.prayerSchedule.create({
      data: {
        accountId: parseInt(data.accountId),
        soundZoneId: data.soundZoneId,
        soundZoneName: data.soundZoneName,
        location: data.location,
        timeZone: data.timeZone,
        calculationMethod: data.calculationMethod as any,
        juristicMethod: data.juristicMethod as any,
        highLatitudeRule: data.highLatitudeRule as any,
        baselineVolume: 50, // Default baseline volume - will restore to original
        muteDuringPrayer: data.muteEnabled,
        muteVolume: data.muteEnabled ? 0 : 50, // If muting, set to 0, otherwise keep playing
        preMuteMinutes: data.preMuteMinutes,
        muteDurationMinutes: data.postPrayerMinutes, // Using this field for post-prayer buffer
        ramadanOnly: data.ramadanOnly,
        enabledPrayers: data.enabledPrayers,
        isActive: true,
        adjustments: data.prayerDurations, // Store prayer durations in the adjustments JSON field
      },
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    console.error('Create schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}