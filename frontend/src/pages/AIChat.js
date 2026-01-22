import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Zap,
  Building2,
  FileText,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const AIChat = () => {
  const [searchParams] = useSearchParams();
  const { api } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [contextType, setContextType] = useState('general');
  const messagesEndRef = useRef(null);
  
  const propertyId = searchParams.get('property');

  useEffect(() => {
    // Initial greeting
    setMessages([{
      role: 'assistant',
      content: `Welcome to MO Deal Wholesaler AI Assistant! I can help you with:

• **Property Analysis** - Get detailed investment analysis on any property
• **Seller Qualification** - Qualify motivated sellers with proven scripts
• **Offer Generation** - Create compelling multi-tier offers
• **Deal Structuring** - Get advice on deal terms and negotiations

${propertyId ? 'I see you have a property selected. Would you like me to analyze it?' : 'How can I help you today?'}`
    }]);
  }, [propertyId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/chat/message', {
        message: userMessage,
        session_id: sessionId,
        property_id: propertyId,
        context_type: contextType
      });

      setSessionId(response.data.session_id);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to get response');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'Analyze Property', prompt: 'Analyze this property and give me your investment recommendation', icon: Building2 },
    { label: 'Generate Offer', prompt: 'Generate a 3-tier offer presentation for a motivated seller', icon: FileText },
    { label: 'Seller Script', prompt: 'Give me a script to qualify this seller over the phone', icon: User },
    { label: 'Market Analysis', prompt: 'What are the current market conditions for wholesale deals in this area?', icon: TrendingUp },
  ];

  const contextOptions = [
    { value: 'general', label: 'General Assistant' },
    { value: 'property_analysis', label: 'Property Analysis' },
    { value: 'seller_qualification', label: 'Seller Qualification' },
    { value: 'offer_generation', label: 'Offer Generation' },
  ];

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col" data-testid="ai-chat-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Zap className="w-8 h-8 mr-2 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground mt-1">
            Powered by GPT-5.2 for real estate wholesaling
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Mode:</span>
          <Select value={contextType} onValueChange={setContextType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {contextOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col bg-card border-border overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-secondary" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-muted rounded-bl-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        <div className="p-4 border-t border-border">
          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(prompt.prompt)}
                className="text-xs"
              >
                <prompt.icon className="w-3 h-3 mr-1" />
                {prompt.label}
              </Button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about properties, offers, or seller qualification..."
              className="flex-1"
              disabled={loading}
              data-testid="chat-input"
            />
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={loading || !input.trim()}
              data-testid="chat-send-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </Card>

      {/* Property Context Indicator */}
      {propertyId && (
        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="text-sm">Property context loaded. AI responses will reference this property.</span>
        </div>
      )}
    </div>
  );
};

export default AIChat;
