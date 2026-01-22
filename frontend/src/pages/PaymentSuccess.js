import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, ArrowRight, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api, user } = useAuth();
  const [status, setStatus] = useState('checking');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await api.get(`/payments/status/${sessionId}`);
      setPaymentInfo(response.data);

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        toast.success('Payment successful!');
        return;
      } else if (response.data.status === 'expired') {
        setStatus('expired');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
    } catch (error) {
      console.error('Payment status check error:', error);
      setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card border-border max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
              <p className="text-muted-foreground mb-6">
                Please wait while we confirm your payment...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground mb-4">
                Thank you for your payment. Your account has been updated.
              </p>
              {paymentInfo && (
                <div className="p-4 rounded-xl bg-muted/50 mb-6 text-left">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold">${paymentInfo.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-bold text-green-500">Paid</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Link to="/dashboard">
                  <Button className="w-full btn-primary">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/deals">
                  <Button variant="outline" className="w-full">
                    Browse Deals
                  </Button>
                </Link>
              </div>
            </>
          )}

          {(status === 'error' || status === 'expired' || status === 'timeout') && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {status === 'expired' ? 'Session Expired' : 'Payment Issue'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {status === 'expired' 
                  ? 'Your payment session has expired. Please try again.'
                  : status === 'timeout'
                  ? 'We could not confirm your payment. Please check your email for confirmation.'
                  : 'There was an issue processing your payment.'}
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/payments">
                  <Button className="w-full btn-primary">
                    Try Again
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
