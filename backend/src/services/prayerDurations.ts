// Prayer duration calculator based on prayer type, method, and context

interface PrayerDurationOptions {
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  calculationMethod: string;
  dayOfWeek: number; // 0 = Sunday, 5 = Friday
  isRamadan?: boolean;
}

// Base durations in minutes for regular prayers
const BASE_DURATIONS = {
  fajr: 12,
  dhuhr: 15,
  asr: 10,
  maghrib: 8,
  isha: 18,
};

// Friday prayer adjustments
const FRIDAY_ADJUSTMENTS = {
  dhuhr: 30, // Jummah prayer with khutbah (sermon)
};

// Ramadan adjustments (Tarawih prayers)
const RAMADAN_ADJUSTMENTS: Partial<Record<string, number>> = {
  isha: 45, // Isha + Tarawih prayers
};

// Method-specific adjustments (some regions have longer/shorter customs)
const METHOD_ADJUSTMENTS: Record<string, Partial<Record<string, number>>> = {
  MAKKAH: {
    // Makkah tends to have longer prayers
    fajr: 15,
    isha: 20,
  },
  EGYPT: {
    // Egyptian method typically shorter
    fajr: 10,
    isha: 15,
  },
  JAFARI: {
    // Shia prayers may have different durations
    dhuhr: 20,
    maghrib: 15,
  },
};

export function calculatePrayerDuration(options: PrayerDurationOptions): number {
  const { prayer, calculationMethod, dayOfWeek, isRamadan } = options;
  
  // Start with base duration
  let duration = BASE_DURATIONS[prayer];
  
  // Apply method-specific adjustments
  if (METHOD_ADJUSTMENTS[calculationMethod]?.[prayer]) {
    duration = METHOD_ADJUSTMENTS[calculationMethod][prayer]!;
  }
  
  // Apply Friday prayer adjustment
  if (dayOfWeek === 5 && prayer === 'dhuhr') {
    duration = FRIDAY_ADJUSTMENTS.dhuhr;
  }
  
  // Apply Ramadan adjustments
  if (isRamadan && RAMADAN_ADJUSTMENTS[prayer]) {
    duration = RAMADAN_ADJUSTMENTS[prayer]!;
  }
  
  return duration;
}

// Get all prayer durations for a given context
export function getAllPrayerDurations(
  calculationMethod: string,
  dayOfWeek: number,
  isRamadan: boolean = false
): Record<string, number> {
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  const durations: Record<string, number> = {};
  
  prayers.forEach(prayer => {
    durations[prayer] = calculatePrayerDuration({
      prayer,
      calculationMethod,
      dayOfWeek,
      isRamadan,
    });
  });
  
  return durations;
}