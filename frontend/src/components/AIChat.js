import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'SV-1500 Kingdom AI initialized. How can I assist your acquisitions today?' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // SECURITY PROTOCOL: Pulling the API key from the hidden .env vault. 
  // There is NO hardcoded key here.
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      if (!API_KEY) {
         throw new Error("API Key missing. Check your .env file and Vercel settings.");
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: input }] }]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to communicate with AI.");
      }

      const aiText = data.candidates[0].content.parts[0].text;
      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error('AI Error:', error);
      toast.error(error.message || 'AI connection failed. Check console.');
      setMessages([...newMessages, { role: 'assistant', content: 'SYSTEM ERROR: Connection to AI failed. Verify your API key.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] hover:scale-110 transition-transform z-40 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Bot size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">SV-1500 Kingdom AI</h3>
                <p className="text-zinc-500 text-xs">Quantum Underwriter</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-primary text-white rounded-br-sm' 
                    : 'bg-white/5 border border-white/5 text-zinc-300 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-bl-sm flex space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask AI to analyze a market..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-white text-black rounded-xl hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChat;