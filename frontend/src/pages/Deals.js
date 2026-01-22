import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  TrendingUp, 
  Building2, 
  MapPin, 
  DollarSign,
  Clock,
  Lock,
  Star,
  ArrowRight,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

const Deals = () => {
  const { api, user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await api.get('/investors/deals');
      setDeals(response.data.deals || []);
    } catch (error) {
      toast.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  const getDistressColor = (score) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const tierPriority = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
  const userPriority = tierPriority[user?.tier] || 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="deals-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Available Deals</h1>
          <p className="text-muted-foreground mt-1">
            Properties under contract ready for assignment
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 rounded-full text-sm font-semibold badge-${user?.tier}`}>
            {user?.tier?.toUpperCase()} ACCESS
          </div>
        </div>
      </div>

      {/* Tier Benefits Banner */}
      {userPriority < 4 && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Star className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-semibold">Upgrade for Better Access</p>
                  <p className="text-sm text-muted-foreground">
                    {userPriority < 2 && 'Silver tier: Real-time alerts, instant access'}
                    {userPriority === 2 && 'Gold tier: 30-min early access, direct seller contact'}
                    {userPriority === 3 && 'Platinum tier: Exclusive pocket listings, deal guarantee'}
                  </p>
                </div>
              </div>
              <Link to="/payments">
                <Button className="btn-primary">
                  Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deals Grid */}
      {deals.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Deals Available</h3>
            <p className="text-muted-foreground mb-4">
              New deals are added regularly. Check back soon or browse all properties.
            </p>
            <Link to="/properties">
              <Button variant="outline">
                Browse Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <Card key={deal.property_id} className="bg-card border-border card-hover overflow-hidden" data-testid="deal-card">
              {/* Deal Header */}
              <div className="relative">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-primary/50" />
                </div>
                <div className="absolute top-3 left-3">
                  <Badge className="bg-green-500/90 text-white">
                    <Zap className="w-3 h-3 mr-1" />
                    Under Contract
                  </Badge>
                </div>
                <div className={`absolute top-3 right-3 w-12 h-12 rounded-xl ${getDistressColor(deal.distress_score)} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold">{deal.distress_score}</span>
                </div>
              </div>

              <CardContent className="pt-4">
                {/* Address */}
                <h3 className="font-semibold text-lg leading-tight mb-1">{deal.address}</h3>
                <p className="text-sm text-muted-foreground flex items-center mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  {deal.city}, {deal.county} County
                </p>

                {/* Property Details */}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                  <span className="capitalize">{deal.property_type?.replace('_', ' ')}</span>
                  {deal.bedrooms && <span>{deal.bedrooms} bed</span>}
                  {deal.bathrooms && <span>{deal.bathrooms} bath</span>}
                  {deal.sqft && <span>{deal.sqft.toLocaleString()} sqft</span>}
                </div>

                {/* Financial Info */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/50 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Investor Price</span>
                    <span className="font-bold text-primary text-lg">
                      ${deal.investor_price?.toLocaleString() || 'Contact Us'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Est. ARV</span>
                    <span className="font-medium text-green-500">
                      ${deal.estimated_arv?.toLocaleString() || 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Est. Repairs</span>
                    <span className="font-medium text-yellow-500">
                      ${deal.estimated_repairs?.toLocaleString() || 'TBD'}
                    </span>
                  </div>
                </div>

                {/* Tier-specific info */}
                {deal.full_due_diligence && (
                  <div className="flex items-center text-sm text-green-500 mb-2">
                    <Star className="w-4 h-4 mr-2" />
                    Full due diligence available
                  </div>
                )}
                {deal.seller_contact_available && (
                  <div className="flex items-center text-sm text-secondary mb-2">
                    <Star className="w-4 h-4 mr-2" />
                    Direct seller contact enabled
                  </div>
                )}
                {deal.pocket_listing && (
                  <div className="flex items-center text-sm text-primary mb-2">
                    <Star className="w-4 h-4 mr-2" />
                    Exclusive pocket listing
                  </div>
                )}

                {/* Action Button */}
                <Link to={`/properties/${deal.property_id}`}>
                  <Button className="w-full btn-primary mt-2">
                    <Lock className="w-4 h-4 mr-2" />
                    View & Lock Deal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* How It Works */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>How Deal Assignment Works</CardTitle>
          <CardDescription>Lock deals with EMD, we handle the rest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-semibold mb-1">Browse Deals</h4>
              <p className="text-sm text-muted-foreground">View properties under contract ready for assignment</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-semibold mb-1">Submit EMD</h4>
              <p className="text-sm text-muted-foreground">Lock the deal with earnest money deposit</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h4 className="font-semibold mb-1">Sign Assignment</h4>
              <p className="text-sm text-muted-foreground">E-sign the assignment contract digitally</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-500">4</span>
              </div>
              <h4 className="font-semibold mb-1">Close & Collect</h4>
              <p className="text-sm text-muted-foreground">We coordinate closing, you collect keys</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Deals;
