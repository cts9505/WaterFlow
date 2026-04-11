import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../context/AuthContext';
import { MdAdd, MdHome, MdWork, MdBusiness, MdPlace, MdDelete, MdMyLocation, MdArrowBack, MdStar, MdCheckCircle, MdEdit, MdSave, MdClose } from 'react-icons/md';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

const TAG_ICON: Record<string, any> = { HOME: MdHome, WORK: MdWork, SOCIETY: MdBusiness, OTHER: MdPlace };

// Draggable pin — uses a ref to update marker position without re-mounting the map
function DraggablePin({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!markerRef.current) {
      const m = L.marker([lat, lng], { draggable: true }).addTo(map);
      m.on('dragend', () => {
        const p = m.getLatLng();
        onChange(p.lat, p.lng);
      });
      markerRef.current = m;
      map.setView([lat, lng], 15);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; } };
  }, []);

  return null;
}

interface FormState {
  tag: string; society: string; addressLine: string; city: string; pincode: string; lat: number; lng: number; isDefault: boolean;
}

export default function AddressSetup() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ tag: 'HOME', society: '', addressLine: '', city: 'Mumbai', pincode: '', lat: 0, lng: 0, isDefault: false });
  const [gpsReady, setGpsReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { fetchAddresses(); }, []);

  // Get GPS on mount to have a default position
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      p => {
        // Only set if form doesn't already have coords (don't override edit values)
        setForm(f => f.lat === 0 ? { ...f, lat: p.coords.latitude, lng: p.coords.longitude } : f);
        setGpsReady(true);
      },
      () => { setForm(f => f.lat === 0 ? { ...f, lat: 19.076, lng: 72.877 } : f); setGpsReady(true); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try { const r = await api.get('/addresses'); setAddresses(r.data.addresses || []); } catch {}
    setLoading(false);
  };

  const detectGPS = () => {
    navigator.geolocation.getCurrentPosition(
      p => setForm(f => ({ ...f, lat: p.coords.latitude, lng: p.coords.longitude })),
      () => {},
      { enableHighAccuracy: true }
    );
  };

  const openAdd = () => {
    // Reset form but keep GPS coords if available
    navigator.geolocation.getCurrentPosition(
      p => {
        setForm({ tag: 'HOME', society: '', addressLine: '', city: 'Mumbai', pincode: '', lat: p.coords.latitude, lng: p.coords.longitude, isDefault: false });
        setGpsReady(true);
      },
      () => {
        setForm(f => ({ tag: 'HOME', society: '', addressLine: '', city: 'Mumbai', pincode: '', lat: f.lat || 19.076, lng: f.lng || 72.877, isDefault: false }));
        setGpsReady(true);
      },
      { enableHighAccuracy: true }
    );
    setEditId(null);
    setMode('add');
    setErrors({});
  };

  const openEdit = (addr: any) => {
    setForm({ tag: addr.tag, society: addr.societyName || '', addressLine: addr.addressLine || '', city: addr.city || 'Mumbai', pincode: addr.pincode || '', lat: addr.lat, lng: addr.lng, isDefault: addr.isDefault || false });
    setEditId(addr.id);
    setMode('edit');
    setErrors({});
    setGpsReady(true);
  };

  const save = async () => {
    const e: Record<string, string> = {};
    if (!form.society.trim() || form.society.trim().length < 2) e.society = 'Society name required (min 2 chars)';
    if (!form.lat) e.gps = 'Please set location on the map';
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) e.pincode = 'Pincode must be 6 digits';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    const payload = { tag: form.tag, societyName: form.society, addressLine: form.addressLine, city: form.city, pincode: form.pincode || undefined, lat: form.lat, lng: form.lng, isDefault: form.isDefault };
    try {
      if (mode === 'edit' && editId) {
        await api.patch(`/addresses/${editId}`, payload);
      } else {
        await api.post('/addresses', payload);
      }
      setMode('list');
      await fetchAddresses();
    } catch (err: any) {
      const se = err.response?.data?.errors;
      if (se) setErrors(typeof se === 'object' && !Array.isArray(se) ? se : { form: JSON.stringify(se) });
    } finally { setSaving(false); }
  };

  const deleteAddr = async (id: string) => {
    await api.delete(`/addresses/${id}`);
    fetchAddresses();
  };

  const setAsDefault = async (id: string) => {
    await api.patch(`/addresses/${id}`, { isDefault: true }).catch(() => {});
    fetchAddresses();
  };

  const handleAddressSelect = async (addr: any) => {
    if (!addr.isDefault) { await api.patch(`/addresses/${addr.id}`, { isDefault: true }).catch(() => {}); }
    navigate('/home', { state: { overrideLat: addr.lat, overrideLng: addr.lng, overrideLabel: addr.societyName || addr.tag } });
  };

  const mapReady = gpsReady && form.lat !== 0;

  return (
    <div className="page" style={{ paddingBottom: '40px' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A56DB, #1E40AF)', padding: '48px 20px 20px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <button onClick={() => mode !== 'list' ? setMode('list') : navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><MdArrowBack size={18} /></button>
          <h2 style={{ margin: 0, flex: 1 }}>{mode === 'edit' ? 'Edit Address' : mode === 'add' ? 'New Address' : 'Saved Addresses'}</h2>
          {mode === 'list' && <button onClick={openAdd} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}><MdAdd size={20} /></button>}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* ── LIST ────────────────────────────────────────────── */}
        {mode === 'list' && (
          <>
            {loading && <p style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0' }}>Loading...</p>}
            {!loading && addresses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <MdPlace size={48} color="#D1D5DB" />
                <h3 style={{ color: '#6B7280', marginTop: '12px' }}>No saved addresses</h3>
                <button className="btn btn-blue" style={{ maxWidth: '200px', margin: '16px auto 0' }} onClick={openAdd}>Add Address</button>
              </div>
            )}
            {addresses.map(addr => {
              const IconC = TAG_ICON[addr.tag] || MdPlace;
              return (
                <div key={addr.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', border: `1.5px solid ${addr.isDefault ? '#1A56DB' : '#E5E7EB'}`, borderRadius: '12px', marginBottom: '10px', background: addr.isDefault ? '#EEF2FF' : 'white' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: addr.isDefault ? '#1A56DB' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconC size={20} color={addr.isDefault ? 'white' : '#6B7280'} />
                  </div>
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => handleAddressSelect(addr)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ fontWeight: 600, margin: 0 }}>{addr.societyName || addr.tag}</p>
                      {addr.isDefault && <MdCheckCircle size={14} color="#1A56DB" />}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0' }}>{addr.addressLine ? `${addr.addressLine}, ` : ''}{addr.city}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => openEdit(addr)} title="Edit" style={{ background: '#EEF2FF', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MdEdit size={14} color="#1A56DB" /></button>
                    {!addr.isDefault && <button onClick={() => setAsDefault(addr.id)} title="Default" style={{ background: '#F3F4F6', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MdStar size={14} color="#6B7280" /></button>}
                    <button onClick={() => deleteAddr(addr.id)} title="Delete" style={{ background: '#FEF2F2', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MdDelete size={14} color="#DC2626" /></button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── ADD / EDIT FORM ────────────────────────────────── */}
        {(mode === 'add' || mode === 'edit') && (
          <div>
            <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.85rem', color: '#374151' }}>Drag the pin to adjust location</p>
            <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px', border: '2px solid #1A56DB' }}>
              {mapReady ? (
                <MapContainer center={[form.lat, form.lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false} key={`${mode}-${editId || 'new'}`}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <DraggablePin lat={form.lat} lng={form.lng} onChange={(la, ln) => setForm(f => ({ ...f, lat: la, lng: ln }))} />
                </MapContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', flexDirection: 'column', gap: '8px' }}>
                  <MdMyLocation size={32} color="#1A56DB" style={{ animation: 'pulse 1.5s infinite' }} />
                  <span style={{ color: '#6B7280' }}>Detecting GPS...</span>
                </div>
              )}
            </div>
            {mapReady && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', marginBottom: '12px' }}>{form.lat.toFixed(5)}, {form.lng.toFixed(5)}</p>}

            {/* Tag */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {Object.entries(TAG_ICON).map(([key, IconC]) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, tag: key }))} style={{ flex: 1, padding: '8px 0', border: `2px solid ${form.tag === key ? '#1A56DB' : '#E5E7EB'}`, borderRadius: '10px', background: form.tag === key ? '#EEF2FF' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <IconC size={16} color={form.tag === key ? '#1A56DB' : '#9CA3AF'} />
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: form.tag === key ? '#1A56DB' : '#6B7280' }}>{key}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <div className="input-group"><label>Society / Building *</label><input placeholder="e.g. Lodha Park" value={form.society} onChange={e => setForm(f => ({ ...f, society: e.target.value }))} />{errors.society && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.society}</span>}</div>
              <div className="input-group"><label>Flat / Floor</label><input placeholder="B-404" value={form.addressLine} onChange={e => setForm(f => ({ ...f, addressLine: e.target.value }))} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="input-group"><label>City</label><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                <div className="input-group"><label>Pincode</label><input placeholder="400001" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '') }))} maxLength={6} />{errors.pincode && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.pincode}</span>}</div>
              </div>
              <button onClick={detectGPS} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: '10px', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', color: '#374151' }}>
                <MdMyLocation size={16} color="#1A56DB" /> Re-detect my GPS
              </button>
              {errors.gps && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.gps}</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="defCb" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} style={{ accentColor: '#1A56DB' }} />
                <label htmlFor="defCb" style={{ fontSize: '0.85rem', color: '#6B7280' }}>Set as default</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-blue" onClick={save} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <MdSave size={16} />{saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
              </button>
              <button onClick={() => setMode('list')} style={{ flex: 0, padding: '12px 20px', border: '1.5px solid #E5E7EB', borderRadius: '10px', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                <MdClose size={16} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
