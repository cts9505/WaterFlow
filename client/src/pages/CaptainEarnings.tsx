import { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { MdTrendingUp, MdLocalShipping, MdAttachMoney, MdCheckCircle } from 'react-icons/md';
import BottomNav from './BottomNav';

export default function CaptainEarnings() {
  const [stats, setStats] = useState({ todayEarnings: 0, todayTrips: 0, totalEarnings: 0, totalTrips: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/auth/captain/stats').catch(() => ({ data: { stats: { todayEarnings: 0, todayTrips: 0, totalEarnings: 0, totalTrips: 0 } } })),
      api.get('/bookings/my').catch(() => ({ data: { bookings: [] } }))
    ]).then(([statsRes, histRes]) => {
      setStats(statsRes.data.stats);
      setHistory(histRes.data.bookings.filter((b: any) => b.status === 'DELIVERED'));
      setLoading(false);
    });
  }, []);

  return (
    <div className="page" style={{ paddingBottom: '80px', background: '#F9FAFB', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', padding: '48px 24px 34px', color: 'white', borderRadius: '0 0 24px 24px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdTrendingUp size={24} /> My Earnings
        </h2>
        
        <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
          <p style={{ margin: '0 0 4px', fontSize: '0.9rem', opacity: 0.9 }}>Today's Earnings</p>
          <p style={{ margin: 0, fontSize: '3rem', fontWeight: 800 }}>₹{stats.todayEarnings}</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', marginTop: '10px', fontSize: '0.85rem' }}>
            <MdLocalShipping size={14} /> {stats.todayTrips} trips today
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '0.85rem', marginBottom: '8px' }}>
              <MdAttachMoney size={16} /> Total Earned
            </div>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1F2937' }}>₹{stats.totalEarnings}</p>
          </div>
          <div style={{ background: 'white', padding: '16px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '0.85rem', marginBottom: '8px' }}>
              <MdCheckCircle size={16} /> Total Trips
            </div>
            <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1F2937' }}>{stats.totalTrips}</p>
          </div>
        </div>

        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#1F2937' }}>Recent Payouts</h3>
        
        {loading ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>Loading history...</p>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
            <MdLocalShipping size={48} color="#D1D5DB" />
            <p style={{ color: '#6B7280', fontWeight: 500, margin: '12px 0 0' }}>No completed trips yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {history.map((trip: any) => (
              <div key={trip.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#374151', fontSize: '0.95rem' }}>{trip.societyName || trip.city || 'Delivery'}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>{new Date(trip.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#16A34A', fontSize: '1.1rem' }}>+ ₹{trip.price}</p>
                  <span style={{ display: 'inline-block', background: '#DCFCE7', color: '#16A34A', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '8px', marginTop: '4px', fontWeight: 600 }}>PAID</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav role="CAPTAIN" />
    </div>
  );
}
