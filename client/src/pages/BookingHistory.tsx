import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { MdLocalShipping, MdReceipt, MdLocationOn } from 'react-icons/md';
import BottomNav from './BottomNav';

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#FFF7ED', color: '#F97316' },
  ACCEPTED: { bg: '#EEF2FF', color: '#1A56DB' },
  IN_TRANSIT: { bg: '#EEF2FF', color: '#1A56DB' },
  DELIVERED: { bg: '#F0FDF4', color: '#16A34A' },
  CANCELLED: { bg: '#FEF2F2', color: '#DC2626' },
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api.get('/bookings/my').then(r => setBookings(r.data.bookings)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      <div style={{ padding: '48px 20px 16px', background: 'white', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
        <h2 style={{ margin: 0 }}>My Orders</h2>
      </div>

      <div style={{ padding: '16px' }}>
        {loading && <p style={{ textAlign: 'center', color: '#6B7280', padding: '40px 0' }}>Loading orders...</p>}
        {!loading && bookings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <MdReceipt size={48} color="#D1D5DB" />
            <h3 style={{ marginTop: '12px', marginBottom: '8px' }}>No orders yet</h3>
            <p style={{ color: '#6B7280', marginBottom: '24px' }}>Book your first water tanker today!</p>
            <button className="btn btn-blue" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={() => navigate('/home')}>Book Now</button>
          </div>
        )}

        {bookings.map((b: any) => {
          const s = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
          return (
            <div key={b.id} onClick={() => navigate(`/track/${b.id}`)}
              style={{ border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '14px', marginBottom: '10px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MdLocationOn size={16} color="#EF4444" />
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{b.societyName || b.city || 'Delivery'}</p>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0' }}>
                    {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 600 }}>{b.status}</span>
              </div>
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#6B7280' }}>
                  <MdLocalShipping size={14} /> {b.capacityLitres}L tanker
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{b.price}</span>
              </div>
              {b.status === 'CANCELLED' && b.cancelReason && (
                <div style={{ marginTop: '6px', background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px' }}>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#DC2626', fontWeight: 600 }}>
                    Cancelled by {b.cancelledBy?.toLowerCase() || 'unknown'}: <span style={{ fontWeight: 400, color: '#6B7280' }}>{b.cancelReason}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav role={user?.role === 'CAPTAIN' ? 'CAPTAIN' : 'CUSTOMER'} />
    </div>
  );
}
