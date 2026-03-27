import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function DealLockModal({ property, onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { token } = useAuth();

  const handleInitiateContract = async () => {
    setLoading(true);
    try {
      // 1. Hit the backend to log the Letter of Intent and alert the CEO
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/deals/${property.id}/lock`,
        { type: 'letter_of_intent' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(true);
      setLoading(false);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to initiate contract. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1A1A1A] border border-green-500 rounded-lg max-w-lg w-full p-8 text-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <h2 className="text-3xl font-bold text-green-400 mb-4">DEAL INITIATED</h2>
          <p className="text-gray-300 mb-6">
            Your Letter of Intent for <strong>{property.address}</strong> has been securely transmitted to our acquisitions team. 
          </p>
          <p className="text-sm text-gray-400 mb-6">
            We are verifying clear title and finalizing the A-to-B holding contracts. You will receive a DocuSign assignment agreement and your $5,000 EMD Stripe Invoice via email within 24 hours to open escrow with Missouri Title Loans.
          </p>
          <button onClick={() => window.location.reload()} className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded hover:bg-green-700">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] border border-[#C1A173] rounded-lg max-w-lg w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4">Initiate Contract: {property.address}</h2>
        
        <div className="space-y-3 mb-6 bg-black/50 p-4 rounded border border-[#333]">
          <div className="flex justify-between"><span className="text-gray-400">Investor Price:</span> <span className="text-green-400 font-bold">${property.investor_price.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Est. ARV:</span> <span className="text-white">${property.estimated_arv.toLocaleString()}</span></div>
          <hr className="border-[#333] my-2"/>
          <div className="flex justify-between text-lg"><span className="text-white font-bold">Pending EMD:</span> <span className="text-[#C1A173] font-bold">$5,000.00</span></div>
        </div>

        <div className="bg-red-900/20 border border-red-900 p-4 rounded mb-6">
          <p className="text-xs text-gray-300 font-mono">
            <strong>LEGAL NOTICE:</strong> By clicking below, you are submitting a binding Letter of Intent to acquire this asset. You will not be charged today. Once our team verifies clear title and holding status, you will be emailed the official assignment contract and the $5,000 EMD invoice to open escrow.
          </p>
        </div>

        <div className="flex space-x-4">
          <button onClick={onClose} disabled={loading} className="flex-1 py-3 px-4 border border-[#333] text-gray-300 rounded hover:bg-[#333]">
            Cancel
          </button>
          <button onClick={handleInitiateContract} disabled={loading} className="flex-1 py-3 px-4 bg-[#C1A173] text-black font-bold rounded hover:bg-[#A88B5E]">
            {loading ? 'TRANSMITTING LOI...' : 'SUBMIT BINDING OFFER'}
          </button>
        </div>
      </div>
    </div>
  );
}