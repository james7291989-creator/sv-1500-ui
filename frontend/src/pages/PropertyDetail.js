import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Wrench,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  TrendingUp,
  ArrowLeft,
  Zap,
  Lock,
  CheckCircle,
  Home,
  Ruler,
  Bath,
  Bed
} from 'lucide-react';
import { toast } from 'sonner';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [property, setProperty] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      const response = await api.get(`/properties/${id}`);
      setProperty(response.data);
    } catch (error) {
      toast.error('Property not found');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post(`/properties/${id}/analyze`);
      setAnalysis(response.data);
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLockDeal = async () => {
    setLocking(true);
    try {
      const response = await api.post(`/investors/deals/${id}/lock`);
      toast.success('Deal lock initiated! Proceed to payment.');
      navigate(`/payments?type=emd&property=${id}&amount=${response.data.required_emd}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to lock deal');
    } finally {
      setLocking(false);
    }
  };

  const getDistressColor = (score) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-500/20 text-blue-400',
      contacted: 'bg-yellow-500/20 text-yellow-400',
      under_contract: 'bg-purple-500/20 text-purple-400',
      assigned: 'bg-primary/20 text-primary',
      closed: 'bg-green-500/20 text-green-400',
      dead: 'bg-gray-500/20 text-gray-400'
    };
    return styles[status] || styles.new;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="property-detail-page">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Properties
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Badge variant="outline" className={getStatusBadge(property.status)}>
              {property.status?.replace('_', ' ').toUpperCase()}
            </Badge>
            <span className="text-muted-foreground capitalize">{property.property_type?.replace('_', ' ')}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{property.address}</h1>
          <p className="text-lg text-muted-foreground flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            {property.city}, {property.state} {property.zip_code} • {property.county} County
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className={`w-24 h-24 rounded-2xl ${getDistressColor(property.distress_score)} flex flex-col items-center justify-center glow-primary`}>
            <span className="text-white font-bold text-3xl">{property.distress_score}</span>
            <span className="text-white/80 text-xs">DistressScore™</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Button className="btn-primary" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              AI Property Analysis
            </>
          )}
        </Button>
        
        {property.status === 'under_contract' && !property.acquired_by_investor_id && (
          <Button className="btn-secondary" onClick={handleLockDeal} disabled={locking}>
            {locking ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Lock This Deal
              </>
            )}
          </Button>
        )}
        
        <Link to={`/chat?property=${id}`}>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generate Offer
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {property.bedrooms && (
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bed className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{property.bedrooms}</p>
                      <p className="text-sm text-muted-foreground">Bedrooms</p>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Bath className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{property.bathrooms}</p>
                      <p className="text-sm text-muted-foreground">Bathrooms</p>
                    </div>
                  </div>
                )}
                {property.sqft && (
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Ruler className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{property.sqft.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Sq. Ft.</p>
                    </div>
                  </div>
                )}
                {property.year_built && (
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{property.year_built}</p>
                      <p className="text-sm text-muted-foreground">Year Built</p>
                    </div>
                  </div>
                )}
              </div>

              {property.lot_size && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">Lot Size: <span className="font-medium text-foreground">{property.lot_size} acres</span></p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Analysis */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Financial Analysis</CardTitle>
              <CardDescription>Investment opportunity breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Assessed Value</p>
                    <p className="text-2xl font-bold">${property.assessed_value?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-400 mb-1">Estimated ARV</p>
                    <p className="text-2xl font-bold text-green-500">${property.estimated_arv?.toLocaleString() || 'TBD'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm text-yellow-400 mb-1">Estimated Repairs</p>
                    <p className="text-2xl font-bold text-yellow-500">${property.estimated_repairs?.toLocaleString() || 'TBD'}</p>
                  </div>
                  {property.investor_price && (
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm text-primary mb-1">Investor Price</p>
                      <p className="text-2xl font-bold text-primary">${property.investor_price.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 70% Rule Calculation */}
              {property.estimated_arv && property.estimated_repairs && (
                <div className="mt-6 p-4 rounded-xl bg-card border border-border">
                  <p className="text-sm font-medium mb-3">70% Rule Analysis</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ARV × 70%</span>
                      <span>${(property.estimated_arv * 0.7).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">- Repairs</span>
                      <span>-${property.estimated_repairs.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-bold">
                      <span>Max Allowable Offer</span>
                      <span className="text-green-500">
                        ${((property.estimated_arv * 0.7) - property.estimated_repairs).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distress Indicators */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                Distress Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {property.tax_delinquency_years > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-400">Tax Delinquency</p>
                        <p className="text-sm text-muted-foreground">{property.tax_delinquency_years} years unpaid</p>
                      </div>
                      <p className="text-xl font-bold text-red-500">${property.tax_delinquency_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {property.vacancy_indicators?.length > 0 && (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="font-medium text-purple-400 mb-2">Vacancy Indicators</p>
                    <div className="flex flex-wrap gap-2">
                      {property.vacancy_indicators.map((indicator, i) => (
                        <Badge key={i} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.code_violations?.length > 0 && (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <p className="font-medium text-yellow-400 mb-2">Code Violations</p>
                    <div className="flex flex-wrap gap-2">
                      {property.code_violations.map((violation, i) => (
                        <Badge key={i} variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                          {violation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {property.liens?.length > 0 && (
                  <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <p className="font-medium text-orange-400 mb-2">Liens ({property.liens.length})</p>
                    <div className="space-y-2">
                      {property.liens.map((lien, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{lien.type} Lien</span>
                          <span className="font-medium">${lien.amount?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {property.notes && (
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="font-medium mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground">{property.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Results */}
          {analysis && (
            <Card className="bg-card border-border border-primary/30 glow-primary">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  AI Analysis Results
                </CardTitle>
                <CardDescription>Generated {new Date(analysis.generated_at).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-xl overflow-auto">
                    {analysis.analysis}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          {user?.tier !== 'bronze' && property.owner_name && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Owner Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Owner Name</p>
                  <p className="font-medium">{property.owner_name}</p>
                </div>
                {property.owner_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a href={`tel:${property.owner_phone}`} className="font-medium text-primary hover:underline flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {property.owner_phone}
                    </a>
                  </div>
                )}
                {property.owner_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a href={`mailto:${property.owner_email}`} className="font-medium text-primary hover:underline flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {property.owner_email}
                    </a>
                  </div>
                )}
                {property.owner_address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Mailing Address</p>
                    <p className="font-medium">{property.owner_address}</p>
                    {property.owner_address !== `${property.address}, ${property.city}, ${property.state}` && (
                      <Badge variant="outline" className="mt-2 bg-purple-500/10 text-purple-400 border-purple-500/30">
                        Out-of-State Owner
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Deal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.contracted_price && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Price</span>
                  <span className="font-bold">${property.contracted_price.toLocaleString()}</span>
                </div>
              )}
              {property.investor_price && property.contracted_price && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignment Fee</span>
                    <span className="font-bold text-green-500">
                      ${(property.investor_price - property.contracted_price).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coordination Fee</span>
                    <span className="font-medium">$795</span>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between">
                    <span className="font-medium">Total to Close</span>
                    <span className="font-bold text-primary">
                      ${(property.investor_price + 795).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tier Upgrade Prompt */}
          {user?.tier === 'bronze' && (
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <CardContent className="pt-6 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-bold mb-2">Unlock Full Details</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Silver or higher to access owner contact info, full due diligence, and priority deal access.
                </p>
                <Link to="/payments">
                  <Button className="w-full btn-primary">
                    Upgrade Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
