import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../context/AuthContext';
import { MdArrowBack, MdPhone, MdCheckCircle, MdAccessTime, MdLocalShipping, MdCancel, MdClose } from 'react-icons/md';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

const captainLiveIcon = new L.DivIcon({
  html: `<div style="background:#1A56DB;color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(26,86,219,0.4);border:3px solid white;"><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='white'><path d='M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z'/></svg></div>`,
  className: '', iconSize: [40, 40], iconAnchor: [20, 20],
});

const dropIcon = new L.DivIcon({
  html: `<div style="background:#EF4444;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(239,68,68,0.4);border:2px solid white;"><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='white'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/></svg></div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 36],
});

function FlyToMarker({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { if (pos[0]) map.panTo(pos, { animate: true }); }, [pos]);
  return null;
}

const STATUS_STEPS = ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED'];

export default function LiveTracking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [tankerPos, setTankerPos] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [sseConnected, setSseConnected] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Fetch booking details
  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking)).catch(() => {});
    const interval = setInterval(() => {
      api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking)).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // SSE for live captain location — NO auth needed (public SSE endpoint)
  useEffect(() => {
    if (!bookingId) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const es = new EventSource(`${baseUrl}/api/tracking/${bookingId}`);
    es.onopen = () => setSseConnected(true);
    es.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        if (d.lat && d.lng) setTankerPos([d.lat, d.lng]);
      } catch {}
    };
    es.onerror = () => setSseConnected(false);
    return () => es.close();
  }, [bookingId]);

  // Fetch road route via OSRM when we have both positions
  useEffect(() => {
    if (!tankerPos || !booking) return;
    const [tLat, tLng] = tankerPos;
    const dLat = booking.dropoffLat;
    const dLng = booking.dropoffLng;
    fetch(`https://router.project-osrm.org/route/v1/driving/${tLng},${tLat};${dLng},${dLat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(d => {
        if (d.routes?.[0]?.geometry?.coordinates) {
          setRouteCoords(d.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]));
        }
      }).catch(() => {});
  }, [tankerPos, booking]);

  const statusStep = booking ? STATUS_STEPS.indexOf(booking.status) : 0;
  const dropLat = booking?.dropoffLat || 0;
  const dropLng = booking?.dropoffLng || 0;

  if (!booking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7280' }}>
        <MdLocalShipping size={32} style={{ marginRight: '8px' }} /> Loading booking...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #E5E7EB', background: 'white', zIndex: 2, flexShrink: 0 }}>
        <button onClick={() => navigate('/orders')} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <MdArrowBack size={18} color="#374151" />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Live Tracking</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>{booking.societyName || 'Delivery location'}</p>
        </div>
        <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, background: booking.status === 'DELIVERED' ? '#F0FDF4' : booking.status === 'IN_TRANSIT' ? '#EEF2FF' : '#FFF7ED', color: booking.status === 'DELIVERED' ? '#16A34A' : booking.status === 'IN_TRANSIT' ? '#1A56DB' : '#F97316' }}>
          {booking.status}
        </span>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={dropLat ? [dropLat, dropLng] : [19.076, 72.877]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          {dropLat && <Marker position={[dropLat, dropLng]} icon={dropIcon}><Popup>Drop-off</Popup></Marker>}
          {tankerPos && <Marker position={tankerPos} icon={captainLiveIcon}><Popup>Tanker live position</Popup></Marker>}
          {tankerPos && <FlyToMarker pos={tankerPos} />}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#1A56DB', weight: 4, dashArray: '8 4' }} />}
        </MapContainer>

        {/* Status Card */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: '16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', zIndex: 500 }}>
          <div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px', margin: '0 auto 14px' }} />

          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '3px' }}>
            {STATUS_STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: i <= statusStep ? '#1A56DB' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: i <= statusStep ? 'white' : '#9CA3AF', fontWeight: 700, flexShrink: 0 }}>
                  {i < statusStep ? <MdCheckCircle size={14} /> : i + 1}
                </div>
                {i < 3 && <div style={{ flex: 1, height: '3px', background: i < statusStep ? '#1A56DB' : '#E5E7EB', borderRadius: '2px', margin: '0 2px' }} />}
              </div>
            ))}
          </div>

          {/* Status Text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            {booking.status === 'PENDING' && <><MdAccessTime size={20} color="#F97316" /><p style={{ margin: 0, fontWeight: 600 }}>Finding a captain nearby...</p></>}
            {booking.status === 'ACCEPTED' && <><MdCheckCircle size={20} color="#16A34A" /><p style={{ margin: 0, fontWeight: 600 }}>Captain is on the way!</p></>}
            {booking.status === 'IN_TRANSIT' && <><MdLocalShipping size={20} color="#1A56DB" /><p style={{ margin: 0, fontWeight: 600 }}>Tanker heading to you!</p></>}
            {booking.status === 'DELIVERED' && <><MdCheckCircle size={20} color="#16A34A" /><p style={{ margin: 0, fontWeight: 600 }}>Delivered successfully!</p></>}
          </div>

          {/* SSE status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sseConnected ? '#16A34A' : '#9CA3AF' }} />
            <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>{sseConnected ? 'Live tracking active' : 'Connecting...'}</span>
          </div>

          {/* Captain info */}
          {booking.captain && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F9FAFB', borderRadius: '12px', padding: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdLocalShipping size={20} color="#1A56DB" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{booking.captain.name}</p>
                <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0' }}>{booking.captain.vehicleNumber || 'Tanker'}</p>
              </div>
              <a href={`tel:${booking.captain.phoneNumber}`} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <MdPhone size={16} color="white" />
              </a>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '8px 0', borderTop: '1px solid #F3F4F6' }}>
            <span style={{ color: '#6B7280', fontSize: '0.85rem' }}>Amount</span>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>₹{booking.price}</span>
          </div>

          {/* Cancel button */}
          {['PENDING', 'ACCEPTED', 'IN_TRANSIT'].includes(booking.status) && (
            <button onClick={() => setShowCancelModal(true)}
              style={{ width: '100%', padding: '12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '10px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
              <MdCancel size={16} /> Cancel Order
            </button>
          )}

          {/* Cancelled info */}
          {booking.status === 'CANCELLED' && booking.cancelReason && (
            <div style={{ background: '#FEF2F2', padding: '10px 14px', borderRadius: '8px', marginTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#DC2626', fontWeight: 600 }}>Cancelled by {booking.cancelledBy?.toLowerCase()}</p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>{booking.cancelReason}</p>
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Cancel Order</h3>
                <button onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MdClose size={20} color="#6B7280" /></button>
              </div>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '12px' }}>Please tell us why you're cancelling:</p>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Found another supplier, wrong address..."
                rows={3} style={{ width: '100%', padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => setShowCancelModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: '10px', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Back</button>
                <button disabled={cancelReason.trim().length < 3 || cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    try {
                      await api.post(`/bookings/${bookingId}/cancel`, { reason: cancelReason.trim() });
                      setShowCancelModal(false);
                      navigate('/orders');
                    } catch (e: any) { alert(e.response?.data?.error || 'Failed to cancel'); }
                    finally { setCancelling(false); }
                  }}
                  style={{ flex: 1, padding: '12px', background: cancelReason.trim().length >= 3 ? '#DC2626' : '#D1D5DB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: cancelReason.trim().length >= 3 ? 'pointer' : 'not-allowed' }}>
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
