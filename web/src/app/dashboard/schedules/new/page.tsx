'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CALCULATION_METHODS = [
  { value: 'MWL', label: 'Muslim World League' },
  { value: 'ISNA', label: 'Islamic Society of North America' },
  { value: 'EGYPT', label: 'Egyptian General Authority of Survey' },
  { value: 'MAKKAH', label: 'Umm al-Qura University, Makkah' },
  { value: 'KARACHI', label: 'University of Islamic Sciences, Karachi' },
  { value: 'TEHRAN', label: 'Institute of Geophysics, University of Tehran' },
  { value: 'JAFARI', label: 'Shia Ithna-Ashari, Leva Institute, Qum' },
]

const JURISTIC_METHODS = [
  { value: 'SHAFI', label: 'Shafi (Standard)' },
  { value: 'HANAFI', label: 'Hanafi' },
]

const HIGH_LATITUDE_RULES = [
  { value: 'MIDDLE_OF_NIGHT', label: 'Middle of the Night' },
  { value: 'SEVENTH_OF_NIGHT', label: 'One-Seventh of the Night' },
  { value: 'ANGLE_BASED', label: 'Angle Based' },
]

const PRAYERS = [
  { value: 'fajr', label: 'Fajr' },
  { value: 'dhuhr', label: 'Dhuhr' },
  { value: 'asr', label: 'Asr' },
  { value: 'maghrib', label: 'Maghrib' },
  { value: 'isha', label: 'Isha' },
]

const TIMEZONES = [
  // GMT-8 to GMT-5
  { value: 'America/Los_Angeles', label: 'Los Angeles, USA (GMT-8)', offset: -8 },
  { value: 'America/Chicago', label: 'Chicago, USA (GMT-6)', offset: -6 },
  { value: 'America/Mexico_City', label: 'Mexico City (GMT-6)', offset: -6 },
  { value: 'America/New_York', label: 'New York, USA (GMT-5)', offset: -5 },
  { value: 'America/Toronto', label: 'Toronto, Canada (GMT-5)', offset: -5 },
  
  // GMT+0
  { value: 'Europe/London', label: 'London, UK (GMT+0)', offset: 0 },
  { value: 'Africa/Casablanca', label: 'Casablanca, Morocco (GMT+0)', offset: 0 },
  
  // GMT+1
  { value: 'Europe/Paris', label: 'Paris, France (GMT+1)', offset: 1 },
  { value: 'Europe/Berlin', label: 'Berlin, Germany (GMT+1)', offset: 1 },
  { value: 'Europe/Madrid', label: 'Madrid, Spain (GMT+1)', offset: 1 },
  { value: 'Europe/Rome', label: 'Rome, Italy (GMT+1)', offset: 1 },
  { value: 'Africa/Algiers', label: 'Algiers, Algeria (GMT+1)', offset: 1 },
  { value: 'Africa/Tunis', label: 'Tunis, Tunisia (GMT+1)', offset: 1 },
  { value: 'Africa/Lagos', label: 'Lagos, Nigeria (GMT+1)', offset: 1 },
  
  // GMT+2
  { value: 'Asia/Jerusalem', label: 'Jerusalem (GMT+2)', offset: 2 },
  { value: 'Asia/Beirut', label: 'Beirut, Lebanon (GMT+2)', offset: 2 },
  { value: 'Asia/Damascus', label: 'Damascus, Syria (GMT+2)', offset: 2 },
  { value: 'Asia/Amman', label: 'Amman, Jordan (GMT+2)', offset: 2 },
  { value: 'Africa/Cairo', label: 'Cairo, Egypt (GMT+2)', offset: 2 },
  { value: 'Africa/Tripoli', label: 'Tripoli, Libya (GMT+2)', offset: 2 },
  { value: 'Africa/Khartoum', label: 'Khartoum, Sudan (GMT+2)', offset: 2 },
  { value: 'Africa/Johannesburg', label: 'Johannesburg, South Africa (GMT+2)', offset: 2 },
  
  // GMT+3
  { value: 'Asia/Riyadh', label: 'Riyadh, Saudi Arabia (GMT+3)', offset: 3 },
  { value: 'Asia/Kuwait', label: 'Kuwait (GMT+3)', offset: 3 },
  { value: 'Asia/Qatar', label: 'Qatar (GMT+3)', offset: 3 },
  { value: 'Asia/Bahrain', label: 'Bahrain (GMT+3)', offset: 3 },
  { value: 'Asia/Baghdad', label: 'Baghdad, Iraq (GMT+3)', offset: 3 },
  { value: 'Asia/Istanbul', label: 'Istanbul, Turkey (GMT+3)', offset: 3 },
  { value: 'Europe/Moscow', label: 'Moscow, Russia (GMT+3)', offset: 3 },
  { value: 'Africa/Nairobi', label: 'Nairobi, Kenya (GMT+3)', offset: 3 },
  
  // GMT+3:30
  { value: 'Asia/Tehran', label: 'Tehran, Iran (GMT+3:30)', offset: 3.5 },
  
  // GMT+4
  { value: 'Asia/Dubai', label: 'Dubai, UAE (GMT+4)', offset: 4 },
  { value: 'Asia/Muscat', label: 'Muscat, Oman (GMT+4)', offset: 4 },
  
  // GMT+4:30
  { value: 'Asia/Kabul', label: 'Kabul, Afghanistan (GMT+4:30)', offset: 4.5 },
  
  // GMT+5
  { value: 'Asia/Karachi', label: 'Karachi, Pakistan (GMT+5)', offset: 5 },
  
  // GMT+5:30
  { value: 'Asia/Kolkata', label: 'Delhi/Mumbai, India (GMT+5:30)', offset: 5.5 },
  
  // GMT+6
  { value: 'Asia/Dhaka', label: 'Dhaka, Bangladesh (GMT+6)', offset: 6 },
  
  // GMT+7
  { value: 'Asia/Jakarta', label: 'Jakarta, Indonesia (GMT+7)', offset: 7 },
  { value: 'Asia/Bangkok', label: 'Bangkok, Thailand (GMT+7)', offset: 7 },
  
  // GMT+8
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur, Malaysia (GMT+8)', offset: 8 },
  { value: 'Asia/Singapore', label: 'Singapore (GMT+8)', offset: 8 },
  { value: 'Australia/Perth', label: 'Perth, Australia (GMT+8)', offset: 8 },
  
  // GMT+11
  { value: 'Australia/Sydney', label: 'Sydney, Australia (GMT+11)', offset: 11 },
  { value: 'Australia/Melbourne', label: 'Melbourne, Australia (GMT+11)', offset: 11 },
  
  // GMT+13
  { value: 'Pacific/Auckland', label: 'Auckland, New Zealand (GMT+13)', offset: 13 },
]

