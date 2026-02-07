'use client'

import { useState } from 'react'

interface ResumeData {
  name: string
  email: string
  phone: string
  skills: string[]
  experience: {
    role: string
    company: string
    duration: string
  }[]
  education: {
    degree: string
    school: string
    year: string
  }[]
  summary: string
}

export default function ResumeExtractor() {
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ResumeData | null>(null)

  const handleExtract = async () => {
    if (!resumeText.trim()) {
      setError('Please enter resume text')
      return
    }

    setLoading(true)
    setError(null)
    setExtractedData(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      })

      const data = await response.json()

      if (data.success) {
        setExtractedData(data.data)
      } else {
        throw new Error(data.error || 'Failed to extract data')
      }
    } catch (err: any) {
      console.error('Extraction error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setResumeText('')
    setExtractedData(null)
    setError(null)
  }

  return (
    <div className="card max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Resume Parser</h2>
        <p className="text-gray-600">
          Paste a resume text below to extract structured information using AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resume Content
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="input-field min-h-[400px] font-mono text-sm"
            placeholder="Paste resume text here..."
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleExtract}
              disabled={loading || !resumeText.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Extracting...' : 'Extract Data'}
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full overflow-y-auto max-h-[600px]">
          <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Extracted Data</h3>
          
          {loading && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="animate-pulse">Processing resume...</div>
            </div>
          )}

          {!loading && !extractedData && (
            <div className="text-center text-gray-400 py-20">
              No data extracted yet
            </div>
          )}

          {extractedData && (
            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Personal Info</h4>
                <div className="bg-white p-3 rounded shadow-sm">
                  <div className="grid grid-cols-1 gap-2">
                    <div><span className="font-medium">Name:</span> {extractedData.name}</div>
                    <div><span className="font-medium">Email:</span> {extractedData.email}</div>
                    <div><span className="font-medium">Phone:</span> {extractedData.phone}</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {extractedData.summary && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Summary</h4>
                  <div className="bg-white p-3 rounded shadow-sm text-sm">
                    {extractedData.summary}
                  </div>
                </div>
              )}

              {/* Skills */}
              {extractedData.skills && extractedData.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.skills.map((skill, i) => (
                      <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {extractedData.experience && extractedData.experience.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Experience</h4>
                  <div className="space-y-3">
                    {extractedData.experience.map((exp, i) => (
                      <div key={i} className="bg-white p-3 rounded shadow-sm border-l-4 border-blue-500">
                        <div className="font-bold">{exp.role}</div>
                        <div className="text-sm text-gray-600">{exp.company} • {exp.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {extractedData.education && extractedData.education.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Education</h4>
                  <div className="space-y-3">
                    {extractedData.education.map((edu, i) => (
                      <div key={i} className="bg-white p-3 rounded shadow-sm border-l-4 border-green-500">
                        <div className="font-bold">{edu.degree}</div>
                        <div className="text-sm text-gray-600">{edu.school} • {edu.year}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
