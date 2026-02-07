// Chat Interface Component - PHASE 2
// Provides a conversational UI for employees to ask HR questions
'use client'

import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface EmployeeData {
  id: number
  name: string
  email: string
  role: string
}

export default function ChatInterface() {
  // STATE: This is where we store data that changes over time.
  // When state updates, React re-renders (updates) the UI.
  const [email, setEmail] = useState('') // The user's input email
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null) // Logged-in user info
  const [messages, setMessages] = useState<Message[]>([]) // List of chat messages
  const [input, setInput] = useState('') // Current message being typed
  const [loading, setLoading] = useState(false) // Is the simple AI thinking?
  const [lookupLoading, setLookupLoading] = useState(false) // Are we verifying the email?
  const [error, setError] = useState<string | null>(null) // Any error messages to show

  const loginEmployee = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setLookupLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employee/by-email/${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.success) {
        setEmployeeData(data.employee)
        setError(null)
        setMessages([{
          role: 'assistant',
          content: `Hi ${data.employee.name}! I'm your HR Assistant. How can I help you today?`,
          timestamp: new Date().toISOString(),
        }])
      } else {
        throw new Error(data.error || 'Employee not found')
      }
    } catch (err: any) {
      console.error('Employee login error:', err)
      setError(err.message)
      setEmployeeData(null)
    } finally {
      setLookupLoading(false)
    }
  }

  // Send message to backend chat API
  const sendMessage = async () => {
    if (!input.trim() || !employeeData) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    // Add user message to chat
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call backend chat API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          email: employeeData.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // Handle Enter key press
  // This lets users hit "Enter" to send, instead of clicking the button.
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter usually means new line, so we ignore it
      e.preventDefault() // Stop the default action (like adding a new line)
      if (employeeData) {
        sendMessage()
      } else {
        loginEmployee()
      }
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        HR Assistant Chat
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Ask me about your leave balance, company policies, or any HR questions!
      </p>

      {/* Employee Login Section */}
      {!employeeData ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your email to start chatting
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input-field flex-1"
              placeholder="e.g., hazim@company.com"
            />
            <button
              onClick={loginEmployee}
              disabled={lookupLoading}
              className="btn-primary disabled:opacity-50"
            >
              {lookupLoading ? 'Verifying...' : 'Start Chat'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Try: hazim@company.com, sarah@company.com, or ahmad@company.com
          </p>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-800 text-sm" style={{ borderRadius: '5px' }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Employee Info Banner */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200" style={{ borderRadius: '5px' }}>
            <p className="text-sm text-blue-800">
              Logged in as: <span className="font-medium">{employeeData.name}</span> ({employeeData.role})
            </p>
          </div>

          {/* Chat Messages Area */}
          <div className="h-96 overflow-y-auto bg-gray-50 p-4 mb-4 space-y-3" style={{ borderRadius: '5px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                  style={{ borderRadius: '5px' }}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2" style={{ borderRadius: '5px' }}>
                  <p className="text-gray-600">Thinking...</p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your question here..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Try asking: "How much leave do I have?" or "What is the lunch policy?"
          </div>
        </>
      )}
    </div>
  )
}
