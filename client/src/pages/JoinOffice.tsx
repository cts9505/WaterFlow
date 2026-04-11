import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { MdArrowBack, MdGroupAdd, MdHourglassTop } from 'react-icons/md';

export default function JoinOffice() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!/^\d{4}$/.test(code.trim())) {
      setError('Enter a valid 4-digit office code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/offices/join', { code: code.trim() });
      setSuccess(r.data.officeName);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to join office');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <MdHourglassTop size={42} color="#F97316" />
        </div>
        <h2 style={{ marginBottom: '8px' }}>Request Sent!</h2>
        <p style={{ color: '#6B7280', marginBottom: '8px' }}>Your join request for <strong>{success}</strong> has been sent.</p>
        <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '24px' }}>The office owner will review and approve your request.</p>
        <button className="btn btn-orange" onClick={() => navigate('/captain')} style={{ maxWidth: '200px' }}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', padding: '48px 20px 20px', color: 'white' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginBottom: '12px' }}>
          <MdArrowBack size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdGroupAdd size={28} />
          <div>
            <h2 style={{ margin: 0 }}>Join Office</h2>
            <p style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '2px' }}>Enter the 4-digit code from your office</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ background: '#F9FAFB', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '320px', textAlign: 'center', border: '1.5px solid #E5E7EB' }}>
          <p style={{ fontWeight: 600, color: '#6B7280', fontSize: '0.85rem', marginBottom: '16px' }}>Enter Office Code</p>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
            placeholder="0000"
            maxLength={4}
            style={{
              textAlign: 'center', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '12px',
              width: '100%', padding: '16px', border: `2px solid ${error ? '#DC2626' : '#E5E7EB'}`,
              borderRadius: '12px', outline: 'none', background: 'white', color: '#1A56DB',
            }}
          />
          {error && <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '8px' }}>{error}</p>}

          <button onClick={handleJoin} disabled={loading || code.length < 4}
            style={{
              width: '100%', padding: '16px', marginTop: '20px',
              background: code.length === 4 && !loading ? 'linear-gradient(135deg, #F97316, #EA580C)' : '#D1D5DB',
              color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700,
              fontSize: '1rem', cursor: code.length === 4 && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            <MdGroupAdd size={18} />
            {loading ? 'Joining...' : 'Join Office'}
          </button>
        </div>

        <p style={{ color: '#9CA3AF', fontSize: '0.8rem', marginTop: '24px', textAlign: 'center', maxWidth: '280px' }}>
          Ask your office owner for the 4-digit code. Once you join, they'll need to approve your request.
        </p>
      </div>
    </div>
  );
}
