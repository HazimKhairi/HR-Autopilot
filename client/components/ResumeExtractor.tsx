'use client'

import { useState, useRef } from 'react'

interface WorkExperience {
  title: string
  company: string
  duration: string
  description?: string
}

interface Education {
  degree: string
  school: string
  year?: string
}

interface ResumeData {
  fullName: string
  email: string
  phone: string
  location?: string
  workExperience: WorkExperience[]
  education: Education[]
  skills: string[]
  certifications?: string[]
}

export default function ResumeExtractor() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ResumeData | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile)
        setError(null)
        setData(null)
      } else {
        setError('Please upload a PDF file')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setData(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/resume/extract`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to extract data')
      }

      setData(result.data)
    } catch (err: any) {
      console.error('Extraction error:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setData(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="card max-w-5xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Resume Parser</h2>
        <p className="text-gray-600">
          Upload a PDF resume to extract structured data automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Upload */}
        <div className="space-y-6">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging ? 'border-blue-600 bg-blue-100' : 
              file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
              id="resume-upload"
            />
            <label htmlFor="resume-upload" className="cursor-pointer block">
              <div className="text-5xl mb-4">📄</div>
              {file ? (
                <div>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-gray-700">
                    {isDragging ? 'Drop PDF here' : 'Click or Drag PDF here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Max 10MB</p>
                </div>
              )}
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all ${
                !file || loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : 'Extract Data'}
            </button>
            
            {file && (
              <button
                onClick={handleClear}
                className="px-4 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 min-h-[500px] overflow-y-auto">
          {!data && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-4">🔍</span>
              <p>Extracted data will appear here</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-blue-500 space-y-4">
               <div className="animate-pulse flex flex-col items-center">
                 <div className="h-4 bg-blue-200 rounded w-3/4 mb-3"></div>
                 <div className="h-4 bg-blue-200 rounded w-1/2 mb-3"></div>
                 <div className="h-4 bg-blue-200 rounded w-5/6"></div>
               </div>
               <p className="text-sm text-gray-500">Analyzing document structure...</p>
            </div>
          )}

          {data && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header Info */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-bold text-gray-900">{data.fullName}</h3>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <p>📧 {data.email}</p>
                  <p>📱 {data.phone}</p>
                  {data.location && <p>📍 {data.location}</p>}
                </div>
              </div>

              {/* Experience */}
              {data.workExperience.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 p-1 rounded">💼</span> Work Experience
                  </h4>
                  <div className="space-y-4">
                    {data.workExperience.map((exp, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{exp.title}</p>
                            <p className="text-sm text-gray-600">{exp.company}</p>
                          </div>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {exp.duration}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="bg-green-100 text-green-700 p-1 rounded">🎓</span> Education
                  </h4>
                  <div className="space-y-3">
                    {data.education.map((edu, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                        <p className="font-medium text-gray-900">{edu.degree}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{edu.school}</span>
                          <span>{edu.year}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {data.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="bg-purple-100 text-purple-700 p-1 rounded">⚡</span> Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.skills.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 text-sm rounded-md border border-purple-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {data.certifications && data.certifications.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="bg-yellow-100 text-yellow-700 p-1 rounded">📜</span> Certifications
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 bg-white p-3 rounded-lg border border-gray-100">
                    {data.certifications.map((cert, i) => (
                      <li key={i}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
