// Main Dashboard/Landing Page
'use client'

import Link from 'next/link'

export default function HomePage() {
  const phases = [
    {
      title: 'Contract Generator',
      description: 'Automatically generate employment contracts with local labor laws',
      href: '/contract',
      color: 'blue',
    },
    {
      title: 'HR Assistant',
      description: 'Ask questions about leave balance, policies, and more',
      href: '/chat',
      color: 'purple',
    },
    {
      title: 'Compliance Dashboard',
      description: 'Proactive monitoring for visa expirations and compliance issues',
      href: '/compliance',
      color: 'green',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Invisible HR
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI-powered HR automation for the modern workplace. Streamline contracts, 
          get instant answers, and stay compliant effortlessly.
        </p>
      </div>

      {/* Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {phases.map((phase, index) => (
          <Link
            key={phase.href}
            href={phase.href}
            className="card hover:shadow-xl transition-shadow cursor-pointer group"
          >
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-500">
                Phase {index + 1}
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-1 group-hover:text-blue-600 transition-colors">
                {phase.title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {phase.description}
            </p>
            <div className="text-blue-600 text-sm font-medium group-hover:underline">
              Open →
            </div>
          </Link>
        ))}
      </div>

      {/* System Features */}
      <div className="bg-white p-6" style={{ borderRadius: '5px' }}>
        <h3 className="font-bold text-xl mb-4 text-gray-800">System Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-50 p-4" style={{ borderRadius: '5px' }}>
            <div className="text-blue-600 font-bold mb-1">AI-Powered</div>
            <p className="text-gray-600">Using GPT-4o for intelligent responses</p>
          </div>
          <div className="bg-gray-50 p-4" style={{ borderRadius: '5px' }}>
            <div className="text-purple-600 font-bold mb-1">Function Calling</div>
            <p className="text-gray-600">Smart tool selection for accurate answers</p>
          </div>
          <div className="bg-gray-50 p-4" style={{ borderRadius: '5px' }}>
            <div className="text-green-600 font-bold mb-1">Proactive Alerts</div>
            <p className="text-gray-600">90-day advance compliance monitoring</p>
          </div>
        </div>
      </div>
    </div>
  )
}
