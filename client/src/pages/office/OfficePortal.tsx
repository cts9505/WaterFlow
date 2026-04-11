import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MdBusiness, MdPeople, MdLocalShipping, MdPhone, MdCheckCircle, MdTrendingUp, MdLocationOn } from 'react-icons/md';

// Marker setup for Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });

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

export default function OfficePortal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [office, setOffice] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED'>('PENDING');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', city: '', serviceRadiusKm: 10, lat: 0, lng: 0 });

  const fetchDashboard = async () => {
    try {
      // Fetch the office they own
      const myOfficesReq = await api.get('/offices/my/list');
      const owned = myOfficesReq.data.offices.find((o: any) => o.isOwner) || myOfficesReq.data.offices[0];
      
      if (!owned) {
        navigate('/manage'); // Needs to setup office first
        return;
      }

      const officeId = owned.id;
      setOffice(owned);
      if (!isEditing && editForm.name === '') {
        setEditForm({ name: owned.name, city: owned.city, serviceRadiusKm: owned.serviceRadiusKm, lat: owned.lat, lng: owned.lng });
      }

      const memReq = await api.get(`/offices/${officeId}/members`);
      setMembers(memReq.data.members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Poll for live driver locations and new member requests
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, [navigate, user]);

  const handleMemberAction = async (memberId: string, status: string) => {
    try {
      await api.patch(`/offices/${office.id}/members/${memberId}`, { status });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleEditSubmit = async () => {
    try {
      const res = await api.patch(`/offices/${office.id}`, editForm);
      setOffice(res.data.office);
      setIsEditing(false);
      fetchDashboard();
    } catch (e) {
      alert('Failed to update office details');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F3F4F6', fontSize: '1.2rem', color: '#6B7280' }}>Loading Fleet Data...</div>;
  }

  if (!office) return null;

  const pending = members.filter(m => m.status === 'PENDING');
  const approved = members.filter(m => m.status === 'APPROVED');
  const onlineCaptains = approved.filter(m => m.captain.isOnline);

  return (
    <div className="office-portal-layout" style={{ display: 'flex', minHeight: '100vh', background: '#F9FAFB' }}>
      <style>{`
        @media (max-width: 900px) {
          .office-portal-layout { flex-direction: column !important; }
          .office-portal-sidebar { width: 100% !important; min-height: auto !important; padding: 16px !important; }
          .office-portal-split { grid-template-columns: 1fr !important; }
          .office-portal-map { height: 300px !important; }
        }
      `}</style>
      
      {/* Sidebar Navigation */}
      <div className="office-portal-sidebar" style={{ width: '280px', background: 'linear-gradient(180deg, #1A56DB, #1E40AF)', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdBusiness size={28} />
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Fleet Portal</h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.8 }}>v1.0.0 Production</p>
        </div>
        
        <div style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '1px', marginBottom: '16px' }}>Office Details</h3>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{office.name}</p>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}><MdLocationOn size={14} /> {office.city} ({office.serviceRadiusKm} km)</p>
          
          <div style={{ margin: '32px 0' }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Invite Code</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '4px', textAlign: 'center' }}>
              {office.code}
            </div>
            <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '8px', textAlign: 'center' }}>Share this with drivers to join.</p>
          </div>

          <button onClick={() => setIsEditing(true)} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
            Edit Settings
          </button>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {user?.name?.[0] || 'O'}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Owner / Admin</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Canvas */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <h1 style={{ margin: '0 0 8px', color: '#111827', fontSize: '2rem' }}>Dashboard Overview</h1>
        <p style={{ color: '#6B7280', margin: '0 0 32px' }}>Welcome back. Here is the current state of your fleet.</p>

        {/* Top Analytics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {[
            { label: 'Active Drivers Online', value: onlineCaptains.length, total: approved.length, icon: MdLocalShipping, color: '#10B981' },
            { label: 'Pending Approvals', value: pending.length, icon: MdPeople, color: '#F59E0B' },
            { label: 'Customer Views', value: office.viewCount, icon: MdTrendingUp, color: '#3B82F6' },
            { label: 'Total Calls Received', value: office.callCount, icon: MdPhone, color: '#8B5CF6' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stat.value}</span>
                {stat.total !== undefined && <span style={{ color: '#6B7280', fontWeight: 500 }}>/ {stat.total} total</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Central Split: Pending Applications & Live Map */}
        <div className="office-portal-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1.5fr', gap: '24px' }}>
          
          {/* Members Table */}
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setActiveTab('PENDING')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'PENDING' ? 700 : 500, color: activeTab === 'PENDING' ? '#111827' : '#9CA3AF', cursor: 'pointer' }}>Pending</button>
                <button onClick={() => setActiveTab('APPROVED')} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: activeTab === 'APPROVED' ? 700 : 500, color: activeTab === 'APPROVED' ? '#111827' : '#9CA3AF', cursor: 'pointer' }}>Active Fleet</button>
              </div>
              {activeTab === 'PENDING' && <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>{pending.length} Requests</span>}
            </div>
            
            <div style={{ padding: '0', flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
              {(activeTab === 'PENDING' ? pending : approved).length === 0 ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#6B7280' }}>
                  <MdPeople size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p style={{ margin: 0 }}>No {activeTab} captains found.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontSize: '0.8rem', textTransform: 'uppercase', color: '#6B7280' }}>
                    <tr>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Driver Details</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600 }}>Tanker</th>
                      <th style={{ padding: '12px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'PENDING' ? pending : approved).map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{m.captain.name || 'Unknown'}</p>
                            {activeTab === 'APPROVED' && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.captain.isOnline ? '#10B981' : '#9CA3AF' }} />
                            )}
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>{m.captain.phoneNumber}</p>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <p style={{ margin: 0, fontWeight: 600, color: '#111827' }}>{m.captain.vehicleNumber}</p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#6B7280' }}>{m.captain.tankerCapacity} L</p>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {activeTab === 'PENDING' ? (
                            <>
                              <button onClick={() => handleMemberAction(m.id, 'APPROVED')} style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MdCheckCircle size={16} /> Approve
                              </button>
                              <button onClick={() => handleMemberAction(m.id, 'REJECTED')} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                                Reject
                              </button>
                            </>
                          ) : (
                            <button onClick={() => { if(confirm('Remove driver from fleet?')) handleMemberAction(m.id, 'REJECTED') }} style={{ background: '#FEF2F2', color: '#DC2626', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Live Fleet Map */}
          <div className="office-portal-map" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '470px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#111827' }}>Live Fleet Map</h2>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#10B981', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} /> {onlineCaptains.length} Active Right Now
              </span>
            </div>
            <div style={{ flex: 1, background: '#E5E7EB', position: 'relative' }}>
              <MapContainer center={[office.lat, office.lng]} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                
                {/* Office Center Pin */}
                <Marker position={[office.lat, office.lng]}>
                  <Popup><strong>{office.name}</strong><br/>Depot Base</Popup>
                </Marker>

              </MapContainer>
            </div>
          </div>

        </div>

      </div>

      {/* Overlays */}
      {isEditing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px' }}>Edit Office Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Office Name</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>City</label>
                <input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Service Radius (Km)</label>
                <input type="range" min={1} max={50} value={editForm.serviceRadiusKm} onChange={e => setEditForm(p => ({ ...p, serviceRadiusKm: Number(e.target.value) }))} style={{ width: '100%' }} />
                <span style={{ display: 'block', textAlign: 'center', fontWeight: 600, marginTop: '8px', color: '#1A56DB' }}>{editForm.serviceRadiusKm} km</span>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Exact Location (Drag Pin)</label>
                <div style={{ width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #D1D5DB', zIndex: 0 }}>
                  <MapContainer center={[editForm.lat || 19.076, editForm.lng || 72.877]} zoom={14} style={{ width: '100%', height: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <DraggablePin lat={editForm.lat || 19.076} lng={editForm.lng || 72.877} onChange={(la, ln) => setEditForm(p => ({ ...p, lat: la, lng: ln }))} />
                  </MapContainer>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEditSubmit} style={{ flex: 1, padding: '12px', background: '#1A56DB', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
