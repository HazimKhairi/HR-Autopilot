'use client'

import { useState } from 'react'

interface Resume {
  id: number
  phone: string | null
  summary: string | null
  skills: string[]
  experience: Array<{ role: string; company: string; duration: string }>
  education: Array<{ degree: string; school: string; year: string }>
  resumeText: string | null
  extractedData?: any | null
  createdAt?: string | null
}

interface EmployeeProfile {
  id: number
  name: string
  email: string
  role: string
  salary: number
  country: string
  leaveBalance: number
  visaExpiryDate: string | null
  createdAt: string
}

interface ProfileData {
  profile: EmployeeProfile
  resume: Resume | null
}

export default function EmployeeProfile() {
  const [email, setEmail] = useState('')
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResumeForm, setShowResumeForm] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [savingResume, setSavingResume] = useState(false)

  const fetchProfile = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile/by-email/${encodeURIComponent(email)}`
      )
      const data = await response.json()

      if (data.success) {
        setProfileData(data)
        setError(null)
      } else {
        throw new Error(data.error || 'Profile not found')
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err)
      setError(err.message)
      setProfileData(null)
    } finally {
      setLoading(false)
    }
  }

  const saveResume = async () => {
    if (!profileData || !resumeText.trim()) {
      setError('Please enter resume text')
      return
    }

    setSavingResume(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/profile/${profileData.profile.id}/resume`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText,
            phone: '',
            summary: '',
            skills: [],
            experience: [],
            education: [],
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        setResumeText('')
        setShowResumeForm(false)
        // Refetch profile to get updated resume
        fetchProfile()
        alert('Resume saved successfully!')
      } else {
        throw new Error(data.error || 'Failed to save resume')
      }
    } catch (err: any) {
      console.error('Resume save error:', err)
      setError(err.message)
    } finally {
      setSavingResume(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Employee Profiles</h1>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Search by Email
          </label>
          <div className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter employee email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && fetchProfile()}
            />
            <button
              onClick={fetchProfile}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {/* Profile Display */}
        {profileData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-200">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800">
                      {profileData.profile.name}
                    </h2>
                    <p className="text-gray-600 text-lg">{profileData.profile.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Employee ID</p>
                    <p className="text-2xl font-bold text-blue-600">
                      #{profileData.profile.id}
                    </p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Email
                    </p>
                    <p className="text-lg text-gray-800 break-all">
                      {profileData.profile.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Country
                    </p>
                    <p className="text-lg text-gray-800">
                      {profileData.profile.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Salary (Monthly)
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      ${profileData.profile.salary.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      Leave Balance
                    </p>
                    <p className="text-lg font-semibold text-blue-600">
                      {profileData.profile.leaveBalance} days
                    </p>
                  </div>
                  {profileData.profile.visaExpiryDate && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                        Visa Expiry Date
                      </p>
                      <p className="text-lg text-gray-800">
                        {new Date(profileData.profile.visaExpiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Resume Section */}
                <div className="border-t-2 border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">Resume</h3>
                    <button
                      onClick={() => setShowResumeForm(!showResumeForm)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition"
                    >
                      {showResumeForm ? 'Cancel' : 'Upload Resume'}
                    </button>
                  </div>

                  {showResumeForm && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Resume Text
                      </label>
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your resume here..."
                        rows={10}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                      <button
                        onClick={saveResume}
                        disabled={savingResume}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
                      >
                        {savingResume ? 'Saving...' : 'Save Resume'}
                      </button>
                    </div>
                  )}

                  {profileData.resume ? (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                      <p className="text-sm text-gray-600 mb-4">
                        Resume uploaded on{' '}
                        {profileData.resume.createdAt ? new Date(profileData.resume.createdAt).toLocaleDateString() : ''}
                      </p>
                      {profileData.resume?.phone && (
                        <p className="text-gray-800 mb-2">
                          <span className="font-semibold">Phone:</span> {profileData.resume?.phone}
                        </p>
                      )}
                      {profileData.resume?.summary && (
                        <p className="text-gray-800 mb-4">
                          <span className="font-semibold">Summary:</span> {profileData.resume?.summary}
                        </p>
                      )}
                      {profileData.resume?.skills && profileData.resume.skills.length > 0 && (
                        <div className="mb-4">
                          <p className="font-semibold text-gray-800 mb-2">Skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {profileData.resume!.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profileData.resume?.experience && profileData.resume.experience.length > 0 && (
                        <div className="mb-4">
                          <p className="font-semibold text-gray-800 mb-2">Experience:</p>
                          <ul className="list-disc ml-5 space-y-3 text-sm text-gray-800">
                            {profileData.resume!.experience.map((exp, idx) => (
                              <li key={idx}>
                                <div className="font-semibold">{exp.role} — {exp.company}</div>
                                <div className="text-gray-600 text-xs">{exp.duration}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {profileData.resume?.education && profileData.resume.education.length > 0 && (
                        <div className="mb-4">
                          <p className="font-semibold text-gray-800 mb-2">Education:</p>
                          <ul className="list-disc ml-5 space-y-2 text-sm text-gray-800">
                            {profileData.resume!.education.map((edu, idx) => (
                              <li key={idx}>
                                <div className="font-semibold">{edu.degree}</div>
                                <div className="text-gray-600 text-xs">{edu.school} • {edu.year}</div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Full resume display removed to avoid duplication */}

                      {profileData.resume?.extractedData && (
                        <div className="mt-4 bg-white border border-gray-200 p-3 rounded">
                          <p className="font-semibold mb-2">Extracted Data</p>
                          {typeof profileData.resume.extractedData === 'object' ? (
                            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(profileData.resume.extractedData, null, 2)}</pre>
                          ) : (
                            <p className="text-sm text-gray-800">{String(profileData.resume.extractedData)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">No resume uploaded yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Side Summary Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-md p-6 sticky top-8">
                <h3 className="text-xl font-bold mb-6">Quick Info</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-blue-100 text-sm uppercase tracking-wide">Role</p>
                    <p className="text-lg font-semibold">{profileData.profile.role}</p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm uppercase tracking-wide">
                      Salary (Monthly)
                    </p>
                    <p className="text-2xl font-bold">
                      ${profileData.profile.salary.toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-blue-400">
                    <p className="text-blue-100 text-sm uppercase tracking-wide">
                      Leave Available
                    </p>
                    <p className="text-3xl font-bold">{profileData.profile.leaveBalance}</p>
                    <p className="text-blue-100 text-xs">days remaining</p>
                  </div>
                  <div className="pt-4 border-t border-blue-400">
                    <p className="text-blue-100 text-sm uppercase tracking-wide mb-2">
                      Resume Status
                    </p>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        profileData.resume
                          ? 'bg-green-400 text-green-900'
                          : 'bg-yellow-400 text-yellow-900'
                      }`}
                    >
                      {profileData.resume ? '✓ Uploaded' : '⚠ Pending'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!profileData && !loading && !error && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">
              Enter an employee email to view their profile
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
