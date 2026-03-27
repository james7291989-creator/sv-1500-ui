import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { token, login } = useAuth(); 
  const [error, setError] = useState('');

  // CRACO/CRA Syntax: process.env.REACT_APP_...
  // Fallback to your production URLs if env variables are missing
  const API_URL = process.env.REACT_APP_API_URL || 'https://rodney-vault-api.onrender.com';
  const GOOGLE_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '1048450143891-9qj7p47m5b48n8b8k8p8p8p8p8p8p8p8.apps.googleusercontent.com'; // Use your actual Client ID here

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
        
        login(res.data.token, res.data.user);
        
        if (res.data.user.email === 'james7291989@gmail.com') {
          navigate('/ceo-dashboard');
        } else {
          navigate('/available-deals');
        }
      } catch (err) {
        console.error('Login failed:', err);
        setError('Handshake failed. Backend might be waking up.');
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
        <p className="text-[#C1A173] text-sm tracking-widest mb-8 uppercase text-shadow-gold">SV-1500 Kingdom</p>
        
        <p className="text-gray-400 mb-8 text-sm">
          Strictly for authorized investors. Access the 100+ Live Asset Vault.
        </p>
        
        <div className="flex justify-center mb-6 min-h-[44px]">
          <div id="google-signIn-button"></div>
        </div>

        {error && (
          <div className="bg-red-900/10 border border-red-900/50 p-3 rounded">
            <p className="text-red-500 text-xs font-mono uppercase tracking-tighter">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}