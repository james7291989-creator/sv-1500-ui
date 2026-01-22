import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  CreditCard, 
  Check, 
  Star, 
  Zap,
  Clock,
  DollarSign,
  ArrowRight,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const Payments = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingTier, setProcessingTier] = useState(null);

  const paymentType = searchParams.get('type');
  const propertyId = searchParams.get('property');
  const amount = searchParams.get('amount');

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const fetchPaymentHistory = async () => {
    try {
      const response = await api.get('/payments/history');
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tier) => {
    setProcessingTier(tier);
    try {
      const response = await api.post('/payments/create-checkout', null, {
        params: { payment_type: 'subscription', tier },
        headers: { origin: window.location.origin }
      });
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setProcessingTier(null);
    }
  };

  const handleEMD = async () => {
    if (!propertyId) return;
    
    setProcessingTier('emd');
    try {
      const response = await api.post('/payments/create-checkout', null, {
        params: { payment_type: 'emd', property_id: propertyId },
        headers: { origin: window.location.origin }
      });
      
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment failed');
    } finally {
      setProcessingTier(null);
    }
  };

  const tiers = [
    {
      name: 'bronze',
      label: 'Bronze',
      price: 97,
      color: 'from-amber-700 to-amber-900',
      features: [
        'Email alerts on new deals',
        '24-hour delayed access',
        'Basic property information',
        'Email support'
      ]
    },
    {
      name: 'silver',
      label: 'Silver',
      price: 297,
      color: 'from-gray-400 to-gray-600',
      features: [
        'Real-time deal alerts',
        'Instant property access',
        'Full due diligence packets',
        'Comparable sales reports',
        'Priority email support'
      ]
    },
    {
      name: 'gold',
      label: 'Gold',
      price: 597,
      color: 'from-yellow-500 to-amber-600',
      popular: true,
      features: [
        '30-minute early access',
        'Direct seller contact',
        'Dedicated account manager',
        'Custom deal criteria alerts',
        'Phone support'
      ]
    },
    {
      name: 'platinum',
      label: 'Platinum',
      price: 1497,
      color: 'from-gray-200 to-gray-400',
      features: [
        'Exclusive pocket listings',
        'Negotiated bulk pricing',
        'Deal guarantee program',
        'White-glove closing service',
        '24/7 VIP support'
      ]
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6" data-testid="payments-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payments & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription tier and view payment history
        </p>
      </div>

      {/* EMD Payment Section (if redirected from deal) */}
      {paymentType === 'emd' && propertyId && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Lock Your Deal</h3>
                <p className="text-muted-foreground">
                  Submit Earnest Money Deposit to secure this property
                </p>
                <p className="text-2xl font-bold text-primary mt-2">
                  EMD Required: ${parseFloat(amount).toLocaleString()}
                </p>
              </div>
              <Button 
                className="btn-primary" 
                size="lg"
                onClick={handleEMD}
                disabled={processingTier === 'emd'}
              >
                {processingTier === 'emd' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay EMD Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full font-semibold badge-${user?.tier}`}>
                {user?.tier?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  Status: <span className={user?.subscription_status === 'active' ? 'text-green-500' : 'text-yellow-500'}>
                    {user?.subscription_status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  ${tiers.find(t => t.name === user?.tier)?.price || 97}/month
                </p>
              </div>
            </div>
            {user?.subscription_status !== 'active' && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                <Clock className="w-3 h-3 mr-1" />
                Activate to access deals
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Tiers */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Choose Your Tier</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const isCurrentTier = user?.tier === tier.name;
            const isUpgrade = tiers.findIndex(t => t.name === tier.name) > tiers.findIndex(t => t.name === user?.tier);
            
            return (
              <Card 
                key={tier.name}
                className={`bg-card border-border relative ${tier.popular ? 'border-primary glow-primary' : ''} ${isCurrentTier ? 'ring-2 ring-green-500' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold">
                    MOST POPULAR
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold">
                    CURRENT
                  </div>
                )}
                
                <CardContent className="pt-8">
                  <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${tier.color} text-white text-sm font-bold mb-4`}>
                    {tier.label}
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
                    className={`w-full ${isCurrentTier ? '' : tier.popular ? 'btn-primary' : ''}`}
                    variant={isCurrentTier ? 'outline' : tier.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(tier.name)}
                    disabled={isCurrentTier || processingTier === tier.name}
                  >
                    {processingTier === tier.name ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : isCurrentTier ? (
                      'Current Plan'
                    ) : isUpgrade ? (
                      <>Upgrade<ArrowRight className="w-4 h-4 ml-2" /></>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-center text-muted-foreground mt-4">
          All plans include 2 months free with annual billing
        </p>
      </div>

      {/* Payment History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {tx.transaction_type === 'subscription' ? (
                        <Star className="w-5 h-5 text-primary" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.transaction_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${tx.amount?.toLocaleString()}</p>
                    <Badge className={getStatusBadge(tx.payment_status)}>
                      {tx.payment_status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Note */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="py-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-medium">Secure Payments</p>
              <p className="text-sm text-muted-foreground">
                All payments are processed securely through Stripe. We never store your card details.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
