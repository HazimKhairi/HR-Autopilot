'use client'

import ResumeExtractor from '@/components/ResumeExtractor'

export default function ResumePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Resume Extraction
        </h1>
        <p className="mt-2 text-gray-600">
          Parse and structure resume data automatically.
        </p>
      </div>

      <ResumeExtractor />
    </div>
  )
}
