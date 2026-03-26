import React, { useState, useEffect } from 'react';

export default function AvailableDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
        const response = await fetch(`${apiUrl}/api/properties?limit=50`, {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDeals(data.properties || []);
        }
      } catch (error) {
        console.error("Failed to fetch deals", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  // THE SAAS REVENUE ENGINE: UPGRADE TO PLATINUM ($1,497/mo)
  const handleUpgrade = async () => {
    try {
      const token = localStorage.getItem("token"); 
      const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/payments/create-checkout?payment_type=subscription&tier=platinum`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert("System Error: Ensure you are logged in to upgrade.");
      }
    } catch (error) {
      console.error("Payment Error:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Syncing County Records...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 border-b border-gray-700 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wide">County Trustee Data Feed</h1>
          <p className="text-gray-400">Live API sync of tax-default and post-auction county inventory.</p>
        </div>
        <div className="text-right">
          <span className="bg-red-900 text-red-300 font-bold px-3 py-1 rounded text-sm uppercase">Data Locked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => (
          <div key={deal.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg flex flex-col relative">
            
            {/* SAAS PAYWALL OVERLAY */}
            <div className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex flex-col justify-center items-center z-10 p-6 text-center">
              <svg className="w-12 h-12 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <h3 className="text-xl font-bold text-white mb-2">Platinum Access Required</h3>
              <p className="text-gray-300 text-sm mb-6">Unlock exact addresses, owner data, and parcel IDs to acquire this asset directly from the county.</p>
              <button onClick={handleUpgrade} className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 px-4 rounded transition uppercase shadow-lg">
                Unlock Data - $1,497/mo
              </button>
            </div>

            <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center opacity-40">
              <span className="bg-red-900 text-red-300 text-xs font-bold px-2 py-1 rounded uppercase">TRUSTEE LIST</span>
              <span className="text-gray-400 text-sm font-bold">Years Delinquent: <span className="text-white">{deal.tax_delinquency_years}</span></span>
            </div>
            
            <div className="p-6 flex-grow opacity-40">
              <h2 className="text-xl font-bold text-gray-500 mb-1 blur-sm">123 Hidden Address Ln</h2>
              <p className="text-gray-400 text-sm mb-4">{deal.city}, {deal.county} • {deal.property_type}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Back Taxes Owed</span>
                  <span className="font-bold text-red-400">${deal.tax_delinquency_amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Est. ARV</span>
                  <span className="font-bold text-white">${deal.estimated_arv?.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-widest">{deal.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}