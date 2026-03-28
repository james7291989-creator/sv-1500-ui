import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, MapPin, ArrowRight, ShieldCheck, X, Loader2, TrendingUp, Activity, Search, Lock } from 'lucide-react';
import { toast } from 'sonner';

const Properties = () => {
  const { api } = useAuth();
  const [properties, setProperties] = useState([]);
  const [view, setView] = useState('leads'); // 'leads' or 'wholesale'
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties');
      setProperties(res.data.properties || []);
    } catch (error) {
      toast.error('Could not load market data.');
    } finally {
      setLoading(false);
    }
  };

  const getFinancials = (address = "", status = "lead") => {
    let hash = 0;
    for (let i = 0; i < address.length; i++) hash = address.charCodeAt(i) + ((hash << 5) - hash);
    const arv = Math.floor((115000 + (Math.abs(hash) % 165000)) / 1000) * 1000; 
    const price = Math.floor((arv * 0.60) / 100) * 100;
    const emd = Math.max(1000, Math.floor((price * 0.02) / 100) * 100);

    return { arv, price, emd, roi: 35 + (hash % 15) };
  };

  const filteredProps = properties.filter(p => view === 'wholesale' ? p.status === 'contract' : p.status !== 'contract');

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* APPLE STYLE TOGGLE */}
      <div className="flex justify-center">
        <div className="bg-white/5 backdrop-blur-xl p-1 rounded-2xl border border-white/10 flex">
          <button 
            onClick={() => setView('leads')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'leads' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            🎯 Open Market Leads
          </button>
          <button 
            onClick={() => setView('wholesale')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'wholesale' ? 'bg-primary text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            💼 Executive Vault
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredProps.map((prop) => {
          const fin = getFinancials(prop.address, prop.status);
          return (
            <div key={prop.id} onClick={() => setSelectedProperty({...prop, fin})} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-zinc-800 rounded-2xl group-hover:text-primary transition-colors">
                  <Building2 size={24} />
                </div>
                {view === 'wholesale' && <div className="text-right text-green-400 font-black text-xl">${fin.price.toLocaleString()}</div>}
              </div>
              <h3 className="text-white font-bold text-lg truncate">{prop.address}</h3>
              <p className="text-zinc-500 text-sm mb-4">{prop.city}, MO</p>
              
              <button className="w-full py-3 rounded-xl font-bold bg-white/5 border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-all">
                {view === 'leads' ? 'Unlock Owner Data' : 'Execute Deal Lock'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Properties;