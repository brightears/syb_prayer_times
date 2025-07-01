import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getSession()
  
  if (!user) {
    redirect('/login')
  }

  // Get statistics based on user role
  let stats = {
    totalSchedules: 0,
    activeSchedules: 0,
    totalAccounts: 0,
    todayMutes: 0,
  }

  if (user.role === 'ADMIN') {
    // Admin sees all data
    stats.totalSchedules = await prisma.prayerSchedule.count()
    stats.activeSchedules = await prisma.prayerSchedule.count({ where: { isActive: true } })
    stats.totalAccounts = await prisma.account.count()
    stats.todayMutes = await prisma.muteHistory.count({
      where: {
        mutedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  } else if (user.accountId) {
    // Client sees only their account data
    stats.totalSchedules = await prisma.prayerSchedule.count({ 
      where: { accountId: user.accountId } 
    })
    stats.activeSchedules = await prisma.prayerSchedule.count({ 
      where: { accountId: user.accountId, isActive: true } 
    })
    stats.todayMutes = await prisma.muteHistory.count({
      where: {
        schedule: { accountId: user.accountId },
        mutedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Welcome, {user.name || user.email}!
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Schedules
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.totalSchedules}
            </dd>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Schedules
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.activeSchedules}
            </dd>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Accounts
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stats.totalAccounts}
              </dd>
            </div>
          </div>
        )}

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Today's Mutes
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.todayMutes}
            </dd>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex space-x-4">
          <Link
            href="/dashboard/schedules"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
          >
            Manage Schedules
          </Link>
          {user.role === 'ADMIN' && (
            <Link
              href="/dashboard/accounts"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Manage Accounts
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Prayer Times Status</h2>
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-500">
              {stats.activeSchedules === 0 
                ? "No active schedules. Create a schedule to start pausing music during prayer times."
                : `You have ${stats.activeSchedules} active schedule(s) monitoring prayer times.`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}