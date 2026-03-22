import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  Building2, 
  Search, 
  Filter, 
  MapPin, 
  TrendingUp,
  Home,
  ArrowUpRight,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const Properties = () => {
  const { api } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    minScore: 0,
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.city, filters.minScore, filters.status]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.city && filters.city !== 'all') params.append('city', filters.city);
      if (filters.minScore) params.append('min_score', filters.minScore);
      if (filters.status) params.append('status', filters.status);
      
      const response = await api.get(`/properties?${params.toString()}`);
      setProperties(response.data.properties || []);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getDistressColor = (score) => {
    if (score >= 75) return 'bg-red-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      contacted: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      under_contract: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      assigned: 'bg-primary/20 text-primary border-primary/30',
      closed: 'bg-green-500/20 text-green-400 border-green-500/30',
      dead: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return styles[status] || styles.new;
  };

  const filteredProperties = properties.filter(prop => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return prop.address?.toLowerCase().includes(search) ||
             prop.city?.toLowerCase().includes(search) ||
             prop.county?.toLowerCase().includes(search);
    }
    return true;
  });

  const cities = [...new Set(properties.map(p => p.city))].filter(Boolean);

  return (
    <div className="space-y-6" data-testid="properties-page">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Property Database</h1>
          <p className="text-muted-foreground mt-1">
            {filteredProperties.length} distressed properties in Missouri
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by address, city, or county..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                data-testid="property-search-input"
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filters.city}
                onValueChange={(value) => setFilters({ ...filters, city: value })}
              >
                <SelectTrigger className="w-[180px]" data-testid="city-filter">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.minScore.toString()}
                onValueChange={(value) => setFilters({ ...filters, minScore: parseInt(value) })}
              >
                <SelectTrigger className="w-[180px]" data-testid="score-filter">
                  <SelectValue placeholder="Min Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Scores</SelectItem>
                  <SelectItem value="50">Score 50+</SelectItem>
                  <SelectItem value="65">Score 65+</SelectItem>
                  <SelectItem value="75">Score 75+</SelectItem>
                  <SelectItem value="85">Score 85+</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="w-[180px]" data-testid="status-filter">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="under_contract">Under Contract</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredProperties.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
            <p className="text-muted-foreground">
              {filters.search || filters.city || filters.minScore > 0 || filters.status
                ? 'Try adjusting your filters'
                : 'Properties will appear here as they are added to the database'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <Link key={property.id} to={`/properties/${property.id}`}>
              <Card className="bg-card border-border card-hover h-full" data-testid="property-card">
                <CardContent className="pt-6">
                  {/* Header with Score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Home className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{property.property_type?.replace('_', ' ')}</p>
                        <Badge variant="outline" className={`text-xs ${getStatusBadge(property.status)}`}>
                          {property.status?.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`w-14 h-14 rounded-xl ${getDistressColor(property.distress_score)} flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg">{property.distress_score}</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">Score</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg leading-tight">{property.address}</h3>
                    <p className="text-sm text-muted-foreground flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.city}, {property.state} {property.zip_code}
                    </p>
                    <p className="text-xs text-muted-foreground">{property.county} County</p>
                  </div>

                  {/* Property Details */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                    {property.bedrooms && (
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="font-semibold">{property.bedrooms}</p>
                        <p className="text-xs text-muted-foreground">Beds</p>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="font-semibold">{property.bathrooms}</p>
                        <p className="text-xs text-muted-foreground">Baths</p>
                      </div>
                    )}
                    {property.sqft && (
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="font-semibold">{property.sqft.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Sqft</p>
                      </div>
                    )}
                  </div>

                  {/* Financial Info */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. ARV</span>
                      <span className="font-semibold text-green-500">
                        ${property.estimated_arv?.toLocaleString() || 'TBD'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Est. Repairs</span>
                      <span className="font-semibold text-yellow-500">
                        ${property.estimated_repairs?.toLocaleString() || 'TBD'}
                      </span>
                    </div>
                    {property.investor_price && (
                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                        <span className="text-muted-foreground">Investor Price</span>
                        <span className="font-bold text-primary">
                          ${property.investor_price.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Distress Indicators */}
                  {(property.tax_delinquency_years > 0 || property.code_violations?.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-2">
                        {property.tax_delinquency_years > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            Tax Delinquent {property.tax_delinquency_years}yr
                          </span>
                        )}
                        {property.code_violations?.length > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            {property.code_violations.length} Violations
                          </span>
                        )}
                        {property.vacancy_indicators?.length > 0 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            Vacant
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* View Button */}
                  <Button variant="outline" className="w-full mt-4 group">
                    View Details
                    <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Properties;

