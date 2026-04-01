import React, { useState } from 'react';

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "Quantum Core initialized. Live Missouri pipeline synced. Awaiting directives, CEO." }]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/ai-analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ prompt: input })
      });

      const data = await response.json();
      setMessages([...newMessages, { role: "ai", text: data.response || "No response received." }]);
    } catch (error) {
      setMessages([...newMessages, { role: "ai", text: "ERROR: Connection to Quantum Core lost." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a192f] to-slate-900 p-6 font-sans text-slate-200 flex flex-col items-center">
      <div className="w-full max-w-4xl flex-grow flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden mt-10">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-black/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 tracking-tight">AI Underwriter</h2>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Status: Fully Armed</p>
          </div>
          <div className="h-3 w-3 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]"></div>
        </div>

        {/* Chat Feed */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6 flex flex-col">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === "user" ? "bg-cyan-600/20 border border-cyan-500/50 text-cyan-50 shadow-[0_0_15px_rgba(6,182,212,0.15)] rounded-br-none" : "bg-slate-800/50 border border-white/5 text-slate-300 rounded-bl-none font-light leading-relaxed whitespace-pre-wrap"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 border border-white/5 p-4 rounded-xl rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex space-x-4">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Command the AI (e.g., 'Find me the best ROI in MO')..."
              className="flex-grow bg-slate-900/50 border border-white/10 text-slate-200 p-4 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600"
            />
            <button 
              onClick={sendMessage}
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-8 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50 uppercase tracking-widest text-sm"
            >
              Execute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}