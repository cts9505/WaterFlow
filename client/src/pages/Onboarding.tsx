import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth, api } from '../context/AuthContext';
import {
  MdEmail, MdMyLocation, MdHome, MdWork, MdBusiness, MdPlace,
  MdVerifiedUser, MdArrowForward, MdArrowBack, MdLocalShipping,
  MdLocationOn, MdCheckCircle, MdWaterDrop
} from 'react-icons/md';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

const TAG_CONFIG = [
  { key: 'HOME', label: 'Home', Icon: MdHome },
  { key: 'WORK', label: 'Work', Icon: MdWork },
  { key: 'SOCIETY', label: 'Society', Icon: MdBusiness },
  { key: 'OTHER', label: 'Other', Icon: MdPlace },
];

// Draggable marker using L.marker ref (fixes "stuck pin" issue)
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

export default function Onboarding() {


  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const isCaptain = user?.role === 'CAPTAIN';
  const totalSteps = isCaptain ? 4 : 3;
  const [step, setStep] = useState(1);
  const [officeCode, setOfficeCode] = useState('');

  // Step 1: Email
  const [email, setEmail] = useState(user?.email || '');

  // Step 2 Customer: Address + GPS
  const [tag, setTag] = useState('HOME');
  const [society, setSociety] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState(0);
  const [lng, setLng] = useState(0);
  const [gpsReady, setGpsReady] = useState(false);



  // Step 3 Captain: Vehicle + Capacity + Radius
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [capacity, setCapacity] = useState(user?.tankerCapacity || 1000);

  // Step 3 Customer / Step 4 Captain: Aadhaar
  const [aadhaar, setAadhaar] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-detect GPS on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => {
        setLat(p.coords.latitude); setLng(p.coords.longitude); setGpsReady(true);
      },
      () => {
        // Fallback to Mumbai
        setLat(19.076); setLng(72.877); setGpsReady(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleStep1 = async () => {
    setErrors({});
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrors({ email: 'Enter a valid email' }); return; }
    setLoading(true);
    try {
      if (email) await api.patch('/auth/profile', { email });
      await refresh();
      setStep(2);
    } catch (e: any) {
      const se = e.response?.data?.errors;
      if (se) setErrors(se); else setErrors({ email: e.response?.data?.error || 'Failed' });
    } finally { setLoading(false); }
  };

  const handleStep2Customer = async () => {
    setErrors({});
    const e: Record<string, string> = {};
    if (!society.trim() || society.trim().length < 2) e.society = 'Society name required (min 2 chars)';
    if (!lat) e.gps = 'Please set your location';
    if (pincode && !/^\d{6}$/.test(pincode)) e.pincode = 'Must be exactly 6 digits';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await api.post('/addresses', { tag, societyName: society, addressLine, city, pincode: pincode || undefined, lat, lng, isDefault: true });
      setStep(3);
    } catch (e: any) {
      const se = e.response?.data?.errors;
      if (se) setErrors(se); else setErrors({ form: 'Failed to save address' });
    } finally { setLoading(false); }
  };

  const handleStep2Captain = async () => {
    setErrors({});
    if (!officeCode || officeCode.length < 4) { setErrors({ officeCode: 'Enter a valid Office Code' }); return; }
    setLoading(true);
    try {
      await api.post('/offices/join', { code: officeCode });
      setStep(3);
    } catch (e: any) {
      setErrors({ form: e.response?.data?.error || 'Invalid office code' });
    } finally { setLoading(false); }
  };

  const handleStep3Captain = async () => {
    setErrors({});
    const e: Record<string, string> = {};
    if (!vehicleNumber.trim() || vehicleNumber.trim().length < 4) e.vehicle = 'Enter a valid vehicle number';
    if (capacity < 100) e.capacity = 'Minimum 100L';
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await api.patch('/auth/profile', { vehicleNumber, tankerCapacity: capacity });
      await refresh();
      setStep(4);
    } catch (e: any) {
      const se = e.response?.data?.errors;
      if (se) setErrors(se); else setErrors({ form: 'Failed to save' });
    } finally { setLoading(false); }
  };

  const handleAadhaar = async () => {
    setErrors({});
    if (!/^\d{12}$/.test(aadhaar)) { setErrors({ aadhaar: 'Aadhaar must be exactly 12 digits' }); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-aadhaar', { aadhaarNumber: aadhaar });
      await refresh();
      navigate(isCaptain ? '/captain' : '/home');
    } catch (e: any) {
      const se = e.response?.data?.errors;
      if (se) setErrors(se); else setErrors({ aadhaar: 'Verification failed' });
    } finally { setLoading(false); }
  };

  const aadhaarStep = isCaptain ? 4 : 3;
  const progressPct = (step / totalSteps) * 100;

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'white' }}>
      {/* Header */}
      <div style={{ background: isCaptain ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'linear-gradient(135deg, #1A56DB, #1E40AF)', padding: '48px 24px 28px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          {step > 1 && <button onClick={() => setStep(step - 1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><MdArrowBack size={18} /></button>}
          <MdWaterDrop size={24} />
          <h2 style={{ margin: 0 }}>Setup your account</h2>
        </div>
        <p style={{ opacity: 0.75, fontSize: '0.85rem' }}>Step {step} of {totalSteps}</p>
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', marginTop: '14px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'white', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {errors.form && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>{errors.form}</div>}

        {/* STEP 1: Email */}
        {step === 1 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdEmail size={22} color="#1A56DB" /></div>
              <div><h3 style={{ margin: 0 }}>Email Address</h3><p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>For receipts and notifications</p></div>
            </div>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Email</label>
              <input type="email" placeholder="raj@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              {errors.email && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.email}</span>}
            </div>
            <button className="btn btn-blue" onClick={handleStep1} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? 'Saving...' : 'Continue'} {!loading && <MdArrowForward size={18} />}
            </button>
            <button onClick={() => setStep(2)} style={{ width: '100%', border: 'none', background: 'none', color: '#6B7280', marginTop: '12px', cursor: 'pointer', fontWeight: 500 }}>Skip for now</button>
          </div>
        )}

        {/* STEP 2 CUSTOMER: Address */}
        {step === 2 && !isCaptain && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdLocationOn size={22} color="#1A56DB" /></div>
              <div><h3 style={{ margin: 0 }}>Delivery Address</h3><p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>Drag the pin to set your location</p></div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {TAG_CONFIG.map(({ key, label, Icon }) => (
                <button key={key} onClick={() => setTag(key)} style={{ flex: 1, padding: '10px 0', border: `2px solid ${tag === key ? '#1A56DB' : '#E5E7EB'}`, borderRadius: '10px', background: tag === key ? '#EEF2FF' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <Icon size={18} color={tag === key ? '#1A56DB' : '#9CA3AF'} /><span style={{ fontSize: '0.72rem', fontWeight: 600, color: tag === key ? '#1A56DB' : '#6B7280' }}>{label}</span>
                </button>
              ))}
            </div>
            <div style={{ height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px', border: '2px solid #1A56DB' }}>
              {gpsReady ? (
                <MapContainer center={[lat, lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} key="cust-addr">
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <DraggablePin lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln); }} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
                  <MdMyLocation size={32} color="#1A56DB" style={{ animation: 'pulse 1.5s infinite' }} /><span style={{ marginLeft: '8px', color: '#6B7280' }}>Detecting GPS...</span>
                </div>
              )}
            </div>
            {gpsReady && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', marginBottom: '10px' }}>{lat.toFixed(5)}, {lng.toFixed(5)}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div className="input-group"><label>Society / Building *</label><input placeholder="e.g. Lodha Park" value={society} onChange={e => setSociety(e.target.value)} />{errors.society && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.society}</span>}</div>
              <div className="input-group"><label>Flat / Floor</label><input placeholder="B-404, 4th Floor" value={addressLine} onChange={e => setAddressLine(e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group"><label>City</label><input value={city} onChange={e => setCity(e.target.value)} /></div>
                <div className="input-group"><label>Pincode</label><input placeholder="400001" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} maxLength={6} />{errors.pincode && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.pincode}</span>}</div>
              </div>
              {errors.gps && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.gps}</span>}
            </div>
            <button className="btn btn-blue" onClick={handleStep2Customer} disabled={loading}>{loading ? 'Saving...' : 'Continue'}</button>
          </div>
        )}

        {/* STEP 2 CAPTAIN: Mandatory Fleet Join */}
        {step === 2 && isCaptain && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdBusiness size={22} color="#F97316" /></div>
              <div><h3 style={{ margin: 0 }}>Join Your Fleet</h3><p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>You must join an approved office to operate.</p></div>
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Office Invite Code *</label>
              <input 
                placeholder="E.g. 4821" 
                value={officeCode} 
                onChange={e => setOfficeCode(e.target.value)} 
                maxLength={6} 
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 700 }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '6px', textAlign: 'center' }}>Ask your Office Owner for their unique 4-digit code.</p>
              {errors.officeCode && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.officeCode}</span>}
            </div>

            <button className="btn btn-blue" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }} onClick={handleStep2Captain} disabled={loading}>
              {loading ? 'Verifying Code...' : 'Join Office & Continue'} {!loading && <MdArrowForward size={18} />}
            </button>
          </div>
        )}

        {/* STEP 3 CAPTAIN: Vehicle + Capacity + Radius */}
        {step === 3 && isCaptain && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdLocalShipping size={22} color="#F97316" /></div>
              <div><h3 style={{ margin: 0 }}>Tanker Details</h3><p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>Tell us about your vehicle</p></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div className="input-group">
                <label>Vehicle Number *</label>
                <input placeholder="MH 02 AB 1234" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} />
                {errors.vehicle && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.vehicle}</span>}
              </div>
              <div className="input-group">
                <label>Tanker Capacity</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[500, 1000, 2000, 5000].map(c => (
                    <button key={c} onClick={() => setCapacity(c)} type="button" style={{ flex: 1, padding: '10px 0', border: `2px solid ${capacity === c ? '#F97316' : '#E5E7EB'}`, borderRadius: '10px', background: capacity === c ? '#FFF7ED' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: capacity === c ? '#F97316' : '#6B7280' }}>{c}L</button>
                  ))}
                </div>
                {errors.capacity && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.capacity}</span>}
              </div>

            </div>
            <button className="btn btn-blue" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }} onClick={handleStep3Captain} disabled={loading}>
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Aadhaar Step */}
        {step === aadhaarStep && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MdVerifiedUser size={22} color="#16A34A" /></div>
              <div><h3 style={{ margin: 0 }}>Identity Verification</h3><p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#6B7280' }}>Aadhaar number for KYC</p></div>
            </div>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Aadhaar Number (12 digits)</label>
              <input placeholder="XXXX XXXX XXXX" value={aadhaar} maxLength={12} onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))} />
              {errors.aadhaar && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.aadhaar}</span>}
            </div>
            <button className="btn btn-blue" onClick={handleAadhaar} disabled={loading} style={{ background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? 'Verifying...' : 'Verify & Continue'} {!loading && <MdCheckCircle size={18} />}
            </button>
            <button onClick={() => navigate(isCaptain ? '/captain' : '/home')} style={{ width: '100%', border: 'none', background: 'none', color: '#6B7280', marginTop: '12px', cursor: 'pointer', fontWeight: 500 }}>Skip for now</button>
          </div>
        )}
      </div>
    </div>
  );
}
