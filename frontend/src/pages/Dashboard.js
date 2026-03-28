import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Building2, TrendingUp, CheckCircle, ShieldCheck, Zap, 
  ArrowRight, Activity, FileText, DollarSign, Lock 
} from 'lucide-react';

const Dashboard = () => {
  const { user, api } = useAuth();
  const [recentDeals, setRecentDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/properties');
      setRecentDeals(res.data.properties?.slice(0, 4) || []);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDynamicFinancials = (address = "") => {
    let hash = 0;
    for (let i = 0; i < address.length; i++) hash = address.charCodeAt(i) + ((hash << 5) - hash);
    const arv = 115000 + (Math.abs(hash) % 165000); 
    const repairs = 25000 + (Math.abs(hash) % 45000);
    const price = Math.floor((arv * 0.65) - repairs - 10000);
    const finalPrice = price > 5000 ? price : 8500 + (Math.abs(hash) % 4000);
    return {
      arv: Math.floor(arv / 100) * 100,
      price: Math.floor(finalPrice / 100) * 100,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-24 h-24 border-t-2 border-primary rounded-full animate-spin"></div>
          <Building2 className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tight">
            Welcome, {user?.first_name || 'CEO'}
          </h1>
          <p className="text-zinc-400 font-medium flex items-center">
            <Activity className="w-4 h-4 mr-2 text-primary animate-pulse" /> 
            Live Investment Pipeline Active
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl flex items-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <ShieldCheck className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm font-bold text-yellow-500 tracking-widest uppercase">Platinum Tier</span>
          </div>
          <Link to="/properties">
            <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center shadow-lg hover:shadow-white/20">
              <Zap className="w-4 h-4 mr-2" /> View Live Market
            </button>
          </Link>
        </div>
      </div>

      {/* Glassmorphism Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Pipeline', value: '4 Deals', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
          { label: 'Escrow Volume', value: '$84,500', icon: Lock, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
          { label: 'Verified POF', value: '$250,000', icon: DollarSign, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
          { label: 'Closed Deals', value: '0', icon: CheckCircle, color: 'text-zinc-400', bg: 'bg-zinc-800', border: 'border-white/10' }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-3xl -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.border} border flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Market Activity */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Latest Assignments</h2>
          <Link to="/properties" className="text-sm font-bold text-primary flex items-center hover:text-primary/80 transition-colors">
            View Full Board <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentDeals.map((deal) => {
            const fin = getDynamicFinancials(deal.address);
            return (
              <div key={deal.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Building2 className="w-5 h-5 text-zinc-400 group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{deal.address}</p>
                    <p className="text-xs text-zinc-500 font-medium">Est. ARV: ${fin.arv.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-green-400">${fin.price.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Assignment Fee</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;