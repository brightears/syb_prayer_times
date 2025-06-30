import { PrismaClient, PrayerSchedule, Prayer } from '@prisma/client';
import { scheduleJob } from 'node-schedule';
import { startOfDay, addDays, isWithinInterval, parseISO, format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import logger from '../lib/logger';
import { prisma } from '../lib/prisma';
import { fetchPrayerTimes, fetchMonthlyPrayerTimes } from './prayerTimesApi';
import { muteZone, unmuteZone, getZoneVolume } from './soundtrackApi';

interface ActiveMute {
  scheduleId: number;
  prayer: Prayer;
  volumeBefore: number;
  mutedAt: Date;
}

const activeMutes = new Map<string, ActiveMute>();

async function fetchAndStorePrayerTimes(schedule: PrayerSchedule, date: Date) {
  const timings = await fetchPrayerTimes({
    location: schedule.location,
    latitude: schedule.latitude ?? undefined,
    longitude: schedule.longitude ?? undefined,
    date,
    calculationMethod: schedule.calculationMethod,
    juristicMethod: schedule.juristicMethod,
    highLatitudeRule: schedule.highLatitudeRule,
    adjustments: schedule.adjustments as Record<string, number> | undefined,
  });

  if (!timings) {
    logger.error('Failed to fetch prayer times', { scheduleId: schedule.id, date });
    return null;
  }

  const dateInZone = toZonedTime(date, schedule.timeZone);
  const dateStr = format(dateInZone, 'yyyy-MM-dd');

  const parsePrayerTime = (timeStr: string): Date | null => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerTimeInZone = new Date(dateInZone);
    prayerTimeInZone.setHours(hours, minutes, 0, 0);
    return fromZonedTime(prayerTimeInZone, schedule.timeZone);
  };

  const prayerTime = await prisma.prayerTime.upsert({
    where: {
      scheduleId_date: {
        scheduleId: schedule.id,
        date: startOfDay(date),
      },
    },
    update: {
      fajr: parsePrayerTime(timings.Fajr),
      sunrise: parsePrayerTime(timings.Sunrise),
      dhuhr: parsePrayerTime(timings.Dhuhr),
      asr: parsePrayerTime(timings.Asr),
      sunset: parsePrayerTime(timings.Sunset),
      maghrib: parsePrayerTime(timings.Maghrib),
      isha: parsePrayerTime(timings.Isha),
      imsak: parsePrayerTime(timings.Imsak),
      midnight: parsePrayerTime(timings.Midnight),
      fetchedAt: new Date(),
    },
    create: {
      scheduleId: schedule.id,
      date: startOfDay(date),
      fajr: parsePrayerTime(timings.Fajr),
      sunrise: parsePrayerTime(timings.Sunrise),
      dhuhr: parsePrayerTime(timings.Dhuhr),
      asr: parsePrayerTime(timings.Asr),
      sunset: parsePrayerTime(timings.Sunset),
      maghrib: parsePrayerTime(timings.Maghrib),
      isha: parsePrayerTime(timings.Isha),
      imsak: parsePrayerTime(timings.Imsak),
      midnight: parsePrayerTime(timings.Midnight),
    },
  });

  return prayerTime;
}

async function isRamadan(date: Date): Promise<boolean> {
  // This is a simplified check. In production, you'd want to use a proper
  // Hijri calendar library or API to accurately determine Ramadan dates
  // For now, we'll assume Ramadan dates are stored in the database or
  // fetched from an Islamic calendar API
  
  // TODO: Implement proper Ramadan date checking
  return false;
}

async function shouldMuteForPrayer(
  schedule: PrayerSchedule, 
  prayer: Prayer, 
  now: Date
): Promise<boolean> {
  const enabledPrayers = schedule.enabledPrayers as string[];
  
  if (!enabledPrayers.includes(prayer.toLowerCase())) {
    return false;
  }

  if (schedule.ramadanOnly) {
    const isInRamadan = await isRamadan(now);
    if (!isInRamadan) {
      return false;
    }
  }

  return true;
}

async function muteForPrayer(schedule: PrayerSchedule, prayer: Prayer) {
  const muteKey = `${schedule.soundZoneId}-${prayer}`;
  
  if (activeMutes.has(muteKey)) {
    logger.warn('Zone already muted for prayer', { 
      soundZoneId: schedule.soundZoneId, 
      prayer 
    });
    return;
  }

  try {
    const currentVolume = await getZoneVolume(schedule.soundZoneId);
    
    if (currentVolume === null) {
      throw new Error('Failed to get current volume');
    }

    const volumeBefore = currentVolume;
    const targetVolume = schedule.muteDuringPrayer ? schedule.muteVolume : volumeBefore;

    if (currentVolume !== targetVolume) {
      const success = await muteZone(schedule.soundZoneId);
      
      if (success !== null) {
        const muteRecord = await prisma.muteHistory.create({
          data: {
            scheduleId: schedule.id,
            prayer,
            mutedAt: new Date(),
            volumeBefore,
            volumeAfter: targetVolume,
            success: true,
          },
        });

        activeMutes.set(muteKey, {
          scheduleId: schedule.id,
          prayer,
          volumeBefore,
          mutedAt: new Date(),
        });

        logger.info('Muted zone for prayer', {
          soundZoneId: schedule.soundZoneId,
          prayer,
          volumeBefore,
          targetVolume,
        });

        // Schedule unmute
        setTimeout(async () => {
          await unmuteForPrayer(schedule, prayer);
        }, schedule.muteDurationMinutes * 60 * 1000);
      }
    }
  } catch (error) {
    logger.error('Failed to mute zone', {
      soundZoneId: schedule.soundZoneId,
      prayer,
      error,
    });

    await prisma.muteHistory.create({
      data: {
        scheduleId: schedule.id,
        prayer,
        mutedAt: new Date(),
        volumeBefore: 0,
        volumeAfter: 0,
        success: false,
        errorMessage: String(error),
      },
    });
  }
}

