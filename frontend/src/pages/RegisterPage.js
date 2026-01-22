import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Building2, Mail, Lock, User, Phone, Briefcase, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    tier: 'bronze'
  });

  const tiers = [
    { value: 'bronze', label: 'Bronze - $97/mo', description: 'Email alerts, 24hr delayed access' },
    { value: 'silver', label: 'Silver - $297/mo', description: 'Real-time alerts, instant access' },
    { value: 'gold', label: 'Gold - $597/mo', description: '30-min early access, direct seller contact' },
    { value: 'platinum', label: 'Platinum - $1,497/mo', description: 'Exclusive listings, deal guarantee' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      setStep(2);
      return;
    }

    if (!formData.first_name || !formData.last_name) {
      toast.error('Please provide your name');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">MO Deal Wholesaler</span>
          </Link>

          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              {step > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
              2
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {step === 1 ? 'Create Your Account' : 'Complete Your Profile'}
            </h1>
            <p className="text-muted-foreground">
              {step === 1 ? 'Start investing in Missouri real estate' : 'Tell us about yourself'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="investor@example.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="register-email-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      data-testid="register-password-input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="first_name"
                        type="text"
                        placeholder="John"
                        className="pl-10"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        required
                        data-testid="register-firstname-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      data-testid="register-lastname-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="register-phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name (Optional)</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="company_name"
                      type="text"
                      placeholder="ABC Investments LLC"
                      className="pl-10"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      data-testid="register-company-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Your Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(value) => setFormData({ ...formData, tier: value })}
                  >
                    <SelectTrigger data-testid="register-tier-select">
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          <div>
                            <div className="font-medium">{tier.label}</div>
                            <div className="text-xs text-muted-foreground">{tier.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">You can upgrade anytime from settings</p>
                </div>
              </>
            )}

            <div className="flex space-x-4">
              {step === 2 && (
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              )}
              <Button 
                type="submit" 
                className={`btn-primary ${step === 1 ? 'w-full' : 'flex-1'}`}
                disabled={loading}
                data-testid="register-submit-btn"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <>
                    {step === 1 ? 'Continue' : 'Create Account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            By creating an account, you agree to our Terms of Service and acknowledge that MO Deal Wholesaler operates as a principal in real estate transactions.
          </p>
        </div>
      </div>

      {/* Right side - Info */}
      <div className="hidden lg:flex flex-1 bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-transparent to-primary/20" />
        <div className="absolute inset-0 noise-overlay" />
        
        <div className="relative flex flex-col items-center justify-center p-12 text-center">
          <h2 className="text-3xl font-bold mb-8">
            What You'll Get Access To
          </h2>
          
          <div className="space-y-4 text-left max-w-sm">
            {[
              'Distressed property database with DistressScore™',
              'AI-powered property analysis and valuation',
              'Automated seller outreach campaigns',
              'Digital contracts with e-signatures',
              'Investor marketplace with tier access',
              'Real-time deal notifications'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 backdrop-blur">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
