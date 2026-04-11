import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function Aadhaar() {
  const [aadhaar, setAadhaar] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', {
        phoneNumber: '9999999999', role: 'CUSTOMER', name: 'Verified User', aadhaarNumber: aadhaar
      });
      navigate('/customer'); 
    } catch (err) {
      console.error(err);
      navigate('/customer'); // Bypass for dev demo if backend errs
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#F8F9FB', padding: '2rem' }}>
       <h1 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Aadhaar Verification</h1>
       <p style={{ color: 'var(--text-light)', marginBottom: '2.5rem' }}>Verify your identity for safety and trust.</p>
       
       <div className="glass-card" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--text-dark)' }}>12-Digit Aadhaar Number</label>
              <input type="text" placeholder="XXXX XXXX XXXX" value={aadhaar} onChange={e=>setAadhaar(e.target.value)} style={{ width: '100%', padding: '16px', border: '1px solid #D1D5DB', borderRadius: '12px', fontSize: '1.2rem', boxSizing: 'border-box' }} required minLength={12} maxLength={12} />
            </div>
            
            <button type="submit" className="btn-primary" style={{ padding: '18px', fontSize: '1.1rem', borderRadius: '12px' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Identity'}
            </button>

            <button type="button" onClick={() => navigate('/customer')} style={{ background: 'transparent', border: 'none', color: 'var(--primary-blue)', fontWeight: 600, cursor: 'pointer', padding: '10px', fontSize: '1rem' }}>
              Scan QR Code Instead
            </button>
          </form>
       </div>
    </div>
  );
}
