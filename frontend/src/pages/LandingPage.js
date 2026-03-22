import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  Building2, 
  TrendingUp, 
  FileText, 
  Users, 
  Zap, 
  Shield,
  ArrowRight,
  Check,
  Star
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Building2,
      title: "Distressed Property Database",
      description: "Access thousands of off-market properties with Rodney Scoreâ„¢ ratings. Tax delinquent, vacant, probate, and foreclosure leads."
    },
    {
      icon: Zap,
      title: "AI-Powered Analysis",
      description: "GPT-5.2 analyzes properties instantly. Get ARV estimates, repair costs, and investment recommendations in seconds."
    },
    {
      icon: FileText,
      title: "Contract Automation",
      description: "Digital contracts with e-signatures and remote online notarization. Close deals faster without paperwork hassles."
    },
    {
      icon: Users,
      title: "Investor Marketplace",
      description: "First-to-market deal access. Bronze to Platinum tiers with exclusive pocket listings and bulk pricing."
    },
    {
      icon: TrendingUp,
      title: "Automated Outreach",
      description: "Multi-channel seller contact via SMS, voice, and direct mail. Sweatless acquisition system handles the work."
    },
    {
      icon: Shield,
      title: "Legal Compliance",
      description: "Missouri MERA compliant. All contracts reviewed by real estate attorneys. You're the principal, not an agent."
    }
  ];

  const tiers = [
    {
      name: "Bronze",
      price: 97,
      color: "from-amber-700 to-amber-900",
      features: [
        "Email alerts on new deals",
        "24-hour delayed access",
        "Basic property information",
        "Standard support"
      ]
    },
    {
      name: "Silver",
      price: 297,
      color: "from-gray-400 to-gray-600",
      popular: false,
      features: [
        "Real-time deal alerts",
        "Instant property access",
        "Full due diligence packets",
        "Comparable sales reports",
        "Priority support"
      ]
    },
    {
      name: "Gold",
      price: 597,
      color: "from-yellow-500 to-amber-600",
      popular: true,
      features: [
        "30-minute early access",
        "Direct seller contact",
        "Dedicated account manager",
        "Custom deal criteria",
        "Phone support"
      ]
    },
    {
      name: "Platinum",
      price: 1497,
      color: "from-gray-200 to-gray-400",
      features: [
        "Exclusive pocket listings",
        "Negotiated bulk pricing",
        "Deal guarantee program",
        "White-glove closing service",
        "24/7 VIP support"
      ]
    }
  ];

  const stats = [
    { value: "500+", label: "Active Properties" },
    { value: "$2.5M", label: "Deals Closed" },
    { value: "89%", label: "Close Rate" },
    { value: "7 Days", label: "Avg. Close Time" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">MO Deal Wholesaler</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="btn-primary">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-slide-up">
            <Star className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Missouri's #1 Wholesale Platform</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 animate-slide-up stagger-1">
            <span className="gradient-text">Close Wholesale Deals</span>
            <br />
            <span className="text-foreground">Without Lifting a Finger</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up stagger-2">
            AI-powered property sourcing, automated seller outreach, and digital contract execution. 
            We find distressed Missouri properties and connect you with motivated sellers.
            <span className="text-foreground font-medium"> You collect assignment fees.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-3">
            <Button 
              size="lg" 
              className="btn-primary text-lg px-8 py-6"
              onClick={() => navigate('/register')}
              data-testid="hero-get-started-btn"
            >
              Start Investing Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate('/login')}
            >
              View Live Deals
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 animate-slide-up stagger-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Close Deals</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From finding distressed properties to collecting your assignment fee â€” all automated.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-card border border-border card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Choose Your <span className="gradient-text-blue">Investment Level</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From casual investor to full-time wholesaler â€” we have the right tier for your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, index) => (
              <div 
                key={index}
                className={`relative p-6 rounded-2xl bg-card border ${tier.popular ? 'border-primary glow-primary' : 'border-border'} card-hover`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                    MOST POPULAR
                  </div>
                )}
                
                <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${tier.color} text-white text-sm font-bold mb-4`}>
                  {tier.name}
                </div>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${tier.popular ? 'btn-primary' : ''}`}
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => navigate('/register')}
                  data-testid={`pricing-${tier.name.toLowerCase()}-btn`}
                >
                  Get Started
                </Button>
              </div>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-8">
            All plans include 2 months free with annual billing
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Start <span className="gradient-text">Closing Deals</span>?
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join hundreds of Missouri investors already using MO Deal Wholesaler to find off-market properties and collect assignment fees.
          </p>
          <Button 
            size="lg" 
            className="btn-primary text-lg px-10 py-6"
            onClick={() => navigate('/register')}
            data-testid="cta-get-started-btn"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">MO Deal Wholesaler</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Â© 2024 MO Deal Wholesaler. Missouri Real Estate Investment Platform.
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              MO Deal Wholesaler operates as a principal in real estate transactions, not as a broker or agent. 
              We buy equitable interest in properties via assignable purchase contracts. Not licensed real estate advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

