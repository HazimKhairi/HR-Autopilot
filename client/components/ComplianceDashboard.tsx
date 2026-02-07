// Compliance Dashboard Component - PHASE 3
// Displays proactive alerts for visa expirations and compliance issues
'use client'

import { useState, useEffect } from 'react'

interface ComplianceAlert {
  employeeId: number
  employeeName: string
  role: string
  country: string
  expiryDate: string
  daysUntilExpiry: number
  severity: 'critical' | 'warning' | 'info'
  message: string
  actionRequired: string
}

interface ComplianceSummary {
  totalAlerts: number
  critical: number
  warnings: number
  info: number
}

export default function ComplianceDashboard() {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([])
  const [summary, setSummary] = useState<ComplianceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch compliance data on component mount
  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/compliance/check`)
      const data = await response.json()

      if (data.success) {
        setAlerts(data.alerts)
        setSummary(data.summary)
      } else {
        throw new Error(data.error || 'Failed to fetch compliance data')
      }
    } catch (err: any) {
      console.error('Compliance fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get color classes based on severity
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'warning':
        return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'info':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴 CRITICAL'
      case 'warning':
        return '🟠 WARNING'
      case 'info':
        return '🔵 INFO'
      default:
        return severity.toUpperCase()
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Compliance Intelligence
        </h2>
        <button
          onClick={fetchComplianceData}
          className="btn-secondary text-sm"
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Proactive monitoring for visa expirations and compliance issues
      </p>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 p-3 text-center" style={{ borderRadius: '5px' }}>
            <p className="text-2xl font-bold text-gray-800">{summary.totalAlerts}</p>
            <p className="text-xs text-gray-600">Total Alerts</p>
          </div>
          <div className="bg-red-100 p-3 text-center" style={{ borderRadius: '5px' }}>
            <p className="text-2xl font-bold text-red-800">{summary.critical}</p>
            <p className="text-xs text-red-600">Critical</p>
          </div>
          <div className="bg-orange-100 p-3 text-center" style={{ borderRadius: '5px' }}>
            <p className="text-2xl font-bold text-orange-800">{summary.warnings}</p>
            <p className="text-xs text-orange-600">Warnings</p>
          </div>
          <div className="bg-blue-100 p-3 text-center" style={{ borderRadius: '5px' }}>
            <p className="text-2xl font-bold text-blue-800">{summary.info}</p>
            <p className="text-xs text-blue-600">Info</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8 text-gray-500">
          <p>Loading compliance data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-300 p-4 text-red-800" style={{ borderRadius: '5px' }}>
          <p className="font-medium">Error loading compliance data:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Alerts List */}
      {!loading && !error && alerts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-green-600 font-medium text-lg">All Clear!</p>
          <p className="text-gray-600 text-sm mt-2">
            No compliance issues found. All visas are valid for the next 90 days.
          </p>
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`border p-4 ${getSeverityStyles(alert.severity)}`}
              style={{ borderRadius: '5px' }}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{alert.employeeName}</p>
                  <p className="text-sm opacity-75">{alert.role} • {alert.country}</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-white bg-opacity-50" style={{ borderRadius: '5px' }}>
                  {alert.severity.toUpperCase()}
                </span>
              </div>

              <p className="font-medium mb-2">{alert.message}</p>
              
              <div className="flex justify-between items-center text-sm">
                <p>
                  Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                </p>
                <p className="font-medium">{alert.actionRequired}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
