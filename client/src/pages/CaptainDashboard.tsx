import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CaptainDashboard() {
  const navigate = useNavigate();
  const [online, setOnline] = useState(false);
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    if (online) {
       eventSource = new EventSource('http://localhost:5001/api/bids/stream');
       
       eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if(data.type === 'connected') return;
          
          // Prepend new incoming bids instantly!
          setBids(prev => [data, ...prev]);
       };

       eventSource.onerror = (e) => console.log('SSE Stream Error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [online]);

  return (
    <div style={{ padding: '2rem', background: 'var(--bg-color)', minHeight: 'calc(100vh - 84px)' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{color: '#ff6a00', margin: 0}}>Partner Dashboard</h2>
          <button 
             onClick={() => setOnline(!online)}
             style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', background: online ? '#10B981' : '#EF4444', color: 'white', fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s' }}>
             {online ? 'Online (Listening)' : 'Go Online'}
          </button>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
             <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.95rem', fontWeight: 500 }}>Today's Earnings</p>
             <h2 style={{ margin: '0.5rem 0 0', color: 'var(--text-dark)', fontSize: '1.8rem' }}>₹0</h2>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
             <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.95rem', fontWeight: 500 }}>Trips Completed</p>
             <h2 style={{ margin: '0.5rem 0 0', color: 'var(--text-dark)', fontSize: '1.8rem' }}>0</h2>
          </div>
       </div>

       <h3 style={{ marginBottom: '1rem', color: 'var(--text-dark)' }}>Live Incoming Bids</h3>
       {online ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {bids.length === 0 ? (
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', fontWeight: 500 }}>
                   Listening for nearby customer requests via SSE Map...
                </div>
             ) : (
                bids.map(bid => (
                   <div key={bid.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '5px solid #ff6a00' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{bid.customerName} <span style={{fontSize: '0.8rem', color: '#6B7280'}}>(~2.1 km away)</span></h4>
                        <span style={{ fontWeight: 800, color: '#10B981', fontSize: '1.2rem' }}>₹{bid.price}</span>
                      </div>
                      <p style={{ color: 'var(--text-light)', margin: '0.8rem 0 1.5rem', fontSize: '0.95rem' }}>1000L Pipeline Delivery Requested.</p>
                      <button className="btn-primary" onClick={() => navigate('/captain/active')} style={{ width: '100%', background: 'linear-gradient(135deg, #ff8c00, #ff6a00)', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '1.05rem' }}>Accept ₹{bid.price} Trip</button>
                   </div>
                ))
             )}
          </div>
       ) : (
          <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-light)', fontWeight: 500 }}>
             You are offline. Go online to receive order broadcasts.
          </div>
       )}
    </div>
  );
}
