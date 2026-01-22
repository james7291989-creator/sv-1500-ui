import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield,
  Key,
  Bell,
  Save,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { user, updateProfile, api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    company_name: user?.company_name || ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const tierBenefits = {
    bronze: ['Email alerts', '24hr delayed deals', 'Basic property info', 'Email support'],
    silver: ['Real-time alerts', 'Instant access', 'Full due diligence', 'Priority support'],
    gold: ['30-min early access', 'Direct seller contact', 'Dedicated manager', 'Phone support'],
    platinum: ['Exclusive listings', 'Bulk pricing', 'Deal guarantee', '24/7 VIP support']
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      data-testid="settings-firstname-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      data-testid="settings-lastname-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      data-testid="settings-phone-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Your investment company"
                      className="pl-10"
                      data-testid="settings-company-input"
                    />
                  </div>
                </div>

                <Button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* API Keys Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2" />
                Integration API Keys
              </CardTitle>
              <CardDescription>Configure external service integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="font-medium mb-2">PropStream API</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Connect PropStream for real-time property data and skip tracing
                </p>
                <Input placeholder="Enter PropStream API key" className="mb-2" />
                <Button variant="outline" size="sm">Save Key</Button>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="font-medium mb-2">Twilio (SMS/Voice)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Enable automated seller outreach via SMS and voice
                </p>
                <div className="grid sm:grid-cols-2 gap-2 mb-2">
                  <Input placeholder="Account SID" />
                  <Input placeholder="Auth Token" type="password" />
                </div>
                <Button variant="outline" size="sm">Save Credentials</Button>
              </div>

              <div className="p-4 rounded-xl bg-muted/50">
                <h4 className="font-medium mb-2">DocuSign</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Enable digital contract signing
                </p>
                <Input placeholder="Enter DocuSign API key" className="mb-2" />
                <Button variant="outline" size="sm">Save Key</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tier</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold badge-${user?.tier}`}>
                  {user?.tier?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subscription</span>
                <span className={user?.subscription_status === 'active' ? 'text-green-500' : 'text-yellow-500'}>
                  {user?.subscription_status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deals Closed</span>
                <span className="font-medium">{user?.deals_closed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">POF Verified</span>
                {user?.proof_of_funds_verified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </div>
              {user?.proof_of_funds_amount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">POF Amount</span>
                  <span className="font-medium">${user.proof_of_funds_amount.toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tier Benefits */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Your Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(tierBenefits[user?.tier] || tierBenefits.bronze).map((benefit, i) => (
                  <li key={i} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">New deal alerts</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Contract updates</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment confirmations</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Weekly digest</span>
                <input type="checkbox" className="toggle" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
