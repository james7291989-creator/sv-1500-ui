import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { token, login } = useAuth(); 
  const [error, setError] = useState('');

  // If already logged in, push them to the right dashboard
  useEffect(() => {
    if (token) {
      navigate('/available-deals');
    }
  }, [token, navigate]);

  useEffect(() => {
    const handleCredentialResponse = async (response) => {
      try {
        // 1. Send Google's token to our new secure Python backend
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
          credential: response.credential
        });
        
        // 2. Log the user into the React frontend
        login(res.data.token, res.data.user);
        
        // 3. Routing Engine: CEO goes to Command Center, Investors go to the Vault
        if (res.data.user.email === 'james7291989@gmail.com') {
          navigate('/ceo-dashboard');
        } else {
          navigate('/available-deals');
        }
      } catch (err) {
        console.error('Login failed:', err);
        setError('Secure handshake failed. Please try again.');
      }
    };

    // Initialize the Google Button exactly once with strict pixel dimensions
    if (window.google && !window.isGoogleInitialized) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById("google-signIn-button"),
        { theme: "filled_black", size: "large", width: 300, shape: "rectangular" }
      );
      window.isGoogleInitialized = true;
    }
  }, [login, navigate]);

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