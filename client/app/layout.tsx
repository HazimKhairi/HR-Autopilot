// Root Layout Component for Next.js 14 App Router
// This wraps all pages and provides global settings

import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'

// Use Inter font from Google Fonts
const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Invisible HR - AI-Powered HR Automation',
  description: 'Hackathon MVP for automated HR workflows with AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-blue-600">
                Invisible HR
              </h1>
              <p className="text-sm text-gray-600">
                AI-Powered HR Automation
              </p>
            </div>
          </div>
        </header>

        {/* Navigation Menu */}
        <Navigation />

        {/* Main Content */}
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm">
              Built for Deriv Hackathon 2026
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
