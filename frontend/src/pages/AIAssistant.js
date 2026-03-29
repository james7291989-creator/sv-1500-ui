import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, BrainCircuit, Calculator, Scale, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'SV-1500 Quantum AI Online. I am your Lead PropTech Underwriter. Paste an address, ask for a rehab estimate, or request a 70% rule calculation.' 
    }
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
      if (!API_KEY) throw new Error("API Key Vault locked. Check your .env file and Vercel settings.");

      let systemPrompt = "You are the SV-1500 Quantum AI, an elite real estate investment assistant.";
      if (activePersona === 'underwriter') systemPrompt += " Analyze deals strictly using the 70% rule (ARV * 0.70 - repairs - wholesale fee = Max Allowable Offer). Be precise.";
      if (activePersona === 'rehab') systemPrompt += " You are an expert general contractor. Estimate rehab costs line-by-line based on the user's description.";
      if (activePersona === 'legal') systemPrompt += " You are a real estate strategist. Focus on assignment contracts, wholesale disclosures, and closing strategies.";

      const promptToSend = `${systemPrompt}\n\nUser query: ${userText}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptToSend }] }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "Failed to communicate with the Gemini engine.");

      const aiText = data.candidates[0].content.parts[0].text;
      setMessages([...newMessages, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('AI Link Severed. Check your API configuration.');
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
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700 pb-6 relative">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* LEFT COLUMN: Modern Persona Selector */}
      <div className="w-full lg:w-80 flex flex-col gap-4 z-10">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 h-full shadow-2xl">
          <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-white/5">
            <div className="p-3 bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/20 rounded-2xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Quantum AI</h2>
              <p className="text-xs text-primary font-semibold uppercase tracking-widest mt-1">Intelligence Core</p>
            </div>
          </div>

          <h3 className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4 ml-2">Select Operations Mode</h3>
          <div className="space-y-3">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setActivePersona(persona.id)}
                className={`w-full flex items-start p-4 rounded-2xl border transition-all duration-300 text-left group ${
                  activePersona === persona.id 
                    ? 'bg-primary/20 border-primary/40 shadow-[0_8px_30px_rgba(var(--primary-rgb),0.15)]' 
                    : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                }`}
              >
                <persona.icon className={`w-5 h-5 mr-4 mt-0.5 transition-colors ${activePersona === persona.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <div>
                  <p className={`font-bold text-sm transition-colors ${activePersona === persona.id ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{persona.name}</p>
                  <p className={`text-xs mt-1 transition-colors ${activePersona === persona.id ? 'text-white/70' : 'text-zinc-600'}`}>{persona.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Ultra-Premium Chat Interface */}
      <div className="flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl z-10">
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
              
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center mr-4 flex-shrink-0 shadow-lg">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[80%] p-5 text-sm leading-relaxed shadow-xl ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-white font-medium rounded-[2rem] rounded-tr-sm' 
                  : 'bg-white/10 border border-white/5 text-zinc-100 rounded-[2rem] rounded-tl-sm backdrop-blur-md'
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
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center mr-4 shadow-lg">
                <Bot className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="bg-white/5 border border-white/5 p-5 rounded-[2rem] rounded-tl-sm flex items-center space-x-3 backdrop-blur-md">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-primary/80 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Modern Floating Input Area */}
        <div className="p-6 bg-transparent border-t border-white/5">
          <div className="max-w-4xl mx-auto flex items-end space-x-3 bg-black/40 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-inner focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Deploy a command..."
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