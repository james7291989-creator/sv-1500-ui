import React, { useState, useEffect } from 'react';

export default function AvailableDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
        const response = await fetch(`${apiUrl}/api/investors/deals`, {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDeals(data.deals || []);
        } else {
          setDeals([]);
        }
      } catch (error) {
        console.error("Failed to fetch deals", error);
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const handleLockDeal = async (propertyId) => {
    try {
      const token = localStorage.getItem("token"); 
      const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
      
      const response = await fetch(`${apiUrl}/api/payments/create-checkout?payment_type=emd&property_id=${propertyId}`, {
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
        alert("System Error: " + (data.detail || "Could not launch Stripe checkout."));
      }
    } catch (error) {
      console.error("Payment Error:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-white">Loading Live Inventory...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Available Deals</h1>
        <p className="text-gray-400">Exclusive inventory under contract. Cleared for assignment.</p>
      </div>

      {deals.length === 0 ? (
        <div className="bg-gray-800 p-12 text-center rounded-lg border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-2">Inventory Sold Out</h2>
          <p className="text-gray-400">All current contracts have been assigned. New distressed assets drop daily at 8:00 AM EST.</p>
          <p className="mt-4 text-yellow-500 font-bold">Platinum Tier members get 30-minute early access via SMS.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <div key={deal.property_id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg flex flex-col">
              <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                <span className="bg-green-900 text-green-300 text-xs font-bold px-2 py-1 rounded uppercase">UNDER CONTRACT</span>
                <span className="text-gray-400 text-sm font-bold">Distress Score: <span className="text-white">{deal.distress_score}</span></span>
              </div>
              <div className="p-6 flex-grow">
                <h2 className="text-xl font-bold text-white mb-1">{deal.address}</h2>
                <p className="text-gray-400 text-sm mb-4">{deal.city}, {deal.county}</p>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Investor Price</span>
                    <span className="font-bold text-blue-400">${deal.investor_price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Est. ARV</span>
                    <span className="font-bold text-white">${deal.estimated_arv?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-900 border-t border-gray-700 mt-auto">
                <button onClick={() => handleLockDeal(deal.property_id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition uppercase">
                  Pay $5,000 EMD to Lock Deal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}