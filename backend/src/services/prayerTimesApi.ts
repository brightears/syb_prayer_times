import axios from 'axios';
import { format } from 'date-fns';
import type { CalculationMethod, JuristicMethod, HighLatitudeRule } from '@prisma/client';
import logger from '../lib/logger';

const ALADHAN_API_URL = 'https://api.aladhan.com/v1';

interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

interface AladhanResponse {
  code: number;
  status: string;
  data: {
    timings: AladhanTimings;
    date: {
      gregorian: {
        date: string;
      };
    };
  };
}

const calculationMethodMap: Record<CalculationMethod, number> = {
  [CalculationMethod.MWL]: 3,
  [CalculationMethod.ISNA]: 2,
  [CalculationMethod.EGYPT]: 5,
  [CalculationMethod.MAKKAH]: 4,
  [CalculationMethod.KARACHI]: 1,
  [CalculationMethod.TEHRAN]: 7,
  [CalculationMethod.JAFARI]: 0,
};

const juristicMethodMap: Record<JuristicMethod, number> = {
  [JuristicMethod.SHAFI]: 0,
  [JuristicMethod.HANAFI]: 1,
};

const highLatitudeRuleMap: Record<HighLatitudeRule, number> = {
  [HighLatitudeRule.MIDDLE_OF_NIGHT]: 1,
  [HighLatitudeRule.SEVENTH_OF_NIGHT]: 2,
  [HighLatitudeRule.ANGLE_BASED]: 3,
};

export interface PrayerTimesOptions {
  location?: string;
  latitude?: number;
  longitude?: number;
  date: Date;
  calculationMethod: CalculationMethod;
  juristicMethod: JuristicMethod;
  highLatitudeRule: HighLatitudeRule;
  adjustments?: Record<string, number>;
}

export async function fetchPrayerTimes(options: PrayerTimesOptions): Promise<AladhanTimings | null> {
  try {
    const dateStr = format(options.date, 'dd-MM-yyyy');
    const method = calculationMethodMap[options.calculationMethod];
    const school = juristicMethodMap[options.juristicMethod];
    const latitudeAdjustmentMethod = highLatitudeRuleMap[options.highLatitudeRule];

    let url: string;
    const params: Record<string, any> = {
      method,
      school,
      latitudeAdjustmentMethod,
    };

    if (options.adjustments) {
      const tune = Object.values(options.adjustments).join(',');
      params.tune = tune;
    }

    if (options.latitude && options.longitude) {
      url = `${ALADHAN_API_URL}/timings/${dateStr}`;
      params.latitude = options.latitude;
      params.longitude = options.longitude;
    } else if (options.location) {
      url = `${ALADHAN_API_URL}/timingsByAddress/${dateStr}`;
      params.address = options.location;
    } else {
      throw new Error('Either coordinates or location must be provided');
    }

    logger.debug('Fetching prayer times', { url, params });

    const response = await axios.get<AladhanResponse>(url, { params });

    if (response.data.code === 200) {
      return response.data.data.timings;
    } else {
      logger.error('Aladhan API error', { response: response.data });
      return null;
    }
  } catch (error) {
    logger.error('Failed to fetch prayer times', { error, options });
    return null;
  }
}

export async function fetchMonthlyPrayerTimes(
  options: Omit<PrayerTimesOptions, 'date'> & { year: number; month: number }
): Promise<Map<string, AladhanTimings>> {
  try {
    const method = calculationMethodMap[options.calculationMethod];
    const school = juristicMethodMap[options.juristicMethod];
    const latitudeAdjustmentMethod = highLatitudeRuleMap[options.highLatitudeRule];

    let url: string;
    const params: Record<string, any> = {
      method,
      school,
      latitudeAdjustmentMethod,
      month: options.month,
      year: options.year,
    };

    if (options.adjustments) {
      const tune = Object.values(options.adjustments).join(',');
      params.tune = tune;
    }

    if (options.latitude && options.longitude) {
      url = `${ALADHAN_API_URL}/calendar`;
      params.latitude = options.latitude;
      params.longitude = options.longitude;
    } else if (options.location) {
      url = `${ALADHAN_API_URL}/calendarByAddress`;
      params.address = options.location;
    } else {
      throw new Error('Either coordinates or location must be provided');
    }

    logger.debug('Fetching monthly prayer times', { url, params });

    const response = await axios.get(url, { params });
    const timingsMap = new Map<string, AladhanTimings>();

    if (response.data.code === 200 && Array.isArray(response.data.data)) {
      response.data.data.forEach((day: any) => {
        const date = day.date.gregorian.date;
        timingsMap.set(date, day.timings);
      });
    }

    return timingsMap;
  } catch (error) {
    logger.error('Failed to fetch monthly prayer times', { error, options });
    return new Map();
  }
}