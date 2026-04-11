import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../context/AuthContext';
import { MdArrowBack, MdPhone, MdLocationOn, MdCheckCircle, MdNavigation, MdCancel, MdClose } from 'react-icons/md';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

const dropIcon = new L.DivIcon({
  html: `<div style="background:#EF4444;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(239,68,68,0.4);border:2px solid white;"><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='white'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'/></svg></div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 36],
});

const captainLiveIcon = new L.DivIcon({
  html: `<div style="background:#1A56DB;color:white;border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(26,86,219,0.4);border:3px solid white;"><svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='white'><path d='M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z'/></svg></div>`,
  className: '', iconSize: [42, 42], iconAnchor: [21, 21],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { if (lat) map.panTo([lat, lng], { animate: true }); }, [lat, lng]);
  return null;
}

export default function CaptainActiveDelivery() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);
  const [pos, setPos] = useState({ lat: 0, lng: 0 });
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [pings, setPings] = useState(0);
  const watchRef = useRef<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Fetch booking details
  useEffect(() => {
    api.get(`/bookings/${bookingId}`).then(r => setBooking(r.data.booking)).catch(() => {});
  }, [bookingId]);

  // Continuous GPS streaming → backend → Kafka/SSE → Customer
  useEffect(() => {
    watchRef.current = navigator.geolocation.watchPosition(
      async (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        const heading = p.coords.heading ?? undefined;
        setPos({ lat, lng });
        setPings(n => n + 1);
        await api.post('/captains/location', { bookingId, lat, lng, heading }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );
    return () => { if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current); };
  }, [bookingId]);

  // OSRM Road Route from captain position to drop-off
  useEffect(() => {
    if (!pos.lat || !booking?.dropoffLat) return;
    const timer = setTimeout(() => {
      fetch(`https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${booking.dropoffLng},${booking.dropoffLat}?overview=full&geometries=geojson`)
        .then(r => r.json())
        .then(d => {
          if (d.routes?.[0]?.geometry?.coordinates) {
            setRouteCoords(d.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]));
          }
        }).catch(() => {});
    }, 1000); // Debounce route fetching
    return () => clearTimeout(timer);
  }, [pos.lat, pos.lng, booking]);

  const markDelivered = async () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    await api.patch(`/bookings/${bookingId}/status`, { status: 'DELIVERED' });
    navigate('/captain');
  };

  if (!pos.lat) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '8px', color: '#F97316' }}>
        <MdNavigation size={32} /> Acquiring GPS...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', background: '#F97316', display: 'flex', alignItems: 'center', gap: '12px', color: 'white', flexShrink: 0 }}>
        <button onClick={() => navigate('/captain')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
          <MdArrowBack size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Active Delivery</p>
          <p style={{ margin: 0, fontSize: '0.78rem', opacity: 0.85 }}>{booking?.societyName || 'En route...'}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          {pings} updates
        </div>
      </div>

      {/* Map with Route */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={[pos.lat, pos.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <FlyTo lat={pos.lat} lng={pos.lng} />
          <Marker position={[pos.lat, pos.lng]} icon={captainLiveIcon}><Popup>Your position</Popup></Marker>
          {booking?.dropoffLat && <Marker position={[booking.dropoffLat, booking.dropoffLng]} icon={dropIcon}><Popup>{booking.societyName}</Popup></Marker>}
          {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: '#F97316', weight: 5, dashArray: '8 4' }} />}
        </MapContainer>

        {/* Bottom card */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', padding: '16px', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', zIndex: 500 }}>
          <div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px', margin: '0 auto 14px' }} />

          <div style={{ display: 'flex', gap: '12px', background: '#F9FAFB', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <MdLocationOn size={16} color="#EF4444" />
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>Drop Location</p>
              </div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{booking?.societyName || 'Loading...'}</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>{booking?.addressLine}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280', marginBottom: '4px' }}>Fare</p>
              <p style={{ margin: 0, fontWeight: 800, color: '#16A34A', fontSize: '1.15rem' }}>₹{booking?.price}</p>
            </div>
          </div>

          {booking?.customer && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdPhone size={18} color="#1A56DB" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{booking.customer.name}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#6B7280' }}>{booking.customer.phoneNumber}</p>
              </div>
              <a href={`tel:${booking.customer.phoneNumber}`} style={{ background: '#EEF2FF', padding: '8px 16px', borderRadius: '20px', color: '#1A56DB', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>Call</a>
            </div>
          )}

          <button onClick={markDelivered}
            style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <MdCheckCircle size={20} /> Mark as Delivered
          </button>

          <button onClick={() => setShowCancelModal(true)}
            style={{ width: '100%', padding: '12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '10px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px' }}>
            <MdCancel size={16} /> Cancel Delivery
          </button>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '340px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Cancel Delivery</h3>
                <button onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><MdClose size={20} color="#6B7280" /></button>
              </div>
              <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '12px' }}>Please tell us why you're cancelling:</p>
              <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="e.g. Vehicle breakdown, unreachable location..."
                rows={3} style={{ width: '100%', padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={() => setShowCancelModal(false)}
                  style={{ flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: '10px', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Back</button>
                <button disabled={cancelReason.trim().length < 3 || cancelling}
                  onClick={async () => {
                    setCancelling(true);
                    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
                    try {
                      await api.post(`/bookings/${bookingId}/cancel`, { reason: cancelReason.trim() });
                      setShowCancelModal(false);
                      navigate('/captain');
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
