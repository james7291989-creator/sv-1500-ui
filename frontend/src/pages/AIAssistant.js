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

  // Secure API Key Call
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;

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
      if (!API_KEY) {
         throw new Error("API Key Vault locked. Check your .env file and Vercel settings.");
      }

      // Context injection based on the selected persona
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
      
      if (data.error) {
        throw new Error(data.error.message || "Failed to communicate with the Gemini engine.");
      }

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
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-700 pb-6">
      
      {/* LEFT COLUMN: The Targeting Matrix (Personas) */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-full">
          <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-white/10">
            <div className="p-3 bg-primary/20 border border-primary/30 rounded-2xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Quantum AI</h2>
              <p className="text-xs text-primary font-bold uppercase tracking-widest mt-1">Active Core</p>
            </div>
          </div>

          <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-4">Select Operations Mode</h3>
          <div className="space-y-3">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setActivePersona(persona.id)}
                className={`w-full flex items-start p-4 rounded-2xl border transition-all duration-300 text-left ${
                  activePersona === persona.id 
                    ? 'bg-primary/10 border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' 
                    : 'bg-black/20 border-white/5 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <persona.icon className={`w-5 h-5 mr-3 mt-0.5 ${activePersona === persona.id ? 'text-primary' : 'text-zinc-500'}`} />
                <div>
                  <p className={`font-bold text-sm ${activePersona === persona.id ? 'text-white' : 'text-zinc-300'}`}>{persona.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{persona.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: The Output Console (Chat) */}
      <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[85%] p-4 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white text-black font-medium rounded-2xl rounded-tr-sm shadow-lg' 
                  : 'bg-black/40 border border-white/10 text-zinc-300 rounded-2xl rounded-tl-sm'
              }`}>
                {/* Simple formatting for AI responses */}
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
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mr-3">
                <Bot className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="bg-black/40 border border-white/10 p-4 rounded-2xl rounded-tl-sm flex items-center space-x-2">
                <div className="text-sm text-zinc-500 mr-2 font-medium tracking-wider">COMPUTING</div>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Arsenal */}
        <div className="p-4 bg-black/40 border-t border-white/10 backdrop-blur-md z-10">
          <div className="max-w-4xl mx-auto flex items-end space-x-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Deploy a command to the Quantum AI..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all resize-none min-h-[60px] max-h-[120px]"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-4 bg-primary text-white rounded-2xl hover:bg-primary/80 disabled:opacity-50 transition-all flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)] flex-shrink-0"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          <div className="text-center mt-3">
            <p className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase">SV-1500 Intelligence Engine • End-to-End Encrypted</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AIAssistant;