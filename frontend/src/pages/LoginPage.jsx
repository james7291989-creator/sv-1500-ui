import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  
  // SAFETY GUARD: Prevent crash if context is undefined during initial load
  const auth = useAuth() || {}; 
  const { token, login } = auth; 
  
  const [error, setError] = useState('');

  // CRACO FIX: Use process.env instead of import.meta.env
  const API_URL = process.env.REACT_APP_API_URL || 'https://rodney-vault-api.onrender.com';
  const GOOGLE_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1048450143891-9qj7p47m5b48n8b8k8p8p8p8p8p8p8p8.apps.googleusercontent.com';

  // Auto-route if already logged in
  useEffect(() => {
    if (token) {
      navigate('/available-deals');
    }
  }, [token, navigate]);

  useEffect(() => {
    const handleCredentialResponse = async (response) => {
      try {
        const res = await axios.post(`${API_URL}/api/auth/google`, {
          credential: response.credential
        });
        
        if (login) {
          login(res.data.token, res.data.user);
          
          if (res.data.user.email === 'james7291989@gmail.com') {
            navigate('/ceo-dashboard');
          } else {
            navigate('/available-deals');
          }
        }
      } catch (err) {
        console.error('Login failed:', err);
        setError('Secure handshake failed. Ensure backend is deployed.');
      }
    };

    if (window.google && !window.isGoogleInitialized) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_ID,
        callback: handleCredentialResponse
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById("google-signIn-button"),
        { theme: "filled_black", size: "large", width: 300, shape: "rectangular" }
      );
      window.isGoogleInitialized = true;
    }
  }, [login, navigate, API_URL, GOOGLE_ID]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="bg-[#1A1A1A] p-10 rounded-lg border border-[#C1A173] shadow-[0_0_30px_rgba(193,161,115,0.15)] max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Rodney & Sons</h1>
        <p className="text-[#C1A173] text-sm tracking-widest mb-8 uppercase">SV-1500 Kingdom</p>
        
        <p className="text-gray-400 mb-8 text-sm">
          Strictly for authorized investors and executive personnel. Authenticate to access the Master Vault.
        </p>
        
        <div className="flex justify-center mb-6 min-h-[44px]">
          <div id="google-signIn-button"></div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900 p-3 rounded">
            <p className="text-red-500 text-xs">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}