import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { MdMyLocation, MdPerson, MdWaterDrop, MdNearMe, MdBusiness, MdPhone } from 'react-icons/md';
import BottomNav from './BottomNav';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

const officeMarker = (hasOnline: boolean) => new L.DivIcon({
  html: `<div style="background:${hasOnline ? '#1A56DB' : '#9CA3AF'};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;"><svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='white'><path d='M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z'/></svg></div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 14, { duration: 1 }); }, [lat, lng]);
  return null;
}

export default function HomeMap() {
  const { } = useAuth();
  const navigate = useNavigate();
  const [gpsReady, setGpsReady] = useState(false);
  const [userPos, setUserPos] = useState<[number, number]>([0, 0]);
  const [offices, setOffices] = useState<any[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<any>(null);
  const [addressLabel, setAddressLabel] = useState('');
  const [matchedAddress, setMatchedAddress] = useState<any>(null);
  const location = useLocation();

  // GPS or Override Location
  useEffect(() => {
    if (location.state?.overrideLat) {
      setUserPos([location.state.overrideLat, location.state.overrideLng]);
      setAddressLabel(location.state.overrideLabel || 'Custom Location');
      setGpsReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      p => {
        setUserPos([p.coords.latitude, p.coords.longitude]);
        setGpsReady(true);
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${p.coords.latitude}&lon=${p.coords.longitude}&format=json`)
          .then(r => r.json()).then(d => setAddressLabel(d.display_name?.split(',').slice(0, 3).join(', ') || '')).catch(() => {});
      },
      () => setGpsReady(true),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [location.state?.overrideLat]);

  // Load saved addresses + auto-fill if nearby
  useEffect(() => {
    api.get('/addresses').then(r => {
      const addrs = r.data.addresses || [];
      if (userPos[0] && addrs.length > 0) {
        for (const a of addrs) {
          const R = 6371, dLat = (a.lat - userPos[0]) * Math.PI / 180, dLng = (a.lng - userPos[1]) * Math.PI / 180;
          const h = Math.sin(dLat / 2) ** 2 + Math.cos(userPos[0] * Math.PI / 180) * Math.cos(a.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          if (R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) < 0.5) {
            setMatchedAddress(a);
            setAddressLabel(a.societyName || a.label || a.tag);
            return;
          }
        }
        const def = addrs.find((a: any) => a.isDefault);
        if (def) setAddressLabel(def.societyName || def.label || '');
      }
    }).catch(() => {});
  }, [userPos[0]]);

  // Fetch nearby OFFICES (shows ALL — even when all captains are offline)
  const fetchOffices = useCallback(async () => {
    if (!gpsReady || userPos[0] === 0) return;
    try {
      const r = await api.get(`/offices/nearby?lat=${userPos[0]}&lng=${userPos[1]}`);
      setOffices(r.data.offices || []);
    } catch {}
  }, [userPos, gpsReady]);

  useEffect(() => {
    if (gpsReady) { fetchOffices(); const i = setInterval(fetchOffices, 15000); return () => clearInterval(i); }
  }, [fetchOffices, gpsReady]);

  const recenter = () => {
    navigator.geolocation.getCurrentPosition(p => setUserPos([p.coords.latitude, p.coords.longitude]), () => {}, { enableHighAccuracy: true });
  };

  const handleCallClick = async (office: any) => {
    try { await api.post(`/offices/${office.id}/call`); } catch {}
    window.open(`tel:${office.phone}`);
  };

  const totalOnline = offices.reduce((s, o) => s + o.onlineCaptains, 0);

  if (!gpsReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
        <MdMyLocation size={48} color="#1A56DB" style={{ animation: 'pulse 1.5s infinite' }} />
        <p style={{ color: '#6B7280', fontWeight: 500 }}>Detecting your location...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: '60px' }}>
      {/* Top Bar */}
      <div style={{ padding: '16px 16px 10px', background: 'white', zIndex: 500, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1A56DB', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdWaterDrop size={20} /> WaterFlow
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#16A34A', background: '#F0FDF4', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
              {offices.length} offices · {totalOnline} online
            </span>
            <Link to="/profile" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdPerson size={18} color="#1A56DB" />
            </Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F3F4F6', borderRadius: '10px', padding: '10px 12px' }}>
          <MdNearMe size={18} color="#1A56DB" />
          <span style={{ fontSize: '0.85rem', color: '#374151', flex: 1, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {matchedAddress ? `${matchedAddress.societyName} (${matchedAddress.tag})` : addressLabel || 'Tap "Change" to set address'}
          </span>
          <button onClick={() => navigate('/addresses')} style={{ fontSize: '0.75rem', color: '#1A56DB', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Change</button>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={userPos} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
          <FlyTo lat={userPos[0]} lng={userPos[1]} />
          <Marker position={userPos}><Popup>{location.state?.overrideLat ? 'Selected saved address' : 'Your location'}</Popup></Marker>
          {offices.map(o => (
            <Marker key={o.id} position={[o.lat, o.lng]} icon={officeMarker(o.hasOnline)}
              eventHandlers={{ click() { setSelectedOffice(o); } }}>
            </Marker>
          ))}
        </MapContainer>

        <button onClick={recenter} style={{ position: 'absolute', bottom: '230px', right: '16px', width: '42px', height: '42px', borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 500 }}>
          <MdMyLocation size={20} color="#1A56DB" />
        </button>

        {/* Bottom Sheet */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: '16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', zIndex: 500 }}>
          <div style={{ width: '36px', height: '4px', background: '#E5E7EB', borderRadius: '2px', margin: '0 auto 12px' }} />

          {selectedOffice ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: selectedOffice.hasOnline ? '#EEF2FF' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdBusiness size={20} color={selectedOffice.hasOnline ? '#1A56DB' : '#9CA3AF'} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0 }}>{selectedOffice.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '2px 0 0' }}>
                      {selectedOffice.distanceKm}km away · Serves {selectedOffice.serviceRadiusKm}km
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedOffice(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.78rem' }}>Close</button>
              </div>

              {/* Call button */}
              <button onClick={() => handleCallClick(selectedOffice)}
                style={{ width: '100%', padding: '12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
                <MdPhone size={18} /> Call {selectedOffice.phone}
              </button>

              {/* Status */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '8px', fontWeight: 600, background: selectedOffice.hasOnline ? '#F0FDF4' : '#F3F4F6', color: selectedOffice.hasOnline ? '#16A34A' : '#9CA3AF' }}>
                  {selectedOffice.onlineCaptains}/{selectedOffice.totalCaptains} captains online
                </span>
                <span style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: '8px', fontWeight: 600, background: '#EEF2FF', color: '#1A56DB' }}>
                  {selectedOffice.city}
                </span>
              </div>

              {/* Available tankers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {selectedOffice.captains.filter((c: any) => c.isOnline).map((cap: any) => (
                  <div key={cap.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E5E7EB', padding: '10px', borderRadius: '10px' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{cap.capacityLitres}L Tanker</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B7280' }}>Available now</p>
                    </div>
                    <button className="btn btn-blue" style={{ padding: '8px 12px', fontSize: '0.8rem', width: 'auto', flex: 0 }}
                      onClick={() => navigate('/order', { state: { dropLat: userPos[0], dropLng: userPos[1], captainId: cap.id, capacityLitres: cap.capacityLitres, captainName: cap.name, captainVehicle: cap.vehicleNumber, captainPrice: cap.basePrice, officeId: selectedOffice.id } })}>
                      Book ₹{cap.basePrice}
                    </button>
                  </div>
                ))}
                {selectedOffice.captains.filter((c: any) => c.isOnline).length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem', padding: '12px' }}>No tankers online right now — try calling the office directly!</p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <strong style={{ display: 'block', marginBottom: '10px' }}>Nearby Water Offices</strong>

              {offices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
                  {offices.slice(0, 5).map(o => (
                    <div key={o.id} onClick={() => setSelectedOffice(o)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: o.hasOnline ? '#EEF2FF' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MdBusiness size={18} color={o.hasOnline ? '#1A56DB' : '#9CA3AF'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, margin: 0, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</p>
                        <p style={{ fontSize: '0.72rem', color: '#6B7280', margin: '2px 0 0' }}>
                          {o.distanceKm}km · {o.onlineCaptains} online
                        </p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleCallClick(o); }}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16A34A', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <MdPhone size={14} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '14px' }}>No water offices found in your area</p>
              )}

              <button className="btn btn-blue" onClick={() => navigate('/order', { state: { dropLat: userPos[0], dropLng: userPos[1] } })} style={{ marginTop: '12px' }}>
                Book Now
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav role="CUSTOMER" />
    </div>
  );
}
