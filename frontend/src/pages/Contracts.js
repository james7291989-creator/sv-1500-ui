import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileSignature, ShieldCheck, Clock, FileText, Download, Lock } from 'lucide-react';

const Contracts = () => {
  const { api } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a live system, this fetches deals with status 'locked'
    setTimeout(() => {
      setContracts([]);
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
          <Lock className="w-6 h-6 text-primary absolute" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tight">
            Digital Escrow Vault
          </h1>
          <p className="text-zinc-400 font-medium flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-green-400" /> Secure Legal Agreements & Assignments
          </p>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[100px]"></div>
          
          <div className="relative z-10 max-w-lg mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/50">
              <FileSignature className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Vault is Currently Empty</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              You have no active legal assignments or Letters of Intent. Once you lock an asset from the live market board, your EMD wire instructions and digital signing packets will appear here securely.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {[
                { icon: Clock, title: '1. Lock Asset', desc: 'Execute LOI on the board' },
                { icon: ShieldCheck, title: '2. Wire EMD', desc: '$5k secures the contract' },
                { icon: Download, title: '3. Execute', desc: 'Sign closing docs digitally' }
              ].map((step, i) => (
                <div key={i} className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                  <step.icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-sm font-bold text-white mb-1">{step.title}</p>
                  <p className="text-xs text-zinc-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Active contracts will map here later */}
        </div>
      )}
    </div>
  );
};

export default Contracts;