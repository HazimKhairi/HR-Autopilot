// app/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, ChevronRight, Sparkles, Pin, FileText, Paperclip, ChevronLeft } from 'lucide-react';

type Message = {
    id: number;
    text: string;
    isUser: boolean;
};

type QuickAsk = {
    id: number;
    text: string;
};

type ApiMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type UploadedFile = {
    id: string;
    name: string;
    size: number;
    type: string;
    preview?: string;
};

export default function HomePage() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        // { id: 1, text: 'Hello! How can I assist you today?', isUser: false },
        // { id: 2, text: 'I need help with your services', isUser: true },
        // { id: 3, text: 'Of course! I can help you with that. Our platform offers various AI-powered tools to streamline your workflow. What specifically are you looking for?', isUser: false },
        // { id: 4, text: 'Can you explain the pricing?', isUser: true },
        // { id: 5, text: 'We offer tiered pricing plans starting from $29/month for basic features. The professional plan at $79/month includes advanced analytics and priority support.', isUser: false },
        // { id: 6, text: 'That sounds reasonable. What about customization options?', isUser: true },
        // { id: 7, text: 'Our enterprise plan includes full customization and API access. Would you like me to connect you with our sales team for a personalized demo?', isUser: false },
    ]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const chatMessagesRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const chatPanelRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const callLLMApi = async (userMessage: string, conversationHistory: Message[]) => {
        setIsLoading(true);

        try {
            //convert messages to API format
            const apiMessages: ApiMessage[] = conversationHistory.map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text
            }));

            //add the new user message
            apiMessages.push({
                role: 'user',
                content: userMessage
            });

            const response = await fetch('/api/chat', {  //backend endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    //add auth token from login system
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                    messages: apiMessages,
                    //add user context for personalized responses
                    userContext: {
                        userId: localStorage.getItem('userId'),
                        employeeId: localStorage.getItem('employeeId'),
                        //if have any hr specific context
                    }
                }),
            });

            const data = await response.json();
            return data.response; // Adjust based on your backend response structure

        } catch (error) {
            console.error('LLM API Error:', error);
            return "I'm having trouble connecting right now. Please try again.";
        } finally {
            setIsLoading(false);
        }
    };

    const quickAskOptions: QuickAsk[] = [
        { id: 1, text: 'Annual leaves i have?' },
        { id: 2, text: 'Can I expense coworking space?"' },
        { id: 3, text: 'When am I eligible for promotion?"' },
        { id: 4, text: 'Can I carry forward m annual leaves?' },
        { id: 5, text: 'What benefits am I eligible for?' },
        { id: 6, text: 'What is the dress code policy?' },
        { id: 7, text: 'Request payslip' },
    ];

    const scrollToBottom = () => {
        if (isClient) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        setIsClient(true);
        scrollToBottom();
    }, [messages]);

    const handleCloseChat = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsChatOpen(false);
            setIsClosing(false);
        }, 300);
    };

    const handleSend = async () => {
        if (message.trim() === '' && uploadedFiles.length === 0) return;

        let finalMessage = message;

        //uploaded file info
        if (uploadedFiles.length > 0) {
            const fileList = uploadedFiles.map(file => file.name).join(', ');
            finalMessage = message.trim()
                ? `${message}\n\nAttachments: ${fileList}`
                : `Uploaded files: ${fileList}`;
        }

        const newMessage: Message = {
            id: messages.length + 1,
            text: finalMessage,
            isUser: true,
        };

        setMessages([...messages, newMessage]);
        const currentMessage = message;
        setMessage('');
        setUploadedFiles([]);//auto clear file after send


        const aiResponseText = await callLLMApi(currentMessage, messages);

        const aiResponse: Message = {
            id: messages.length + 2,
            text: aiResponseText,
            isUser: false,
        };
        setMessages(prev => [...prev, aiResponse]);
    };

    const handleQuickAsk = async (text: string) => {
        const newMessage: Message = {
            id: messages.length + 1,
            text,
            isUser: true,
        };

        setMessages([...messages, newMessage]);

        const aiResponseText = await callLLMApi(text, messages);

        const aiResponse: Message = {
            id: messages.length + 2,
            text: aiResponseText,
            isUser: false,
        };
        setMessages(prev => [...prev, aiResponse]);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        if (textareaRef.current && isClient) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
            setIsExpanded(textareaRef.current.scrollHeight > 40);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles: UploadedFile[] = Array.from(files).map((file, index) => ({
            id: `${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);
        e.target.value = ''; //reset input
    };

    const removeFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

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

                                        {/*send button*/}
                                        <button
                                            onClick={handleSend}
                                            disabled={!message.trim() && uploadedFiles.length === 0}
                                            className={`p-3 rounded-full transition-all duration-200 ${message.trim() || uploadedFiles.length > 0
                                                ? 'bg-[#ff6b6b] hover:bg-[#ff5252] shadow-md hover:shadow-lg hover:scale-105'
                                                : 'bg-gray-200 cursor-not-allowed'
                                                }`}
                                            aria-label="Send message"
                                        >
                                            <Send size={20} className="text-white" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 font-light mt-3 text-center">
                                        Press Enter to send • Shift+Enter for new line • Max 500 characters
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
  @keyframes slideIn {
    from {
      transform: translateY(100%) translateX(0);
      opacity: 0;
    }
    to {
      transform: translateY(0) translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateY(0) translateX(0);
      opacity: 1;
    }
    to {
      transform: translateY(100%) translateX(0);
      opacity: 0;
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
  
  .animate-slideOut {
    animation: slideOut 0.3s ease-in;
  }
  
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #ffcccc;
    border-radius: 3px;
    transition: background 0.2s;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #ffb3b3;
  }
  
  .overflow-y-auto:first-of-type::-webkit-scrollbar-thumb {
    background: #ffd6d6;
  }
  
  .overflow-y-auto:first-of-type::-webkit-scrollbar-thumb:hover {
    background: #ffb3b3;
  }
  
  textarea {
    font-family: inherit;
    line-height: 1.5;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  button, textarea, div {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
  
  .animate-bounce {
    animation: bounce 1s infinite;
  }
`}} />
        </div>
    );
}