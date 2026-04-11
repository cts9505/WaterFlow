import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { MdArrowBack, MdSend, MdCheckCircle } from 'react-icons/md';

export default function SetPrice() {
  const [price, setPrice] = useState(500);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const broadcast = async () => {
    setLoading(true);
    try {
      await api.post('/bids', { price, dropoffLat: 19.076, dropoffLng: 72.877, societyName: 'Custom bid' });
      setSent(true);
      setTimeout(() => navigate('/home'), 2500);
    } catch { alert('Failed to broadcast'); }
    finally { setLoading(false); }
  };

  if (sent) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px', padding: '40px' }}>
      <MdCheckCircle size={56} color="#16A34A" />
      <h2 style={{ textAlign: 'center' }}>Broadcast Sent!</h2>
      <p style={{ color: '#6B7280', textAlign: 'center' }}>Captains nearby have been notified. Redirecting...</p>
    </div>
  );

  const suggestions = [350, 500, 700, 1000];

  return (
    <div className="page">
      <div style={{ background: '#1A56DB', padding: '48px 24px 28px', color: 'white' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginBottom: '12px' }}>
          <MdArrowBack size={20} />
        </button>
        <h2 style={{ margin: 0 }}>Set Your Budget</h2>
        <p style={{ opacity: 0.8, marginTop: '4px', fontSize: '0.9rem' }}>Captains near you will respond to your request</p>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '8px' }}>Your offer</p>
          <div style={{ fontSize: '3.2rem', fontWeight: 800, color: '#1A56DB' }}>₹{price}</div>
          <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '4px' }}>Market rate: ₹500–₹700</p>
        </div>

        <input type="range" min={200} max={1500} step={50} value={price} onChange={e => setPrice(+e.target.value)}
          style={{ width: '100%', accentColor: '#1A56DB', marginBottom: '20px' }} />

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '28px' }}>
          {suggestions.map(s => (
            <button key={s} onClick={() => setPrice(s)}
              style={{ padding: '8px 14px', borderRadius: '20px', border: `2px solid ${price === s ? '#1A56DB' : '#E5E7EB'}`, background: price === s ? '#EEF2FF' : 'white', color: price === s ? '#1A56DB' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>₹{s}</button>
          ))}
        </div>

        <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px', background: '#F9FAFB', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#6B7280' }}>Your offer</span><span style={{ fontWeight: 600 }}>₹{price}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6B7280' }}>Delivery fee</span><span style={{ fontWeight: 600 }}>₹0</span>
          </div>
        </div>

        <button className="btn btn-blue" onClick={broadcast} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <MdSend size={18} />{loading ? 'Broadcasting...' : 'Broadcast to Captains'}
        </button>
      </div>
    </div>
  );
}
