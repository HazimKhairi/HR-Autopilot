// Contract Generator Component - PHASE 1
// Allows users to generate employment contracts using AI
'use client'

import { useState } from 'react'

interface ContractData {
  name?: string
  role?: string
  salary?: number
  country?: string
  effectiveDate?: string
  workLocation?: string
}

interface EmployeeData {
  id: number
  name: string
  email: string
  role: string
  salary: number
  country: string
  leaveBalance: number
}


export default function ContractGenerator() {
  const [useExisting, setUseExisting] = useState(true)
  const [email, setEmail] = useState('')
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }
  
  const [formData, setFormData] = useState<ContractData>({
    name: 'John Wick',
    role: 'AI Engineer',
    salary: 8000,
    country: 'Malaysia',
    effectiveDate: getTodayDate(),
    workLocation: 'Cyberjaya, Malaysia',
  })
  const [generatedContract, setGeneratedContract] = useState<string | null>(null)
  const [editableHtml, setEditableHtml] = useState<string>('')
  const [isPreview, setIsPreview] = useState<boolean>(true)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookupEmployee = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setLookupLoading(true)
    setError(null)
    setEmployeeData(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employee/by-email/${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.success) {
        setEmployeeData(data.employee)
        setError(null)
      } else {
        throw new Error(data.error || 'Employee not found')
      }
    } catch (err: any) {
      console.error('Employee lookup error:', err)
      setError(err.message)
      setEmployeeData(null)
    } finally {
      setLookupLoading(false)
    }
  }

  const generateContract = async () => {
    setLoading(true)
    setError(null)
    setGeneratedContract(null)

    try {
      const requestBody = useExisting
        ? { email: email.toLowerCase() }
        : { customData: formData }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contract/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContract(data.contract)
        setEditableHtml(data.contract || '')
        setIsPreview(true)
      } else {
        throw new Error(data.error || 'Failed to generate contract')
      }
    } catch (err: any) {
      console.error('Contract generation error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle input changes
  // This helper function updates our 'formData' state when a user types.
  // It copies the old state (...prev) and updates just the one field that changed.
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Contract Generator
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Automatically generate employment contracts with local labor laws
      </p>

      {/* Toggle: Use Existing Employee or Custom Data */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => {
            setUseExisting(true)
            setError(null)
          }}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            useExisting
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={{ borderRadius: '5px' }}
        >
          Use Existing Employee
        </button>
        <button
          onClick={() => {
            setUseExisting(false)
            setError(null)
          }}
          className={`flex-1 py-2 px-4 font-medium transition-colors ${
            !useExisting
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={{ borderRadius: '5px' }}
        >
          Custom Data
        </button>
      </div>

      {/* Input Form */}
      {useExisting ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && lookupEmployee()}
              className="input-field flex-1"
              placeholder="e.g., hazim@company.com"
            />
            <button
              onClick={lookupEmployee}
              disabled={lookupLoading}
              className="btn-secondary disabled:opacity-50"
            >
              {lookupLoading ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Try: hazim@company.com, sarah@company.com, or ahmad@company.com
          </p>

          {/* Employee Info Display */}
          {employeeData && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-800" style={{ borderRadius: '5px' }}>
              <p className="font-medium">{employeeData.name}</p>
              <p className="text-sm">{employeeData.role} • {employeeData.country}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              className="input-field"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => handleFormChange('role', e.target.value)}
              className="input-field"
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary</label>
            <input
              type="number"
              value={formData.salary}
              onChange={(e) => handleFormChange('salary', parseInt(e.target.value))}
              className="input-field"
              placeholder="8000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleFormChange('country', e.target.value)}
              className="input-field"
              placeholder="Malaysia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => handleFormChange('effectiveDate', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
            <input
              type="text"
              value={formData.workLocation}
              onChange={(e) => handleFormChange('workLocation', e.target.value)}
              className="input-field"
              placeholder="Cyberjaya, Malaysia"
            />
          </div>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={generateContract}
        disabled={loading || (useExisting && !employeeData)}
        className="btn-primary w-full mb-4 disabled:opacity-50"
      >
        {loading ? 'Generating Contract...' : 'Generate Contract with AI'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-300 p-3 text-red-800 text-sm mb-4" style={{ borderRadius: '5px' }}>
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Generated Contract Display */}
      {generatedContract && (
        <div>
          <h3 className="font-bold text-lg mb-2 text-gray-800">Generated Contract</h3>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setIsPreview(true)}
              className={`py-1 px-3 text-sm rounded ${isPreview ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setIsPreview(false)}
              className={`py-1 px-3 text-sm rounded ${!isPreview ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Edit
            </button>
          </div>

          {isPreview ? (
            <div
              className="bg-white border border-gray-300 p-4 overflow-auto max-h-96"
              style={{ borderRadius: '5px' }}
              dangerouslySetInnerHTML={{ __html: editableHtml }}
            />
          ) : (
            <textarea
              value={editableHtml}
              onChange={(e) => setEditableHtml(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded resize-none"
            />
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={async () => {
                if (!editableHtml) return
                setPdfLoading(true)
                try {
                  const filenameBase = (useExisting && employeeData && employeeData.name) || formData.name || 'employment-contract'
                  // send the current HTML (preview or edited HTML)
                  const htmlToSend = editableHtml

                  const pdfResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contract/render-pdf`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ html: htmlToSend, filename: filenameBase })
                  })

                  if (pdfResp.ok) {
                    const blob = await pdfResp.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${filenameBase.replace(/[^a-z0-9_-]/gi, '_')}.pdf`
                    a.click()
                    URL.revokeObjectURL(url)
                  } else {
                    console.error('PDF render failed', await pdfResp.text())
                  }
                } catch (err) {
                  console.error('Generate PDF error', err)
                } finally {
                  setPdfLoading(false)
                }
              }}
              disabled={pdfLoading}
              className="btn-primary"
            >
              {pdfLoading ? 'Generating PDF...' : 'Generate PDF'}
            </button>

            
          </div>
        </div>
      )}
    </div>
  )
}
