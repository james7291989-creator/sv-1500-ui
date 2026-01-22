import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, api, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDeals, setRecentDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dealsRes] = await Promise.all([
        api.get('/investors/deals')
      ]);
      setRecentDeals(dealsRes.data.deals?.slice(0, 5) || []);
      
      if (isAdmin) {
        const adminRes = await api.get('/admin/dashboard');
        setStats(adminRes.data);
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDistressColor = (score) => {
    if (score >= 75) return 'text-red-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const tierFeatures = {
    bronze: { deals: 'Delayed', support: 'Email', early: 'No' },
    silver: { deals: 'Real-time', support: 'Priority', early: 'No' },
    gold: { deals: 'Real-time', support: 'Phone', early: '30 min' },
    platinum: { deals: 'Exclusive', support: 'VIP 24/7', early: 'First' }
  };

  const currentFeatures = tierFeatures[user?.tier] || tierFeatures.bronze;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="investor-dashboard">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.first_name}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your investment pipeline
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-4 py-2 rounded-full text-sm font-semibold badge-${user?.tier}`}>
            {user?.tier?.toUpperCase()} TIER
          </div>
          <Link to="/deals">
            <Button className="btn-primary" data-testid="view-deals-btn">
              <Zap className="w-4 h-4 mr-2" />
              View Live Deals
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Deals</p>
                <p className="text-3xl font-bold mt-1">{recentDeals.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-500">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>3 new today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deals Closed</p>
                <p className="text-3xl font-bold mt-1">{user?.deals_closed || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-muted-foreground">
              <Target className="w-4 h-4 mr-1" />
              <span>Lifetime total</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscription</p>
                <p className="text-3xl font-bold mt-1 capitalize">{user?.subscription_status || 'Inactive'}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${user?.subscription_status === 'active' ? 'bg-green-500/10' : 'bg-yellow-500/10'} flex items-center justify-center`}>
                {user?.subscription_status === 'active' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                )}
              </div>
            </div>
            <Link to="/payments" className="mt-4 flex items-center text-sm text-primary hover:underline">
              {user?.subscription_status === 'active' ? 'Manage subscription' : 'Activate now'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">POF Verified</p>
                <p className="text-3xl font-bold mt-1">${(user?.proof_of_funds_amount || 0).toLocaleString()}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${user?.proof_of_funds_verified ? 'bg-green-500/10' : 'bg-muted'} flex items-center justify-center`}>
                <DollarSign className={`w-6 h-6 ${user?.proof_of_funds_verified ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <Link to="/settings" className="mt-4 flex items-center text-sm text-primary hover:underline">
              {user?.proof_of_funds_verified ? 'View details' : 'Verify funds'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Deals */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Available Deals</CardTitle>
                <CardDescription>Properties ready for assignment</CardDescription>
              </div>
              <Link to="/deals">
                <Button variant="outline" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentDeals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No deals available at the moment</p>
                  <p className="text-sm mt-2">Check back soon for new opportunities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDeals.map((deal, index) => (
                    <Link 
                      key={deal.property_id || index} 
                      to={`/properties/${deal.property_id}`}
                      className="block p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{deal.address}</p>
                              <p className="text-sm text-muted-foreground">{deal.city}, {deal.county} County</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getDistressColor(deal.distress_score)}`}>
                            {deal.distress_score}
                          </div>
                          <div className="text-xs text-muted-foreground">DistressScore</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-muted-foreground">{deal.property_type}</span>
                          {deal.bedrooms && <span>{deal.bedrooms} bed / {deal.bathrooms} bath</span>}
                        </div>
                        <div className="font-semibold text-green-500">
                          ${deal.investor_price?.toLocaleString() || 'TBD'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tier Benefits */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-bold badge-${user?.tier}`}>
                  {user?.tier?.toUpperCase()}
                </span>
                <span>Your Benefits</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deal Access</span>
                  <span className="text-sm font-medium">{currentFeatures.deals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Support</span>
                  <span className="text-sm font-medium">{currentFeatures.support}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Early Access</span>
                  <span className="text-sm font-medium">{currentFeatures.early}</span>
                </div>
              </div>
              
              {user?.tier !== 'platinum' && (
                <Link to="/payments" className="block mt-4">
                  <Button className="w-full btn-secondary">
                    Upgrade Tier
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/properties" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="w-4 h-4 mr-2" />
                  Browse Properties
                </Button>
              </Link>
              <Link to="/chat" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  AI Deal Analyzer
                </Button>
              </Link>
              <Link to="/contracts" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  My Contracts
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Integration Status (Admin only) */}
          {isAdmin && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Stripe', 'OpenAI', 'Twilio', 'DocuSign', 'PropStream'].map((service) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="text-sm">{service}</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${['Stripe', 'OpenAI'].includes(service) ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-xs text-muted-foreground">
                          {['Stripe', 'OpenAI'].includes(service) ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
