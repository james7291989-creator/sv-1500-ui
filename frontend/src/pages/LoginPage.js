import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';

// 🛑 YOUR OFFICIAL GOOGLE MASTER KEY
const GOOGLE_CLIENT_ID = "783162825648-1nllnud8mm7ibuflli1ttrhpd58oo7c8.apps.googleusercontent.com";

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError('');
    
    try {
      // THE BULLETPROOF FIX: Hardwired to your live Render backend
      const baseUrl = 'https://rodney-vault-api.onrender.com';

      const response = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token: credentialResponse.credential
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to verify with the live server.');
      }

      // The backend says "You are good!" and hands us our own VIP Pass
      const { token: appToken, user } = data;
      
      // Save the VIP Pass to local storage
      localStorage.setItem('token', appToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Force a hard reload to the dashboard so the AuthContext catches the new token
      window.location.href = '/dashboard';

    } catch (err) {
      console.error("Backend Handshake Failed:", err);
      setError("Server Error: Render might still be deploying the new code. Wait 60 seconds and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <div className="max-w-md w-full p-8 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Rodney & Sons</h2>
            <p className="text-zinc-400 mt-2">Sign in to access the SV-1500 Kingdom.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            
            {/* OFFICIAL GOOGLE BUTTON */}
            {isLoading ? (
                <div className="flex justify-center py-3 bg-zinc-800 rounded-md border border-zinc-700">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
            ) : (
                <div className="flex justify-center w-full bg-white rounded-md overflow-hidden hover:opacity-90 transition-opacity">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google Handshake Failed')}
                    theme="outline"
                    size="large"
                    text="continue_with"
                    width="100%"
                />
                </div>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500">More Options Coming Soon</span>
              </div>
            </div>

            {/* APPLE PLACEHOLDER */}
            <button disabled className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-black border border-zinc-700 text-white rounded-md font-medium opacity-50 cursor-not-allowed">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" display="none"/><path d="M15.195 4.39A4.18 4.18 0 0016.2 1.346c-1.22.046-2.585.803-3.41 1.765-.738.85-1.332 2.112-1.144 3.327 1.319.1 2.628-.68 3.549-2.048zm-4.417 12.33c-1.558 0-2.812-1.042-4.04-1.042-1.258 0-2.56.993-4.053 1.042-1.956.07-3.784-1.139-4.802-2.901-2.071-3.578-.532-8.88 1.487-11.78 1.002-1.428 2.505-2.333 4.14-2.368 1.488-.035 2.887.994 4.095.994 1.22 0 2.87-1.198 4.606-1.031 1.952.095 3.725.795 4.935 2.535-3.893 2.33-3.321 7.747.533 9.356-1.033 2.512-2.316 4.936-4.901 4.89z"/></svg>
              Continue with Apple
            </button>

            {/* LINKEDIN PLACEHOLDER */}
            <button disabled className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#0A66C2] text-white rounded-md font-medium opacity-50 cursor-not-allowed">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              Continue with LinkedIn
            </button>

          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;