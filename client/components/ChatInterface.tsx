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
        <div className="min-h-screen bg-[#fafafa] p-4 md:p-8">

            {isClient && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#ff6b6b] shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 z-40"
                    aria-label="Open AI chat"
                >
                    <Bot size={24} className="text-white" />
                </button>
            )}

            {/*chat panel overlay*/}
            {isChatOpen && isClient && (
                <>
                    {/*animation*/}
                    <div
                        className={`fixed inset-0 z-30 pointer-events-none transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'
                            }`}
                        onClick={handleCloseChat}
                    />

                    {/*chat panel*/}
                    <div
                        ref={chatPanelRef}
                        className={`fixed right-0 bottom-0 h-[70vh] w-full max-w-[45%] bg-white shadow-2xl rounded-tl-lg flex flex-col overflow-hidden z-40 ${isClosing ? 'animate-slideOut' : 'animate-slideIn'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/*chat panel header*/}
                        <div className="flex-shrink-0 border-b border-gray-100 p-4 bg-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#ff6b6b] flex items-center justify-center">
                                        <Bot size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-light text-gray-800">AI Assistant</h2>
                                        <p className="text-xs text-gray-500 font-light">Online • Ready to help</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseChat}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 group"
                                    aria-label="Close chat"
                                >
                                    <X size={20} className="text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-all duration-200" />
                                </button>
                            </div>
                        </div>

                        {/*content area*/}
                        <div className="flex flex-1 overflow-hidden">
                            {/*left sidebar*/}
                            <div
                                ref={sidebarRef}
                                className={`transition-all duration-300 ${isSidebarOpen ? 'w-1/3' : 'w-0'} bg-[#fff5f5] border-r border-[#ffebeb] flex flex-col overflow-hidden`}
                            >
                                {isSidebarOpen && (
                                    <>
                                        <div className="p-2 flex-shrink-0">
                                            <div className="mb-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Sparkles size={16} className="text-[#ff6b6b]" />
                                                        <h3 className="text-sm font-light text-gray-600">Quick Ask</h3>
                                                    </div>
                                                    <button
                                                        onClick={toggleSidebar}
                                                        className="p-1 hover:bg-white rounded-md transition-colors duration-200"
                                                        aria-label="Collapse sidebar"
                                                    >
                                                        <ChevronLeft size={16} className="text-gray-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                                            <div className="space-y-3">
                                                {quickAskOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => handleQuickAsk(option.text)}
                                                        className="w-full text-left p-3 rounded-lg bg-white border border-[#ffebeb] hover:border-[#ff6b6b]/30 hover:bg-white transition-all duration-200 group"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-light text-gray-700 group-hover:text-gray-900 line-clamp-2">
                                                                {option.text}
                                                            </span>
                                                            <ChevronRight size={14} className="text-gray-400 group-hover:text-[#ff6b6b] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-2" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4 border-t border-[#ffebeb] mt-auto">
                                            <div className="text-xs text-gray-500 font-light">
                                                <p>AI responses may vary</p>
                                                <p className="mt-1">Privacy focused</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {!isSidebarOpen && (
                                <button
                                    onClick={toggleSidebar}
                                    className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-[#ff6b6b] text-white p-2 rounded-r-md shadow-md hover:bg-[#ff5252] transition-all duration-200 hover:scale-105"
                                    aria-label="Expand sidebar"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            )}

                            {/*main chat area*/}
                            <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? '' : ''}`}>
                                <div
                                    ref={chatMessagesRef}
                                    className="flex-1 overflow-y-auto p-4 pr-3"
                                >
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className="flex max-w-[85%]">
                                                    {!msg.isUser && (
                                                        <div className="mr-2 mt-1 flex-shrink-0">
                                                            <div className="w-6 h-6 rounded-full bg-[#ff6b6b] flex items-center justify-center">
                                                                <Bot size={12} className="text-white" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div
                                                        className={`rounded-2xl px-4 py-3 transition-all duration-200 ${msg.isUser
                                                            ? 'bg-white border border-gray-200 rounded-tr-none hover:border-gray-300'
                                                            : 'bg-[#fff5f5] border border-[#ffebeb] rounded-tl-none hover:border-[#ff6b6b]/30'
                                                            }`}
                                                    >
                                                        <p className="text-gray-800 font-light whitespace-pre-wrap">{msg.text}</p>
                                                    </div>
                                                    {msg.isUser && (
                                                        <div className="ml-2 mt-1 flex-shrink-0">
                                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                                <User size={12} className="text-gray-600" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start">
                                                <div className="flex max-w-[85%]">
                                                    <div className="mr-2 mt-1 flex-shrink-0">
                                                        <div className="w-6 h-6 rounded-full bg-[#ff6b6b] flex items-center justify-center">
                                                            <Bot size={12} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl px-4 py-3 bg-[#fff5f5] border border-[#ffebeb]">
                                                        <div className="flex gap-1">
                                                            <div className="w-2 h-2 bg-[#ff6b6b] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                            <div className="w-2 h-2 bg-[#ff6b6b] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                            <div className="w-2 h-2 bg-[#ff6b6b] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                {/*uploaded files display*/}
                                {uploadedFiles.length > 0 && (
                                    <div className="border-t border-gray-100 px-4 pt-3 flex-shrink-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Pin size={14} className="text-[#ff6b6b]" />
                                            <span className="text-xs text-gray-600 font-light">Attachments ({uploadedFiles.length})</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {uploadedFiles.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center gap-2 bg-[#fff5f5] border border-[#ffebeb] rounded-lg px-3 py-2 group hover:border-[#ff6b6b]/30 transition-all duration-200"
                                                >
                                                    <FileText size={14} className="text-[#ff6b6b]" />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-light text-gray-700 truncate max-w-[150px]">
                                                            {file.name}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-light">
                                                            {formatFileSize(file.size)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(file.id)}
                                                        className="ml-1 p-1 hover:bg-white rounded transition-colors duration-200"
                                                        aria-label={`Remove ${file.name}`}
                                                    >
                                                        <X size={12} className="text-gray-500 hover:text-gray-700" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 p-4 flex-shrink-0">
                                    <div className="flex items-end gap-3">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            multiple
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                                        />

                                        {/*file upload button*/}
                                        <button
                                            onClick={handleFileButtonClick}
                                            className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:scale-105 flex-shrink-0"
                                            aria-label="Upload file"
                                        >
                                            <Paperclip size={20} className="text-gray-600" />
                                        </button>

                                        {/*message textarea*/}
                                        <div className="flex-1 relative">
                                            <textarea
                                                ref={textareaRef}
                                                value={message}
                                                onChange={handleTextareaChange}
                                                onKeyDown={handleKeyPress}
                                                placeholder="Type your message here..."
                                                className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 resize-none focus:outline-none focus:border-[#ff6b6b]/30 focus:ring-1 focus:ring-[#ff6b6b]/20 transition-all duration-200 font-light text-gray-800"
                                                rows={1}
                                                maxLength={500}
                                            />
                                            {isClient && (
                                                <div className="absolute right-3 bottom-3">
                                                    <span className="text-xs text-gray-400 font-light">
                                                        {message.length}/500
                                                    </span>
                                                </div>
                                            )}
                                        </div>

          <div className="mt-2 text-xs text-gray-500">
            Try asking: "How much leave do I have?" or "What is the lunch policy?"
          </div>
        </>
      )}
    </div>
  )
}
