import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardDeals = async () => {
      try {
        // SECURE VAULT UPDATE: Switched to sessionStorage
        const token = sessionStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
        
        // Fetch only the 3 most recent properties from the live database
        const response = await fetch(`${apiUrl}/api/properties?limit=3`, {
          headers: { "Authorization": token ? `Bearer ${token}` : "" }
        });
        
        if (response.ok) {
          const data = await response.json();
          setDeals(data.properties || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard deals", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardDeals();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-8 border border-gray-700 shadow-xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, James</h1>
          <p className="text-gray-400">Here's what's happening with your investment pipeline</p>
        </div>
        <div className="text-right">
          <span className="bg-yellow-500 text-black font-black px-4 py-2 rounded-lg text-lg tracking-wider shadow-lg">PLATINUM TIER</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Available Deals</p>
          <h2 className="text-4xl font-black text-white">{deals.length}</h2>
          <p className="text-green-400 text-xs mt-2 font-bold">LIVE SYNC</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Deals Closed</p>
          <h2 className="text-4xl font-black text-white">0</h2>
          <p className="text-gray-500 text-xs mt-2">Lifetime total</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Subscription</p>
          <h2 className="text-3xl font-black text-green-400 uppercase">Active</h2>
          <p className="text-blue-400 text-xs mt-2 cursor-pointer hover:underline">Manage subscription</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">POF Verified</p>
          <h2 className="text-3xl font-black text-white">$0</h2>
          <p className="text-blue-400 text-xs mt-2 cursor-pointer hover:underline">Verify funds</p>
        </div>
      </div>

      {/* Live Deals Widget */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
          <div>
            <h3 className="text-xl font-bold text-white">Latest Market Assets</h3>
            <p className="text-sm text-gray-400">Recently detected county inventory</p>
          </div>
          <Link to="/available-deals" className="text-blue-400 hover:text-blue-300 font-bold text-sm">View All →</Link>
        </div>
        
        <div className="p-6">
          {loading ? (
            <p className="text-gray-400 text-center py-4">Syncing with database...</p>
          ) : deals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No live inventory found.</p>
              <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded text-sm">Force Sync Data</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {deals.map(deal => (
                <div key={deal.id} className="bg-gray-900 p-5 rounded border border-gray-700 hover:border-blue-500 transition cursor-pointer relative">
                  <div className="absolute top-0 right-0 bg-red-900 text-red-300 text-xs font-bold px-2 py-1 rounded-bl">LOCKED</div>
                  <h4 className="text-lg font-bold text-gray-400 mb-1 blur-sm">{deal.address || "123 Hidden St"}</h4>
                  <p className="text-sm text-gray-500 mb-3">{deal.city}, {deal.county}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Est. ARV</p>
                      <p className="text-white font-bold">${deal.estimated_arv?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase">Score</p>
                      <p className="text-yellow-500 font-black text-xl">{deal.distress_score}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}