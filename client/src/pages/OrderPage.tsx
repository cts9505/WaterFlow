import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../context/AuthContext';
import { MdArrowBack, MdHome, MdWork, MdBusiness, MdPlace, MdLocalShipping, MdSend } from 'react-icons/md';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

const TAG_CONFIG = [
  { key: 'HOME', label: 'Home', Icon: MdHome },
  { key: 'WORK', label: 'Work', Icon: MdWork },
  { key: 'SOCIETY', label: 'Society', Icon: MdBusiness },
  { key: 'OTHER', label: 'Other', Icon: MdPlace },
];

const CAPACITY_OPTIONS = [
  { litres: 500, label: '500L', desc: 'Small' },
  { litres: 1000, label: '1000L', desc: 'Medium' },
  { litres: 2000, label: '2000L', desc: 'Large' },
  { litres: 5000, label: '5000L', desc: 'XL' },
];

const MapUpdater = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng]); }, [lat, lng, map]);
  return null;
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function OrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;

  const specificCaptain = state?.captainId ? { id: state.captainId, capacityLitres: state.capacityLitres, name: state.captainName, vehicle: state.captainVehicle, price: state.captainPrice || 500 } : null;
  const filterCapacity = state?.filterCapacity || null;

  const [tag, setTag] = useState<string>('HOME');
  const [society, setSociety] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState<number>(state?.dropLat || 0);
  const [lng, setLng] = useState<number>(state?.dropLng || 0);
  const [capacity, setCapacity] = useState<number>(specificCaptain?.capacityLitres || filterCapacity || 1000);
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usingSavedId, setUsingSavedId] = useState<string | null>(null);

  // Rapido-style price slider
  const [bidPrice, setBidPrice] = useState(specificCaptain?.price || 500);

  // Fetch live rates for the selected capacity
  const [captainsForCapacity, setCaptainsForCapacity] = useState<any[]>([]);
  useEffect(() => {
    if (lat && !specificCaptain) {
      api.get(`/captains/nearby?lat=${lat}&lng=${lng}`).then(r => {
        const all = r.data.captains || [];
        const matched = all.filter((c: any) => !c.isBusy && c.capacityLitres === capacity);
        setCaptainsForCapacity(matched);
        if (matched.length > 0) {
          const avg = Math.round(matched.reduce((s: number, c: any) => s + (c.basePrice || 500), 0) / matched.length);
          setBidPrice(avg);
        }
      }).catch(() => {});
    }
  }, [capacity, lat]);

  const liveMin = captainsForCapacity.length > 0 ? Math.min(...captainsForCapacity.map(c => c.basePrice || 500)) : 200;
  const liveMax = captainsForCapacity.length > 0 ? Math.max(...captainsForCapacity.map(c => c.basePrice || 500)) : 1500;

  useEffect(() => {
    api.get('/addresses').then(r => {
      const addrs = r.data.addresses || [];
      setSavedAddresses(addrs);
      if (lat && addrs.length > 0) {
        for (const a of addrs) {
          if (haversine(lat, lng, a.lat, a.lng) < 0.5) { pickSavedAddress(a); return; }
        }
      }
      const def = addrs.find((a: any) => a.isDefault);
      if (def && !state?.dropLat) pickSavedAddress(def);
    }).catch(() => {});

    if (!state?.dropLat) {
      navigator.geolocation.getCurrentPosition(p => { setLat(p.coords.latitude); setLng(p.coords.longitude); }, () => {}, { enableHighAccuracy: true });
    }
  }, []);

  const pickSavedAddress = (addr: any) => {
    setSociety(addr.societyName || '');
    setAddressLine(addr.addressLine || '');
    setCity(addr.city || 'Mumbai');
    setTag(addr.tag || 'HOME');
    setLat(addr.lat);
    setLng(addr.lng);
    setPincode(addr.pincode || '');
    setUsingSavedId(addr.id);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!society.trim() || society.trim().length < 2) e.society = 'Society name must be at least 2 characters';
    if (pincode && !/^\d{6}$/.test(pincode)) e.pincode = 'Pincode must be exactly 6 digits';
    if (!lat || !lng) e.gps = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const confirmBooking = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (!usingSavedId) {
        api.post('/addresses', { tag, societyName: society, addressLine, city, pincode: pincode || undefined, lat, lng }).catch(() => {});
      }
      const r = await api.post('/bookings', {
        price: bidPrice,
        capacityLitres: capacity,
        dropoffLat: lat, dropoffLng: lng,
        societyName: society, addressLine, city,
        addressTag: tag,
        preferredCaptainId: specificCaptain?.id,
      });
      navigate(`/track/${r.data.booking.id}`);
    } catch (e: any) {
      const errs = e.response?.data?.errors;
      if (errs && typeof errs === 'object') setErrors(errs);
      else alert(e.response?.data?.error || 'Failed to create booking');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div style={{ background: '#1A56DB', padding: '48px 20px 20px', color: 'white' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginBottom: '12px' }}>
          <MdArrowBack size={20} />
        </button>
        <h2 style={{ margin: 0 }}>
          {specificCaptain ? 'Confirm Booking' : 'Book a Tanker'}
        </h2>
        <p style={{ opacity: 0.8, fontSize: '0.875rem', marginTop: '4px' }}>
          {specificCaptain ? `${specificCaptain.name || 'Captain'} — ${specificCaptain.vehicle || ''} (${specificCaptain.capacityLitres}L)` : 'Choose your size and set your price'}
        </p>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        {/* Specific captain badge */}
        {specificCaptain && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#EEF2FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', border: '1.5px solid #1A56DB' }}>
            <MdLocalShipping size={20} color="#1A56DB" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>Water Supplier Office</p>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>{specificCaptain.capacityLitres}L Tanker</p>
            </div>
            <span style={{ fontWeight: 700, color: '#1A56DB' }}>₹{specificCaptain.price}</span>
          </div>
        )}

        {/* Saved addresses */}
        {savedAddresses.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Addresses</p>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {savedAddresses.map(a => {
                const IconC = TAG_CONFIG.find(t => t.key === a.tag)?.Icon || MdPlace;
                const isActive = usingSavedId === a.id;
                return (
                  <button key={a.id} onClick={() => pickSavedAddress(a)}
                    style={{ flexShrink: 0, padding: '8px 14px', border: `1.5px solid ${isActive ? '#1A56DB' : '#E5E7EB'}`, borderRadius: '10px', background: isActive ? '#EEF2FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: isActive ? '#1A56DB' : '#374151' }}>
                    <IconC size={16} color={isActive ? '#1A56DB' : '#6B7280'} />{a.societyName || a.tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Map preview */}
        {lat > 0 && (
          <div style={{ height: '120px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', border: '1px solid #E5E7EB' }}>
            <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} dragging={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <Marker position={[lat, lng]}>
                 <Popup>Your Delivery Location</Popup>
              </Marker>
              <MapUpdater lat={lat} lng={lng} />
            </MapContainer>
          </div>
        )}

        {/* Address fields */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {TAG_CONFIG.map(({ key, label, Icon: IconC }) => (
            <button key={key} onClick={() => { setTag(key); setUsingSavedId(null); }}
              style={{ flex: 1, padding: '8px 0', border: `2px solid ${tag === key ? '#1A56DB' : '#E5E7EB'}`, borderRadius: '10px', background: tag === key ? '#EEF2FF' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <IconC size={16} color={tag === key ? '#1A56DB' : '#9CA3AF'} />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: tag === key ? '#1A56DB' : '#6B7280' }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          <div className="input-group"><label>Society / Building *</label><input placeholder="e.g. Lodha Park" value={society} onChange={e => { setSociety(e.target.value); setUsingSavedId(null); }} />{errors.society && <span style={{ color: '#DC2626', fontSize: '0.8rem' }}>{errors.society}</span>}</div>
          <div className="input-group"><label>Flat / Floor</label><input placeholder="B-404" value={addressLine} onChange={e => { setAddressLine(e.target.value); setUsingSavedId(null); }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="input-group"><label>City</label><input value={city} onChange={e => setCity(e.target.value)} /></div>
            <div className="input-group"><label>Pincode</label><input placeholder="400001" value={pincode} onChange={e => setPincode(e.target.value)} maxLength={6} />{errors.pincode && <span style={{ color: '#DC2626', fontSize: '0.8rem' }}>{errors.pincode}</span>}</div>
          </div>
          {errors.gps && <span style={{ color: '#DC2626', fontSize: '0.8rem' }}>{errors.gps}</span>}
        </div>

        {/* Capacity — hidden if specific captain */}
        {!specificCaptain && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: 700, marginBottom: '10px', fontSize: '0.9rem' }}>Tanker Size</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CAPACITY_OPTIONS.map(opt => (
                <button key={opt.litres} onClick={() => setCapacity(opt.litres)}
                  style={{ flex: 1, padding: '10px 0', border: `2px solid ${capacity === opt.litres ? '#1A56DB' : '#E5E7EB'}`, borderRadius: '10px', background: capacity === opt.litres ? '#EEF2FF' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: capacity === opt.litres ? '#1A56DB' : '#6B7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  {opt.label}
                  <span style={{ fontSize: '0.65rem', fontWeight: 400 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
            {captainsForCapacity.length > 0 && (
              <p style={{ color: '#16A34A', fontSize: '0.78rem', marginTop: '6px', fontWeight: 600 }}>
                {captainsForCapacity.length} captain{captainsForCapacity.length > 1 ? 's' : ''} available · ₹{liveMin}–₹{liveMax}
              </p>
            )}
            {captainsForCapacity.length === 0 && lat > 0 && (
              <p style={{ color: '#F97316', fontSize: '0.78rem', marginTop: '6px', fontWeight: 500 }}>
                No captains with this size online yet — you can still set a price
              </p>
            )}
          </div>
        )}

        {/* Rapido-style Price Slider */}
        <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '18px', marginBottom: '20px', border: '1.5px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>Set Your Price</p>
            {captainsForCapacity.length > 0 && <span style={{ fontSize: '0.72rem', color: '#6B7280' }}>Avg: ₹{Math.round(captainsForCapacity.reduce((s: number, c: any) => s + (c.basePrice || 500), 0) / captainsForCapacity.length)}</span>}
          </div>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#1A56DB' }}>₹{bidPrice}</span>
          </div>
          <input type="range" min={Math.max(100, liveMin - 200)} max={liveMax + 500} step={25} value={bidPrice} onChange={e => setBidPrice(+e.target.value)}
            style={{ width: '100%', accentColor: '#1A56DB', marginBottom: '10px', height: '6px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>₹{Math.max(100, liveMin - 200)}</span>
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>₹{liveMax + 500}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {[liveMin, Math.round((liveMin + liveMax) / 2), liveMax, liveMax + 200].filter((v, i, a) => a.indexOf(v) === i).map(s => (
              <button key={s} onClick={() => setBidPrice(s)} style={{ padding: '5px 12px', borderRadius: '14px', border: `1.5px solid ${bidPrice === s ? '#1A56DB' : '#E5E7EB'}`, background: bidPrice === s ? '#EEF2FF' : 'white', color: bidPrice === s ? '#1A56DB' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}>₹{s}</button>
            ))}
          </div>
        </div>

        {/* Captains for this capacity — with distance from office */}
        {!specificCaptain && captainsForCapacity.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Available Captains ({capacity}L)</p>
            {captainsForCapacity.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', marginBottom: '6px' }}>
                <MdLocalShipping size={18} color="#1A56DB" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: '0.88rem' }}>{capacity}L Water Tanker</p>
                  <p style={{ fontSize: '0.72rem', color: '#6B7280', margin: '1px 0 0' }}>
                    Available nearby · Office is {c.distanceKm}km away
                  </p>
                </div>
                <span style={{ fontWeight: 700, color: '#16A34A', fontSize: '0.95rem' }}>₹{c.basePrice}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={confirmBooking} disabled={loading}
          style={{ width: '100%', padding: '16px', background: loading ? '#9CA3AF' : 'linear-gradient(135deg, #1A56DB, #1339A8)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <MdSend size={18} />
          {loading ? 'Placing...' : specificCaptain ? `Book — ₹${bidPrice}` : `Send to all ${capacity}L captains — ₹${bidPrice}`}
        </button>
      </div>
    </div>
  );
}
