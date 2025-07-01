'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  
  const [formData, setFormData] = useState({
    accountId: '',
    accountName: '',
    isActive: true,
  })

  const validateAccount = async () => {
    if (!formData.accountId) return

    setValidating(true)
    setValidationMessage('')
    
    try {
      const res = await fetch('/api/accounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: formData.accountId }),
      })

      const data = await res.json()
      
      if (res.ok && data.valid) {
        setValidationMessage(`✓ Valid account: ${data.accountName}`)
        setFormData({ ...formData, accountName: data.accountName })
      } else {
        setValidationMessage('✗ Invalid account ID or unable to connect to SYB')
      }
    } catch (err) {
      setValidationMessage('✗ Failed to validate account')
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/dashboard/accounts')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create account')
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
        <h1 className="text-2xl font-semibold text-gray-900">Add SYB Account</h1>
        <Link
          href="/dashboard/accounts"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to accounts
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-6 py-8 rounded-lg">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <div className="bg-blue-50 rounded-md p-4">
          <p className="text-sm text-blue-800">
            Enter the Soundtrack Your Brand account ID. This should be provided by your SYB account manager
            or found in your SYB dashboard URL.
          </p>
        </div>

        {/* Account ID */}
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
            SYB Account ID
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="accountId"
              required
              placeholder="e.g., account_abc123"
              className="flex-1 rounded-l-md border-gray-300 focus:border-primary focus:ring-primary sm:text-sm"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            />
            <button
              type="button"
              onClick={validateAccount}
              disabled={validating || !formData.accountId}
              className="inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {validating ? 'Validating...' : 'Validate'}
            </button>
          </div>
          {validationMessage && (
            <p className={`mt-2 text-sm ${
              validationMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'
            }`}>
              {validationMessage}
            </p>
          )}
        </div>

        {/* Account Name */}
        <div>
          <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
            Account Name
          </label>
          <input
            type="text"
            id="accountName"
            required
            placeholder="e.g., My Restaurant Chain"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            value={formData.accountName}
            onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
          />
          <p className="mt-1 text-sm text-gray-500">
            This will be auto-filled if you validate the account ID
          </p>
        </div>

        {/* Active Status */}
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

        <div className="flex justify-end space-x-3">
          <Link
            href="/dashboard/accounts"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  )
}