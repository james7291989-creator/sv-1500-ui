import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DealLockModal from '../components/DealLockModal';

export default function AvailableDeals() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/properties`);
        setProperties(response.data.properties || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch properties", error);
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading Master Inventory...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[#C1A173] mb-8">Available Deals (Missouri)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((prop) => (
          <div key={prop.id} className="bg-[#1A1A1A] border border-[#333] rounded-lg p-6 hover:border-[#C1A173] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{prop.address}</h3>
              <span className="bg-red-900/50 text-red-400 text-xs px-2 py-1 rounded">Distress: {prop.distress_score}/100</span>
            </div>
            
            <div className="space-y-2 mb-6 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">City:</span> <span className="text-white">{prop.city}, {prop.state}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Est. ARV:</span> <span className="text-white">${prop.estimated_arv?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Est. Repairs:</span> <span className="text-red-400">${prop.estimated_repairs?.toLocaleString()}</span></div>
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-[#333]"><span className="text-gray-300">Investor Price:</span> <span className="text-green-400">${prop.investor_price?.toLocaleString()}</span></div>
            </div>

            <button 
              onClick={() => setSelectedProperty(prop)}
              className="w-full py-3 bg-[#C1A173] text-black font-bold rounded hover:bg-[#A88B5E] shadow-[0_0_10px_rgba(193,161,115,0.3)] transition-all"
            >
              VIEW & LOCK DEAL
            </button>
          </div>
        ))}
        {properties.length === 0 && (
          <div className="text-gray-500 col-span-full">No deals currently available. Vault is empty.</div>
        )}
      </div>

      {/* This is the Money Maker Modal we just built */}
      {selectedProperty && (
        <DealLockModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
        />
      )}
    </div>
  );
}