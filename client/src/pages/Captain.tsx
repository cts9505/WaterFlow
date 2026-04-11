import { useState } from 'react';
import { api } from '../services/api';

export default function Captain() {
  const [bookingId, setBookingId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [stats, setStats] = useState(0);

  const simulateDriving = () => {
    setIsSimulating(true);
    let lat = 19.0760; // Mumbai base
    let lng = 72.8777;

    setInterval(async () => {
      lat += (Math.random() * 0.0005) + 0.0001; // erratic organic movement
      lng += (Math.random() * 0.0005) + 0.0001; 
      
      setStats(prev => prev + 1);

      await api.post('/location', {
        bookingId,
        captainId: 'captain-uuid-999',
        lat,
        lng
      }).catch(console.error);
    }, 1000); // 1-second burst SSE
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{color: '#ff6a00', marginBottom: '0.5rem'}}>Captain Portal</h2>
      <p style={{color: 'var(--text-light)'}}>Driver dispatcher dashboard.</p>
      
      <div className="glass-card" style={{ maxWidth: '400px', marginTop: '1.5rem', borderLeft: '4px solid #ff6a00' }}>
         <h3 style={{marginTop: 0, color: '#374151'}}>Active Delivery Assignment</h3>
         <p style={{fontSize: '0.9rem', color: '#6B7280'}}>Enter the Booking ID generated in the Customer Tab to start pushing live location data to them.</p>
         
         <input 
            type="text" 
            placeholder="INV-XXXX"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #D1D5DB' }}
         />
         
         <button 
           className="btn-primary" 
           onClick={simulateDriving} 
           disabled={isSimulating || !bookingId} 
           style={{ width: '100%', background: 'linear-gradient(135deg, #ff8c00, #ff6a00)' }}>
            {isSimulating ? `Transmitting... (${stats} updates)` : 'Start Driving (Push SSE)'}
         </button>
      </div>
    </div>
  );
}