export default function NewSchedulePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingZones, setLoadingZones] = useState(false)
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([])
  const [accounts, setAccounts] = useState<Array<{ id: string; accountId: string; accountName: string }>>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [selectedSybAccountId, setSelectedSybAccountId] = useState('')
  
  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      console.log('Fetching accounts...')
      const res = await fetch('/api/accounts/list')
      console.log('Accounts API response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Accounts data:', data)
        setAccounts(data.accounts || [])
      } else {
        console.error('Failed to fetch accounts, status:', res.status)
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const [formData, setFormData] = useState({
    accountId: '',
    soundZoneId: '',
    soundZoneName: '',
    location: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    calculationMethod: 'ISNA',
    juristicMethod: 'SHAFI',
    highLatitudeRule: 'MIDDLE_OF_NIGHT',
    baselineVolume: 50,
    muteVolume: 0,
    preMuteMinutes: 0,
    muteDurationMinutes: 10,
    ramadanOnly: false,
    enabledPrayers: ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'],
  })

  const handleAccountChange = async (accountId: string) => {
    console.log('Account changed to:', accountId)
    console.log('Available accounts:', accounts)
    
    setFormData({ ...formData, accountId, soundZoneId: '', soundZoneName: '' })
    if (!accountId) {
      setZones([])
      setSelectedSybAccountId('')
      return
    }

    // Find the selected account to get its SYB account ID
    // Convert accountId to string for comparison since select values are strings
    const selectedAccount = accounts.find(acc => String(acc.id) === accountId)
    console.log('Selected account:', selectedAccount)
    
    if (!selectedAccount) {
      console.error('Account not found in accounts list')
      return
    }
    
    setSelectedSybAccountId(selectedAccount.accountId)
    setLoadingZones(true)
    console.log('Fetching zones for SYB account ID:', selectedAccount.accountId)
    console.log('API URL:', `/api/accounts/${selectedAccount.accountId}/zones`)
    
    try {
      const res = await fetch(`/api/accounts/${selectedAccount.accountId}/zones`)
      console.log('Zones API response status:', res.status)
      if (res.ok) {
        const data = await res.json()
        console.log('Zones data received:', data)
        setZones(data.zones || [])
      } else {
        const errorData = await res.text()
        console.error('Failed to load zones:', res.status, errorData)
        setError('Failed to load zones')
      }
    } catch (err) {
      console.error('Error fetching zones:', err)
      setError('Failed to load zones')
    } finally {
      setLoadingZones(false)
    }
  }

  const handleZoneChange = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId)
    setFormData({
      ...formData,
      soundZoneId: zoneId,
      soundZoneName: zone?.name || '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/dashboard/schedules')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create schedule')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Create Prayer Schedule</h1>
        <Link
          href="/dashboard/schedules"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to schedules
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-6 py-8 rounded-lg">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Account Selection */}
        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700">
            Account
          </label>
          <select
            id="account"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            value={formData.accountId}
            onChange={(e) => handleAccountChange(e.target.value)}
          >
            <option value="">Select an account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.accountName}
              </option>
            ))}
          </select>
        </div>

        {/* Zone Selection */}
        <div>
          <label htmlFor="zone" className="block text-sm font-medium text-gray-700">
            Sound Zone
          </label>
          <select
            id="zone"
            required
            disabled={!formData.accountId || loadingZones}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:bg-gray-100"
            value={formData.soundZoneId}
            onChange={(e) => handleZoneChange(e.target.value)}
          >
            <option value="">
              {loadingZones ? 'Loading zones...' : 'Select a zone'}
            </option>
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location (City, Country)
          </label>
          <input
            type="text"
            id="location"
            required
            placeholder="e.g., Dubai, UAE"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
            Timezone
          </label>
          <select
            id="timezone"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            value={formData.timeZone}
            onChange={(e) => setFormData({ ...formData, timeZone: e.target.value })}
          >
            <option value="">Select a timezone</option>
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>

        {/* Calculation Method */}
        <div>
          <label htmlFor="method" className="block text-sm font-medium text-gray-700">
            Calculation Method
          </label>
          <select
            id="method"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            value={formData.calculationMethod}
            onChange={(e) => setFormData({ ...formData, calculationMethod: e.target.value })}
          >
            {CALCULATION_METHODS.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </div>

        {/* Juristic Method */}
        <div>
          <label htmlFor="juristic" className="block text-sm font-medium text-gray-700">
            Juristic Method (Affects Asr time)
          </label>
          <select
            id="juristic"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            value={formData.juristicMethod}
            onChange={(e) => setFormData({ ...formData, juristicMethod: e.target.value })}
          >
            {JURISTIC_METHODS.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </div>

        {/* Volume Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="baseline" className="block text-sm font-medium text-gray-700">
              Music Volume When Not Praying (%)
            </label>
            <input
              type="number"
              id="baseline"
              min="0"
              max="100"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.baselineVolume}
              onChange={(e) => setFormData({ ...formData, baselineVolume: parseInt(e.target.value) })}
            />
            <p className="mt-1 text-xs text-gray-500">Regular music volume outside prayer times</p>
          </div>
          <div>
            <label htmlFor="mute" className="block text-sm font-medium text-gray-700">
              Music Volume During Prayer (%)
            </label>
            <input
              type="number"
              id="mute"
              min="0"
              max="100"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.muteVolume}
              onChange={(e) => setFormData({ ...formData, muteVolume: parseInt(e.target.value) })}
            />
            <p className="mt-1 text-xs text-gray-500">Set to 0 to mute music during prayers</p>
          </div>
        </div>

        {/* Timing Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="premute" className="block text-sm font-medium text-gray-700">
              Pre-mute Minutes
            </label>
            <input
              type="number"
              id="premute"
              min="0"
              max="30"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.preMuteMinutes}
              onChange={(e) => setFormData({ ...formData, preMuteMinutes: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Mute Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              min="1"
              max="60"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.muteDurationMinutes}
              onChange={(e) => setFormData({ ...formData, muteDurationMinutes: parseInt(e.target.value) })}
            />
          </div>
        </div>

        {/* Enabled Prayers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enabled Prayers
          </label>
          <div className="space-y-2">
            {PRAYERS.map(prayer => (
              <label key={prayer.value} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={formData.enabledPrayers.includes(prayer.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        enabledPrayers: [...formData.enabledPrayers, prayer.value],
                      })
                    } else {
                      setFormData({
                        ...formData,
                        enabledPrayers: formData.enabledPrayers.filter(p => p !== prayer.value),
                      })
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700">{prayer.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ramadan Only */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="ramadan"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={formData.ramadanOnly}
            onChange={(e) => setFormData({ ...formData, ramadanOnly: e.target.checked })}
          />
          <label htmlFor="ramadan" className="ml-2 text-sm text-gray-700">
            Only active during Ramadan
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href="/dashboard/schedules"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </div>
      </form>
    </div>
  )
}