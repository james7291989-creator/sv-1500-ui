import React, { useState, useEffect } from 'react';

export default function AvailableDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback data so your UI never looks empty while building
  const fallbackDeals = [
    {
      id: "stl-001",
      address: "4512 St Louis Ave",
      city: "St. Louis",
      county: "St. Louis City County",
      property_type: "single family",
      distress_score: 92,
      investor_price: 105000,
      estimated_arv: 185000,
      estimated_repairs: 45000,
      status: "Under Contract"
    },
    {
      id: "aff-002",
      address: "8904 Gravois Rd",
      city: "Affton",
      county: "St. Louis County",
      property_type: "single family",
      distress_score: 88,
      investor_price: 172000,
      estimated_arv: 240000,
      estimated_repairs: 30000,
      status: "Under Contract"
    },
    {
      id: "fen-003",
      address: "12301 Fenton Main",
      city: "Fenton",
      county: "St. Louis County",
      property_type: "single family",
      distress_score: 95,
      investor_price: 200000,
      estimated_arv: 310000,
      estimated_repairs: 65000,
      status: "Under Contract"
    }
  ];

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
        const response = await fetch(`${apiUrl}/api/investors/deals`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Use real deals if available, otherwise use your Missouri portfolio
          setDeals(data.deals && data.deals.length > 0 ? data.deals : fallbackDeals);
        } else {
          setDeals(fallbackDeals);
        }
      } catch (error) {
        console.error("Failed to fetch deals", error);
        setDeals(fallbackDeals);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // --- THE $5,000 REVENUE ENGINE ---
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
        // INSTANT REDIRECT TO STRIPE
        window.location.href = data.checkout_url;
      } else {
        alert("System Error: " + (data.detail || "Could not launch Stripe checkout."));
      }
    } catch (error) {
      console.error("Payment Gateway Error:", error);
      alert("Failed to connect to the payment gateway. Check your terminal.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xl font-bold text-gray-300">Loading Available Deals...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Available Deals</h1>
        <p className="text-gray-400">Properties under contract ready for assignment</p>
        <div className="mt-4 inline-block bg-yellow-500 text-black font-bold px-3 py-1 rounded text-sm">
          PLATINUM ACCESS
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => (
          <div key={deal.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shadow-lg flex flex-col">
            <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
              <span className="bg-green-900 text-green-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                {deal.status || 'Under Contract'}
              </span>
              <span className="text-gray-400 text-sm font-bold">Score: <span className="text-white">{deal.distress_score}</span></span>
            </div>
            
            <div className="p-6 flex-grow">
              <h2 className="text-xl font-bold text-white mb-1">{deal.address}</h2>
              <p className="text-gray-400 text-sm mb-4">{deal.city}, {deal.county} • {deal.property_type}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Investor Price</span>
                  <span className="text-xl font-bold text-blue-400">${deal.investor_price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Est. ARV</span>
                  <span className="font-bold text-white">${deal.estimated_arv?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="text-gray-400">Est. Repairs</span>
                  <span className="font-bold text-red-400">${deal.estimated_repairs?.toLocaleString()}</span>
                </div>
              </div>

              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li className="flex items-center">✓ Full due diligence available</li>
                <li className="flex items-center">✓ Direct seller contact enabled</li>
                <li className="flex items-center text-yellow-500">★ Exclusive pocket listing</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-900 border-t border-gray-700 mt-auto">
              <button 
                onClick={() => handleLockDeal(deal.id)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded transition duration-200 uppercase tracking-wide"
              >
                Pay $5,000 EMD to Lock Deal
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-gray-800 p-8 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6 border-b border-gray-700 pb-4">How Deal Assignment Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <div>
            <div className="text-blue-500 text-2xl font-black mb-2">1</div>
            <strong className="block text-white mb-1">Browse Deals</strong>
            <span className="text-gray-400">View properties under contract ready for assignment.</span>
          </div>
          <div>
            <div className="text-blue-500 text-2xl font-black mb-2">2</div>
            <strong className="block text-white mb-1">Submit EMD</strong>
            <span className="text-gray-400">Lock the deal with a $5,000 non-refundable reservation fee.</span>
          </div>
          <div>
            <div className="text-blue-500 text-2xl font-black mb-2">3</div>
            <strong className="block text-white mb-1">Sign Assignment</strong>
            <span className="text-gray-400">E-sign the assignment contract digitally via DocuSign.</span>
          </div>
          <div>
            <div className="text-blue-500 text-2xl font-black mb-2">4</div>
            <strong className="block text-white mb-1">Close & Collect</strong>
            <span className="text-gray-400">Wire remaining funds to Escrow. We coordinate closing.</span>
          </div>
        </div>
      </div>
    </div>
  );
}