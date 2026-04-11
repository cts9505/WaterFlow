import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../context/AuthContext';
import { MdArrowBack, MdBusiness, MdCheckCircle } from 'react-icons/md';

function DraggablePin({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!markerRef.current) {
      const m = L.marker([lat, lng], { draggable: true }).addTo(map);
      m.on('dragend', () => { const p = m.getLatLng(); onChange(p.lat, p.lng); });
      markerRef.current = m;
      map.setView([lat, lng], 15);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  useEffect(() => {
    return () => { if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; } };
  }, []);

  return null;
}

export default function CreateOffice() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<any>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => { setLat(p.coords.latitude); setLng(p.coords.longitude); },
      () => { setLat(19.076); setLng(72.877); },
      { enableHighAccuracy: true }
    );
  }, []);

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Office name required (min 2 chars)';
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) e.phone = 'Enter valid 10-digit number';
    if (!lat || !lng) e.location = 'Set your office location on the map';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const r = await api.post('/offices', { name, phone, ownerName: ownerName || undefined, address: address || undefined, city, lat, lng, serviceRadiusKm: radius });
      setCreated(r.data.office);
    } catch (err: any) {
      if (err.response?.data?.errors) setErrors(Object.fromEntries(err.response.data.errors.map((e: any) => [e.field, e.message])));
      else setErrors({ form: err.response?.data?.error || 'Failed to create office' });
    } finally { setLoading(false); }
  };

  if (created) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <MdCheckCircle size={48} color="#16A34A" />
        </div>
        <h2 style={{ marginBottom: '8px' }}>Office Created!</h2>
        <p style={{ color: '#6B7280', marginBottom: '24px' }}>Share this code with captains to join your office</p>
        <div style={{ background: 'linear-gradient(135deg, #1A56DB, #1E40AF)', color: 'white', padding: '24px 48px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 8px 32px rgba(26,86,219,0.3)' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Office Code</p>
          <p style={{ fontSize: '3rem', fontWeight: 800, margin: 0, letterSpacing: '8px' }}>{created.code}</p>
        </div>
        <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '24px' }}>{created.name} · {created.city}</p>
        <button className="btn btn-blue" onClick={() => navigate('/captain')} style={{ maxWidth: '200px' }}>Go to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg, #1A56DB, #1E40AF)', padding: '48px 20px 20px', color: 'white' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginBottom: '12px' }}>
          <MdArrowBack size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MdBusiness size={28} />
          <div>
            <h2 style={{ margin: 0 }}>Create Office</h2>
            <p style={{ opacity: 0.8, fontSize: '0.85rem', marginTop: '2px' }}>Set up your water supply depot</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        {/* Map */}
        {lat > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>📍 Drag pin to set office location</p>
            <div style={{ height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
              <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <DraggablePin lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
              </MapContainer>
            </div>
            {errors.location && <span style={{ color: '#DC2626', fontSize: '0.8rem' }}>{errors.location}</span>}
          </div>
        )}

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="input-group">
            <label>Office Name *</label>
            <input placeholder="e.g. Sharma Water Supply" value={name} onChange={e => setName(e.target.value)} />
            {errors.name && <span style={{ color: '#DC2626', fontSize: '0.8rem' }}>{errors.name}</span>}
          </div>
          <div className="input-group">
            <label>Contact Phone *</label>
            <input placeholder="10-digit number" value={phone} onChange={e => setPhone(e.target.value)} maxLength={10} />
            {errors.phone && <span style={{ color: '#DC2626', fontSize: '0.8rem' }}>{errors.phone}</span>}
          </div>
          <div className="input-group">
            <label>Owner Name</label>
            <input placeholder="Your name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Address</label>
            <input placeholder="Street, area" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="input-group">
            <label>City</label>
            <input value={city} onChange={e => setCity(e.target.value)} />
          </div>

          {/* Service radius slider */}
          <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#6B7280' }}>Service Radius</label>
              <span style={{ fontWeight: 800, color: '#1A56DB', fontSize: '1.1rem' }}>{radius} km</span>
            </div>
            <input type="range" min={1} max={50} step={1} value={radius} onChange={e => setRadius(+e.target.value)}
              style={{ width: '100%', accentColor: '#1A56DB' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9CA3AF' }}>
              <span>1 km</span><span>50 km</span>
            </div>
          </div>

          {errors.form && <div style={{ background: '#FEF2F2', padding: '10px 14px', borderRadius: '8px', color: '#DC2626', fontSize: '0.85rem' }}>{errors.form}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{ width: '100%', padding: '16px', background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #1A56DB, #1E40AF)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
            <MdBusiness size={18} />
            {loading ? 'Creating...' : 'Create Office'}
          </button>
        </div>
      </div>
    </div>
  );
}
