'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: number
  email: string
  name: string
  role: string
}

export default function EditAccountPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    accountName: '',
    isActive: true,
  })
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
  })
  const [showAddUser, setShowAddUser] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAccount()
    fetchUsers()
  }, [])

  const fetchAccount = async () => {
    try {
      const res = await fetch(`/api/accounts/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setAccount(data.account)
        setFormData({
          accountName: data.account.accountName,
          isActive: data.account.isActive,
        })
      }
    } catch (err) {
      console.error('Failed to fetch account')
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/accounts/${params.id}/users`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      }
    } catch (err) {
      console.error('Failed to fetch users')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/accounts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/dashboard/accounts')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update account')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/accounts/${params.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      if (res.ok) {
        setShowAddUser(false)
        setNewUser({ email: '', name: '', password: '' })
        fetchUsers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add user')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/accounts/${params.id}/users/${userId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (err) {
      console.error('Failed to delete user')
    }
  }

  if (!account) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Account</h1>
        <Link
          href="/dashboard/accounts"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to accounts
        </Link>
      </div>

      <div className="space-y-6">
        {/* Account Details */}
        <form onSubmit={handleUpdate} className="bg-white shadow px-6 py-8 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Account Details</h2>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account ID
              </label>
              <p className="mt-1 text-sm text-gray-900">{account.accountId}</p>
            </div>

            <div>
              <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                id="accountName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                className="rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Account is active
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Client Users */}
        <div className="bg-white shadow px-6 py-8 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Client Users</h2>
            <button
              onClick={() => setShowAddUser(true)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Add User
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="mb-6 p-4 border rounded-md bg-gray-50">
              <h3 className="text-sm font-medium mb-3">New Client User</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Name"
                  required
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  minLength={8}
                  className="rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div className="mt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false)
                    setNewUser({ email: '', name: '', password: '' })
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1 text-sm border border-transparent rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-sm text-gray-500 text-center">
                      No users found. Add a user to allow client access.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}