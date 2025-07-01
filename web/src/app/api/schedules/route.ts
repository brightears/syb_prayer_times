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
  baselineVolume: z.number().min(0).max(100),
  muteVolume: z.number().min(0).max(100),
  preMuteMinutes: z.number().min(0).max(60),
  muteDurationMinutes: z.number().min(1).max(120),
  ramadanOnly: z.boolean(),
  enabledPrayers: z.array(z.string()),
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
        baselineVolume: data.baselineVolume,
        muteDuringPrayer: true,
        muteVolume: data.muteVolume,
        preMuteMinutes: data.preMuteMinutes,
        muteDurationMinutes: data.muteDurationMinutes,
        ramadanOnly: data.ramadanOnly,
        enabledPrayers: data.enabledPrayers,
        isActive: true,
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