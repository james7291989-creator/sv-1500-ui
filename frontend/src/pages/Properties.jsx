import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fetch strictly from the live Render backend
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/properties`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProperties(res.data.properties || []);
      } catch (error) {
        console.error('Error fetching live properties:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProperties();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-[#C1A173] text-xl font-bold tracking-widest animate-pulse">
          CONNECTING TO SECURE VAULT...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Master Property Database</h1>
          <p className="text-gray-400">{properties.length} authentic assets synced from Missouri Trustee Data</p>
        </div>
      </div>
      
      {properties.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#333] p-12 rounded-lg text-center">
          <div className="text-4xl mb-4">🗄️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Vault Empty</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            The database is currently secure and empty. Waiting for the CEO to execute the Python data injector.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(prop => (
            <div key={prop.id} className="bg-[#1A1A1A] border border-[#333] p-6 rounded-lg hover:border-[#C1A173] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{prop.address}</h3>
                  <p className="text-gray-400">{prop.city}, {prop.state} {prop.zip_code}</p>
                </div>
                <span className="bg-[#2A2A2A] text-[#C1A173] px-3 py-1 rounded text-sm font-bold border border-[#C1A173]/30">
                  {prop.distress_score} Score
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-[#333]">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Est. ARV</span>
                  <span className="text-white">${(prop.estimated_arv || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Tax Delinquency</span>
                  <span className="text-red-400 font-bold">${(prop.tax_delinquency_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}