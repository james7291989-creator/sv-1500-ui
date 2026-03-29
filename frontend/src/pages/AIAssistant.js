import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, BrainCircuit, Calculator, Scale, Loader2, Activity } from 'lucide-react';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'SV-1500 Quantum Core Online. I am your active PropTech Underwriter. Awaiting instructions.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activePersona, setActivePersona] = useState('underwriter');
  const messagesEndRef = useRef(null);

  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userText = input;
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      if (!API_KEY) throw new Error("API Key Vault locked. Check Vercel settings.");

      let systemPrompt = "You are the SV-1500 Quantum AI, an elite real estate investment assistant.";
      if (activePersona === 'underwriter') systemPrompt += " Analyze deals using the 70% rule (ARV * 0.70 - repairs - wholesale fee = MAO).";
      if (activePersona === 'rehab') systemPrompt += " You are an expert GC. Estimate rehab costs line-by-line.";
      if (activePersona === 'legal') systemPrompt += " You are a real estate strategist. Focus on contracts and closing.";

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userText}` }] }] })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "Failed to communicate with AI.");

      const aiText = data.candidates[0].content.parts[0].text;
      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: `SYSTEM ERROR: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const personas = [
    { id: 'underwriter', name: 'Deal Underwriter', icon: BrainCircuit, desc: 'Calculates ARV & MAO' },
    { id: 'rehab', name: 'Rehab Estimator', icon: Calculator, desc: 'Line-item repair costs' },
    { id: 'legal', name: 'Strategy & Escrow', icon: Scale, desc: 'Closing & Contracts' }
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700 pb-6 relative overflow-hidden">
      
      {/* LIVE ANIMATIONS: Moving Orbs */}
      <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_6s_ease-in-out_infinite] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite_reverse] pointer-events-none z-0"></div>

      {/* LEFT COLUMN: Control Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-4 z-10">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 h-full shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          
          {/* Pulsing Radar Header */}
          <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-white/5">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/50 rounded-2xl animate-ping opacity-75"></div>
              <div className="relative p-3 bg-primary/20 border border-primary/50 rounded-2xl">
                <Activity className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tighter">Quantum Core</h2>
              <div className="flex items-center mt-1 space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">System Live</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setActivePersona(persona.id)}
                className={`w-full flex items-start p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden ${
                  activePersona === persona.id 
                    ? 'bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]' 
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                }`}
              >
                {activePersona === persona.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl shadow-[0_0_10px_rgba(var(--primary-rgb),1)]"></div>
                )}
                <persona.icon className={`w-5 h-5 mr-4 mt-0.5 z-10 relative ${activePersona === persona.id ? 'text-white' : 'text-zinc-500'}`} />
                <div className="z-10 relative">
                  <p className={`font-bold text-sm ${activePersona === persona.id ? 'text-white' : 'text-zinc-400'}`}>{persona.name}</p>
                  <p className={`text-xs mt-1 ${activePersona === persona.id ? 'text-white/70' : 'text-zinc-600'}`}>{persona.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Chat Terminal */}
      <div className="flex-1 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10">
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth pt-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/20 flex items-center justify-center mr-4 shadow-lg">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] p-5 text-sm leading-relaxed shadow-2xl ${
                msg.role === 'user' 
                  ? 'bg-primary text-white font-medium rounded-[2rem] rounded-tr-sm' 
                  : 'bg-white/10 border border-white/10 text-zinc-100 rounded-[2rem] rounded-tl-sm backdrop-blur-md'
              }`}>
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}
                    <br/>
                  </span>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-in fade-in">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/20 flex items-center justify-center mr-4 relative">
                 <div className="absolute inset-0 bg-primary/20 rounded-xl animate-ping opacity-50"></div>
                 <Bot className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div className="bg-white/10 border border-white/10 p-5 rounded-[2rem] rounded-tl-sm flex items-center space-x-3">
                <span className="text-xs text-primary font-bold tracking-widest uppercase mr-2 animate-pulse">Processing</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto flex items-end space-x-3 bg-white/5 border border-white/10 p-2 rounded-3xl focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Transmit command..."
              className="flex-1 bg-transparent border-none px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-0 resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-white text-black rounded-full hover:bg-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg disabled:shadow-none mb-1 mr-1"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;