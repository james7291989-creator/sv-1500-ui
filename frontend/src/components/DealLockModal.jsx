import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function DealLockModal({ property, onClose }) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleLockDeal = async () => {
    setLoading(true);
    try {
      // 1. Hit the Money Maker Endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/deals/${property.id}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 2. Redirect to Stripe Checkout for $5k EMD
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to lock deal. Please ensure your payment method is valid.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] border border-[#C1A173] rounded-lg max-w-lg w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Lock Deal: {property.address}</h2>
        
        <div className="space-y-3 mb-6 bg-black/50 p-4 rounded border border-[#333]">
          <div className="flex justify-between"><span className="text-gray-400">Investor Price:</span> <span className="text-green-400 font-bold">${property.investor_price.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Est. ARV:</span> <span className="text-white">${property.estimated_arv.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Est. Repairs:</span> <span className="text-white">${property.estimated_repairs.toLocaleString()}</span></div>
          <hr className="border-[#333] my-2"/>
          <div className="flex justify-between text-lg"><span className="text-white font-bold">Required EMD:</span> <span className="text-[#C1A173] font-bold">$5,000.00</span></div>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          By clicking lock, you will be redirected to securely pay the $5,000 non-refundable Earnest Money Deposit. This will immediately pull the property from the market and dispatch DocuSign assignment contracts to your email. Escrow will be opened with Missouri Title Loans.
        </p>

        <div className="flex space-x-4">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3 px-4 border border-[#333] text-gray-300 rounded hover:bg-[#333] transition-colors">
            Cancel
          </button>
          <button onClick={handleLockDeal} disabled={loading} className="flex-1 py-3 px-4 bg-[#C1A173] text-black font-bold rounded hover:bg-[#A88B5E] transition-colors shadow-[0_0_15px_rgba(193,161,115,0.4)]">
            {loading ? 'INITIALIZING SECURE ESCROW...' : 'PAY $5,000 EMD & LOCK'}
          </button>
        </div>
      </div>
    </div>
  );
}