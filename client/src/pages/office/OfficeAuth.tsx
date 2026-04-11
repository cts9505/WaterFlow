import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../../context/AuthContext';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdWaterDrop, MdBusiness, MdArrowForward, MdPhone, MdPerson, MdLock, MdLocationOn } from 'react-icons/md';

function DraggablePin({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!markerRef.current) {
      const m = L.marker([lat, lng], { draggable: true }).addTo(map);
      m.on('dragend', () => { const p = m.getLatLng(); onChange(p.lat, p.lng); });
      markerRef.current = m;
      map.setView([lat, lng], 14);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  useEffect(() => {
    return () => { if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; } };
  }, []);

  return null;
}

export default function OfficeAuth() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'AUTH' | 'SETUP'>('AUTH');
  
  // Auth state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Office Setup state
  const [officeName, setOfficeName] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [radius, setRadius] = useState(10);
  const [lat, setLat] = useState(19.076);
  const [lng, setLng] = useState(72.877);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'SETUP') {
      navigator.geolocation.getCurrentPosition(
        p => { setLat(p.coords.latitude); setLng(p.coords.longitude); },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [step]);

  const handleAuth = async () => {
    setErrors({});
    const e: Record<string, string> = {};
    if (!/^[6-9]\d{9}$/.test(phone)) e.phoneNumber = 'Enter a valid 10-digit Indian mobile number';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (tab === 'register' && name.trim().length < 2) e.name = 'Name is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(phone, password, 'CAPTAIN');
        navigate('/manage/dashboard');
      } else {
        await register({ phoneNumber: phone, password, name, role: 'CAPTAIN' });
        // Authentication succeeded. Now they need to generate their office
        setStep('SETUP');
      }
    } catch (err: any) {
      setErrors({ form: err.response?.data?.error || 'Authentication failed' });
    } finally { setLoading(false); }
  };

  const handleSetup = async () => {
    setErrors({});
    if (officeName.trim().length < 2) { setErrors({ officeName: 'Office Name is required' }); return; }
    
    setLoading(true);
    try {
      await api.post('/offices', { name: officeName, phone, ownerName: name, city, lat, lng, serviceRadiusKm: radius });
      navigate('/manage/dashboard');
    } catch (err: any) {
      setErrors({ form: err.response?.data?.error || 'Failed to initialize fleet depot' });
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'white' }}>
      
      {/* LEFT PANEL - Desktop specific branding */}
      <div style={{ display: 'none', flex: 1, background: 'linear-gradient(135deg, #1A56DB, #1E40AF)', color: 'white', padding: '64px', flexDirection: 'column', justifyContent: 'space-between' }} className="office-desktop-panel">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <MdWaterDrop size={40} />
            <h1 style={{ margin: 0, fontSize: '2rem' }}>WaterFlow <span style={{ fontWeight: 300 }}>Fleet</span></h1>
          </div>
          <h2 style={{ fontSize: '3rem', margin: '0 0 24px', lineHeight: 1.1 }}>Manage your water supply empire.</h2>
          <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '400px', lineHeight: 1.5 }}>
            WaterFlow Fleet is a dedicated, enterprise-grade portal giving you complete control over your captains, incoming bookings, and revenue tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '32px', opacity: 0.8 }}>
          <div><h4 style={{ margin: 0, fontSize: '2rem' }}>10x</h4><p style={{ margin: 0 }}>Efficiency</p></div>
          <div><h4 style={{ margin: 0, fontSize: '2rem' }}>Live</h4><p style={{ margin: 0 }}>GPS Tracking</p></div>
        </div>
      </div>

      {/* RIGHT PANEL - Forms */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
        
        {/* Mobile Header fallback */}
        <div className="mobile-only-header" style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: '8px', color: '#1A56DB' }}>
          <MdWaterDrop size={28} /> <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>WaterFlow Fleet</span>
        </div>

        <div style={{ width: '100%', maxWidth: '420px' }}>
          {step === 'AUTH' && (
            <>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', margin: '0 0 8px', color: '#111827' }}>
                  {tab === 'login' ? 'Welcome back' : 'Create an account'}
                </h2>
                <p style={{ color: '#6B7280', margin: 0 }}>Access the Office Management portal</p>
              </div>

              {/* Tab Toggle */}
              <div style={{ display: 'flex', marginBottom: '32px', background: '#F3F4F6', borderRadius: '12px', padding: '4px' }}>
                {(['login', 'register'] as const).map(t => (
                  <button key={t} onClick={() => { setTab(t); setErrors({}); }}
                    style={{ flex: 1, padding: '12px 0', border: 'none', background: tab === t ? 'white' : 'transparent', fontWeight: 600, color: tab === t ? '#1A56DB' : '#6B7280', borderRadius: '8px', cursor: 'pointer', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {errors.form && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontWeight: 500, marginBottom: '24px' }}>{errors.form}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {tab === 'register' && (
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}><MdPerson size={16} color="#6B7280" /> Your Full Name</label>
                    <input placeholder="E.g. Raj Kumar" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', outline: 'none' }} />
                    {errors.name && <span style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
                  </div>
                )}

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}><MdPhone size={16} color="#6B7280" /> Mobile Number</label>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '14px 16px', background: '#F3F4F6', borderRadius: '10px 0 0 10px', border: '1.5px solid #E5E7EB', borderRight: 'none', color: '#374151', fontWeight: 600 }}>+91</span>
                    <input placeholder="9876543210" value={phone} maxLength={10} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} style={{ flex: 1, padding: '14px', borderRadius: '0 10px 10px 0', border: '1.5px solid #E5E7EB', borderLeft: 'none', outline: 'none' }} />
                  </div>
                  {errors.phoneNumber && <span style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.phoneNumber}</span>}
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}><MdLock size={16} color="#6B7280" /> Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', outline: 'none' }} />
                  {errors.password && <span style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
                </div>

                <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: '16px', background: loading ? '#9CA3AF' : '#1A56DB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' }}>
                  {loading ? 'Please wait...' : tab === 'login' ? 'Sign In into Portal' : 'Create Owner Account'} {!loading && <MdArrowForward size={20} />}
                </button>
              </div>
            </>
          )}

          {step === 'SETUP' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '12px', background: '#EEF2FF', borderRadius: '16px', marginBottom: '16px', color: '#1A56DB' }}>
                  <MdBusiness size={32} />
                </div>
                <h2 style={{ fontSize: '2rem', margin: '0 0 8px', color: '#111827' }}>Establish your Office</h2>
                <p style={{ color: '#6B7280', margin: 0 }}>Create your supply depot to manage drivers globally.</p>
              </div>

              {errors.form && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 16px', borderRadius: '8px', fontWeight: 500, marginBottom: '24px' }}>{errors.form}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}><MdBusiness size={16} color="#6B7280" /> Office / Depot Name</label>
                  <input placeholder="e.g. Sharma Water Supply" value={officeName} onChange={e => setOfficeName(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', outline: 'none' }} />
                  {errors.officeName && <span style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.officeName}</span>}
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}><MdLocationOn size={16} color="#6B7280" /> Primary City</label>
                  <input value={city} onChange={e => setCity(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', outline: 'none' }} />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}><MdLocationOn size={16} color="#6B7280" /> Exact Location (Drag Pin)</label>
                  <div style={{ width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #E5E7EB', zIndex: 0 }}>
                    <MapContainer center={[lat, lng]} zoom={14} style={{ width: '100%', height: '100%' }}>
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                      <DraggablePin lat={lat} lng={lng} onChange={(l, g) => { setLat(l); setLng(g); }} />
                    </MapContainer>
                  </div>
                </div>

                <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '20px', border: '1px solid #E5E7EB', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#374151' }}>Service Radius</label>
                    <span style={{ fontWeight: 700, color: '#1A56DB', background: '#EEF2FF', padding: '4px 12px', borderRadius: '20px' }}>{radius} km</span>
                  </div>
                  <input type="range" min={1} max={50} value={radius} onChange={e => setRadius(+e.target.value)} style={{ width: '100%', accentColor: '#1A56DB' }} />
                  <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: '12px 0 0' }}>Captains will only operate inside this geographical ring.</p>
                </div>

                <button onClick={handleSetup} disabled={loading} style={{ width: '100%', padding: '16px', background: loading ? '#9CA3AF' : '#1A56DB', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '12px', transition: 'background 0.2s' }}>
                  {loading ? 'Initializing...' : 'Launch Fleet Operations'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Basic media query injected directly for the pane */}
      <style>{`
        @media (min-width: 900px) {
          .office-desktop-panel { display: flex !important; }
          .mobile-only-header { display: none !important; }
        }
      `}</style>
    </div>
  );
}
