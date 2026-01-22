import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Send,
  Eye,
  Download,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';

const Contracts = () => {
  const { api, user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts');
      setContracts(response.data.contracts || []);
    } catch (error) {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: 'bg-gray-500/20 text-gray-400', icon: FileText },
      sent: { bg: 'bg-blue-500/20 text-blue-400', icon: Send },
      signed: { bg: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      assigned: { bg: 'bg-purple-500/20 text-purple-400', icon: CheckCircle },
      closing: { bg: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      closed: { bg: 'bg-green-500/20 text-green-500', icon: CheckCircle },
      cancelled: { bg: 'bg-red-500/20 text-red-400', icon: XCircle }
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="contracts-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Contracts</h1>
        <p className="text-muted-foreground mt-1">
          Manage your purchase agreements and assignments
        </p>
      </div>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Contracts Yet</h3>
            <p className="text-muted-foreground">
              Your contracts will appear here once you lock a deal or create a purchase agreement.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const statusStyle = getStatusBadge(contract.status);
            const StatusIcon = statusStyle.icon;
            
            return (
              <Card key={contract.id} className="bg-card border-border card-hover" data-testid="contract-card">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-lg capitalize">
                            {contract.contract_type} Agreement
                          </h3>
                          <Badge className={statusStyle.bg}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {contract.status?.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Contract ID: {contract.id.slice(0, 8)}...
                        </p>
                        {contract.seller_name && (
                          <p className="text-sm text-muted-foreground">
                            Seller: {contract.seller_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Purchase Price</p>
                        <p className="text-xl font-bold">${contract.purchase_price?.toLocaleString()}</p>
                      </div>
                      
                      {contract.assignment_fee > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Assignment Fee</p>
                          <p className="text-xl font-bold text-green-500">${contract.assignment_fee?.toLocaleString()}</p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {contract.status === 'signed' && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contract Details */}
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">EMD</p>
                      <p className="font-medium">${contract.earnest_money_deposit?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Inspection Period</p>
                      <p className="font-medium">{contract.inspection_days} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Closing Period</p>
                      <p className="font-medium">{contract.closing_days} days</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(contract.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Fees Breakdown */}
                  {contract.contract_type === 'assignment' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-2">Fee Breakdown</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Assignment: </span>
                          <span className="font-medium text-green-500">${contract.assignment_fee?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coordination: </span>
                          <span className="font-medium">${contract.coordination_fee?.toLocaleString()}</span>
                        </div>
                        {contract.expedited_fee > 0 && (
                          <div>
                            <span className="text-muted-foreground">Expedited: </span>
                            <span className="font-medium">${contract.expedited_fee?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contract Types Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Contract Types</CardTitle>
          <CardDescription>Understanding our agreement structures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-primary" />
                Purchase Agreement
              </h4>
              <p className="text-sm text-muted-foreground">
                Our contract with the property seller. Contains assignable rights clause allowing transfer to investor-buyers.
                Includes inspection contingency and clear title requirements.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <h4 className="font-semibold mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-secondary" />
                Assignment Agreement
              </h4>
              <p className="text-sm text-muted-foreground">
                Transfer of our contractual rights to you as the investor-buyer.
                Includes assignment fee, coordination fee, and closing timeline.
                EMD required to secure the deal.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contracts;