async function unmuteForPrayer(schedule: PrayerSchedule, prayer: Prayer) {
  const muteKey = `${schedule.soundZoneId}-${prayer}`;
  const activeMute = activeMutes.get(muteKey);

  if (!activeMute) {
    logger.warn('No active mute found', { 
      soundZoneId: schedule.soundZoneId, 
      prayer 
    });
    return;
  }

  try {
    const restoreVolume = schedule.baselineVolume || activeMute.volumeBefore;
    const success = await unmuteZone(schedule.soundZoneId, restoreVolume);

    if (success) {
      await prisma.muteHistory.updateMany({
        where: {
          scheduleId: schedule.id,
          prayer,
          unmutedAt: null,
        },
        data: {
          unmutedAt: new Date(),
        },
      });

      activeMutes.delete(muteKey);

      logger.info('Unmuted zone after prayer', {
        soundZoneId: schedule.soundZoneId,
        prayer,
        restoredVolume: restoreVolume,
      });
    }
  } catch (error) {
    logger.error('Failed to unmute zone', {
      soundZoneId: schedule.soundZoneId,
      prayer,
      error,
    });
  }
}

async function checkPrayerTimes() {
  try {
    const now = new Date();
    const schedules = await prisma.prayerSchedule.findMany({
      where: { isActive: true },
      include: {
        prayerTimes: {
          where: {
            date: startOfDay(now),
          },
        },
      },
    });

    for (const schedule of schedules) {
      let prayerTime = schedule.prayerTimes[0];

      // Fetch prayer times if not available for today
      if (!prayerTime) {
        prayerTime = await fetchAndStorePrayerTimes(schedule, now);
        if (!prayerTime) continue;
      }

      // Check each prayer
      const prayers: Array<{ name: Prayer; time: Date | null }> = [
        { name: Prayer.FAJR, time: prayerTime.fajr },
        { name: Prayer.DHUHR, time: prayerTime.dhuhr },
        { name: Prayer.ASR, time: prayerTime.asr },
        { name: Prayer.MAGHRIB, time: prayerTime.maghrib },
        { name: Prayer.ISHA, time: prayerTime.isha },
      ];

      for (const { name, time } of prayers) {
        if (!time) continue;

        const muteStart = new Date(time.getTime() - schedule.preMuteMinutes * 60 * 1000);
        const muteEnd = new Date(time.getTime() + schedule.muteDurationMinutes * 60 * 1000);

        const shouldMute = isWithinInterval(now, { start: muteStart, end: muteEnd });
        const muteKey = `${schedule.soundZoneId}-${name}`;
        const isCurrentlyMuted = activeMutes.has(muteKey);

        if (shouldMute && !isCurrentlyMuted) {
          const shouldProceed = await shouldMuteForPrayer(schedule, name, now);
          if (shouldProceed) {
            await muteForPrayer(schedule, name);
          }
        } else if (!shouldMute && isCurrentlyMuted) {
          await unmuteForPrayer(schedule, name);
        }
      }
    }
  } catch (error) {
    logger.error('Error in prayer time check', { error });
  }
}

async function dailyPrayerTimesFetch() {
  try {
    const schedules = await prisma.prayerSchedule.findMany({
      where: { isActive: true },
    });

    const today = new Date();
    const tomorrow = addDays(today, 1);

    for (const schedule of schedules) {
      await fetchAndStorePrayerTimes(schedule, today);
      await fetchAndStorePrayerTimes(schedule, tomorrow);
    }

    logger.info('Daily prayer times fetch completed');
  } catch (error) {
    logger.error('Error in daily prayer times fetch', { error });
  }
}

export function startScheduler() {
  // Check prayer times every minute
  const minuteJob = scheduleJob('* * * * *', checkPrayerTimes);
  
  // Fetch prayer times daily at 2 AM
  const dailyJob = scheduleJob('0 2 * * *', dailyPrayerTimesFetch);

  // Initial fetch
  dailyPrayerTimesFetch();

  logger.info('Prayer times scheduler started');

  return {
    stop: () => {
      minuteJob.cancel();
      dailyJob.cancel();
      logger.info('Prayer times scheduler stopped');
    },
  };
}