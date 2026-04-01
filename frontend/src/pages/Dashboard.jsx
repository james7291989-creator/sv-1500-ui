import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardDeals = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || 'https://rodney-vault-api.onrender.com';
        
        const response = await fetch(`${apiUrl}/api/properties?limit=6`, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a192f] to-slate-900 p-6 font-sans text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* QUANTUM CORE BANNER - Liquid Glass */}
        <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex justify-between items-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-200 mb-2 tracking-tight">
              Command Center
            </h1>
            <p className="text-slate-400 text-lg font-light tracking-wide">Live Missouri Pipeline Active.</p>
          </div>
          <div className="text-right relative z-10">
            <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold px-5 py-2.5 rounded-full text-sm tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              Platinum Tier
            </span>
          </div>
        </div>

        {/* METRICS - Glassmorphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Active Deals", value: deals.length, status: "LIVE SYNC", color: "text-cyan-400" },
            { label: "Closed Volume", value: "$0", status: "LIFETIME", color: "text-slate-400" },
            { label: "AI Underwriter", value: "STANDBY", status: "AWAITING FUSION", color: "text-purple-400" },
            { label: "POF Status", value: "VERIFIED", status: "SECURE", color: "text-green-400" }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.15em] mb-2">{stat.label}</p>
              <h2 className={`text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</h2>
              <p className="text-slate-500 text-xs mt-3 font-medium tracking-wider">{stat.status}</p>
            </div>
          ))}
        </div>

        {/* INVENTORY - Liquid Glass Grid */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-black/20">
            <div>
              <h3 className="text-2xl font-bold text-slate-100 tracking-tight">Live Market Assets</h3>
              <p className="text-sm text-slate-400 mt-1 font-light">Real-time county distress data</p>
            </div>
            <Link to="/properties" className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm tracking-wide transition-colors">
              VIEW FULL VAULT →
            </Link>
          </div>
          
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 mb-4 font-light text-lg">Inventory array empty.</p>
                <button className="bg-cyan-600/20 border border-cyan-500 hover:bg-cyan-500 text-cyan-50 font-bold py-2.5 px-6 rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  Force Network Sync
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {deals.map(deal => (
                  <Link to={`/properties/${deal.id || deal._id}`} key={deal.id || deal._id}>
                    <div className="group bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer relative h-full flex flex-col justify-between hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:-translate-y-1">
                      
                      {/* Top Section */}
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                            Available
                          </span>
                          <span className="text-slate-500 text-xs font-mono">{deal.county || "MO"}</span>
                        </div>
                        <h4 className="text-xl font-bold text-slate-200 mb-1 leading-tight group-hover:text-cyan-400 transition-colors">
                          {deal.address || "Classified Asset"}
                        </h4>
                        <p className="text-sm text-slate-500 font-light">{deal.city || "St. Louis Market"}</p>
                      </div>

                      {/* Bottom Section */}
                      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Asking</p>
                          <p className="text-slate-200 font-mono font-bold text-lg">${deal.asking_price?.toLocaleString() || "TBD"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Score</p>
                          <p className="text-cyan-400 font-black text-2xl drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
                            {deal.distress_score || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}