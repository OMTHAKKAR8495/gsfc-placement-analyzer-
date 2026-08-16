import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, RefreshCw, Bug, CheckCircle } from 'lucide-react';

export default function AIBugChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '👋 Hello! I am the **GSFC AI Placement Assistant & Bug Resolver**.\n\nHow can I help you with portal navigation, resume parsing, corporate drives, or technical bug reports today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Why Sign In button failed?',
    'How to parse PDF resume & check ATS?',
    'How do recruiters post requirements?',
    'Report a portal bug'
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/interview/support-chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });
      const data = await res.json();

      const botMsg = {
        sender: 'bot',
        text: data.reply || 'Thank you for your message! Our AI support team is inspecting the issue.',
        actions: data.suggestedActions || []
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `🤖 **AI Support:** I received your message ("${textToSend}"). If you're experiencing a Sign In issue, please click the **Sign In / Portal** button at top right to access Quick Demo Login shortcuts.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-3 bg-gradient-to-r from-blue-900 via-indigo-900 to-amber-600 hover:from-blue-800 hover:to-amber-500 text-white rounded-full text-xs font-black shadow-2xl backdrop-blur-xl border border-white/30 flex items-center gap-2.5 transition-all hover:scale-105 group"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full absolute -top-1 -right-1 border border-blue-900 animate-pulse"></span>
            </div>
            <span>AI Bug & Placement Assistant</span>
          </button>
        )}
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 max-h-[85vh] h-[540px] bg-white/95 rounded-3xl border border-slate-200 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-slate-900 animate-fadeIn">
          {/* Window Header */}
          <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="font-black text-xs">GSFC AI Assistant & Bug Resolver</h3>
                <div className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LLM API Powered
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompt Pills Bar */}
          <div className="p-2.5 bg-slate-100/90 border-b border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 text-blue-900 text-[10px] font-black rounded-lg shrink-0 whitespace-nowrap shadow-sm transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs font-semibold bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-blue-900 text-white rounded-br-none shadow-md font-bold'
                      : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none shadow-sm font-medium'
                  }`}
                >
                  {msg.text}

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSendMessage(act)}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-black rounded-md transition-all"
                        >
                          {act} &rarr;
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-black text-[11px]">
                    YOU
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-blue-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-500 font-bold flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-900" /> AI is analyzing query...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI Assistant about bugs or portal help..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl shadow-md disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
