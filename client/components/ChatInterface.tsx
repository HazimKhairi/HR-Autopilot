// Chat Interface Component - PHASE 2
// Floating chat panel available on all pages via layout.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, User, Send, Loader2 } from 'lucide-react'

interface Message {
  id: string
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
  const [isClient, setIsClient] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [email, setEmail] = useState('')
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleCloseChat = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsChatOpen(false)
      setIsClosing(false)
    }, 300)
  }

  const loginEmployee = async () => {
    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    setLookupLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/employee/by-email/${encodeURIComponent(email)}`
      )
      const data = await response.json()

      if (data.success) {
        setEmployeeData(data.employee)
        setError(null)
        setMessages([
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Hi ${data.employee.name}! I'm your HR Assistant. How can I help you today?`,
            timestamp: new Date().toISOString(),
          },
        ])
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

  const sendMessage = async () => {
    if (!input.trim() || !employeeData) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          email: employeeData.email,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAsk = (text: string) => {
    setInput(text)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (employeeData) {
        sendMessage()
      } else {
        loginEmployee()
      }
    }
  }

  if (!isClient) return null

  return (
    <>
      {/* Floating chat bubble */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#ff6b6b] shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 z-40"
          aria-label="Open AI chat"
        >
          <Bot size={24} className="text-white" />
        </button>
      )}

      {/* Chat panel */}
      {isChatOpen && (
        <div
          className={`fixed right-0 bottom-0 h-[70vh] w-full max-w-md bg-white shadow-2xl rounded-tl-lg flex flex-col overflow-hidden z-40 transition-all duration-300 ${
            isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-100 p-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff6b6b] flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-light text-gray-800">HR Assistant</h2>
                  <p className="text-xs text-gray-500 font-light">
                    {employeeData
                      ? `Logged in as ${employeeData.name}`
                      : 'Online • Ready to help'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseChat}
                className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200"
                aria-label="Close chat"
              >
                <X size={20} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!employeeData ? (
            /* Login step */
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 rounded-full bg-[#fff5f5] flex items-center justify-center mb-4">
                <Bot size={32} className="text-[#ff6b6b]" />
              </div>
              <h3 className="text-lg font-light text-gray-800 mb-2">Welcome!</h3>
              <p className="text-sm text-gray-500 font-light text-center mb-6">
                Enter your employee email to start chatting with your HR Assistant.
              </p>
              <div className="w-full max-w-xs space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-[#ff6b6b]/50 focus:ring-1 focus:ring-[#ff6b6b]/20 transition-all duration-200 font-light text-gray-800"
                  placeholder="e.g. hazim@company.com"
                />
                <button
                  onClick={loginEmployee}
                  disabled={lookupLoading}
                  className="w-full py-3 bg-[#ff6b6b] text-white rounded-lg font-light hover:bg-[#ff5252] transition-all duration-200 disabled:opacity-50"
                >
                  {lookupLoading ? 'Verifying...' : 'Start Chat'}
                </button>
                {error && (
                  <p className="text-sm text-red-500 text-center font-light">{error}</p>
                )}
                <p className="text-xs text-gray-400 text-center font-light">
                  Try: hazim@company.com, sarah@company.com, ahmad@company.com
                </p>
              </div>
            </div>
          ) : (
            /* Chat area */
            <>
              <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex max-w-[85%]">
                        {msg.role === 'assistant' && (
                          <div className="mr-2 mt-1 flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-[#ff6b6b] flex items-center justify-center">
                              <Bot size={12} className="text-white" />
                            </div>
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-white border border-gray-200 rounded-tr-none'
                              : 'bg-[#fff5f5] border border-[#ffebeb] rounded-tl-none'
                          }`}
                        >
                          <p className="text-sm text-gray-800 font-light whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                        {msg.role === 'user' && (
                          <div className="ml-2 mt-1 flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <User size={12} className="text-gray-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex max-w-[85%]">
                        <div className="mr-2 mt-1 flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-[#ff6b6b] flex items-center justify-center">
                            <Bot size={12} className="text-white" />
                          </div>
                        </div>
                        <div className="rounded-2xl px-4 py-3 bg-[#fff5f5] border border-[#ffebeb]">
                          <div className="flex gap-1">
                            <div
                              className="w-2 h-2 bg-[#ff6b6b] rounded-full animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-[#ff6b6b] rounded-full animate-bounce"
                              style={{ animationDelay: '150ms' }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-[#ff6b6b] rounded-full animate-bounce"
                              style={{ animationDelay: '300ms' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Quick suggestions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex-shrink-0">
                  <div className="flex flex-wrap gap-2">
                    {[
                      'How much leave do I have?',
                      'What is the lunch policy?',
                      'Tell me about remote work policy',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => handleQuickAsk(q)}
                        className="text-xs px-3 py-1.5 bg-[#fff5f5] border border-[#ffebeb] rounded-full text-gray-600 hover:border-[#ff6b6b]/30 transition-all duration-200 font-light"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="border-t border-gray-100 p-4 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:border-[#ff6b6b]/30 focus:ring-1 focus:ring-[#ff6b6b]/20 transition-all duration-200 font-light text-gray-800 text-sm"
                    rows={1}
                    maxLength={500}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="p-3 rounded-full bg-[#ff6b6b] text-white hover:bg-[#ff5252] transition-all duration-200 disabled:opacity-50 flex-shrink-0"
                    aria-label="Send message"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
