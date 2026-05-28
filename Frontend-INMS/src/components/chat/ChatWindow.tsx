import React, { useRef, useEffect } from 'react';
import { X, Send, Bot, User, Mic, MicOff } from 'lucide-react';
import useChatSession from './useChatSession';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ isOpen, onClose }) => {
  const {
    messages,
    inputMessage,
    isLoading,
    setInputMessage,
    sendMessage,
    clearHistory,
    checkForCriticalAlert,
    reloadHistory,
    suggestedPrompts
  } = useChatSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = React.useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      reloadHistory();
      inputRef.current.focus();
    }
  }, [isOpen, reloadHistory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void checkForCriticalAlert();
    }, 60000);

    const initialTimer = window.setTimeout(() => {
      void checkForCriticalAlert();
    }, 5000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(initialTimer);
    };
  }, [checkForCriticalAlert]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage();
  };

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const toggleVoiceInput = () => {
    if (!SpeechRecognition) {
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInputMessage(transcript);
      }
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[1200] w-96 h-[550px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-right-4 duration-300 sm:w-96 sm:h-[550px] max-sm:w-[90vw] max-sm:h-[70vh] max-sm:right-4 max-sm:bottom-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-blue-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI Assistant</h3>
            <p className="text-xs text-gray-600">History is saved on this browser.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
              aria-label="Clear chat history"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            aria-label="Close chat"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Bot size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">Welcome to INMS AI Assistant!</p>
            <p className="text-sm mt-2">Ask me about network nodes, failures, or system insights.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  disabled={isLoading}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors duration-200 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-green-500 to-blue-500'
                  : 'bg-gray-100'
              }`}>
                {message.type === 'user' ? (
                  <User size={12} className="text-white" />
                ) : (
                  <Bot size={12} className="text-gray-600" />
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[80%]">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100">
                <Bot size={12} className="text-gray-600" />
              </div>
              <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          {SpeechRecognition && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={isLoading}
              className={`p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
