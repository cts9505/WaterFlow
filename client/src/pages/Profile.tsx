import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import {
  MdPerson, MdPhone, MdEmail, MdEdit, MdSave, MdReceipt,
  MdNotifications, MdHelp, MdStarRate, MdLogout, MdLocalShipping,
  MdLocationOn, MdArrowForwardIos, MdSpeed
} from 'react-icons/md';
import BottomNav from './BottomNav';

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);

  // Captain-editable fields
  const [capacity, setCapacity] = useState(user?.tankerCapacity || 1000);
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [basePrice, setBasePrice] = useState(user?.basePrice || 500);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCaptain = user?.role === 'CAPTAIN';

  useEffect(() => {
    api.get('/bookings/my').then(r => setBookingCount(r.data.bookings?.length || 0)).catch(() => {});
  }, []);

  const startEditing = () => {
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    const payload: any = { name: name || undefined, email: email || undefined };
    if (isCaptain) {
      payload.vehicleNumber = vehicleNumber;
      payload.tankerCapacity = capacity;
      payload.basePrice = basePrice;
    }
    setErrors({});
    try {
      await api.patch('/auth/profile', payload);
      await refresh();
      setEditing(false);
    } catch (e: any) {
      if (e.response?.data?.errors) {
        setErrors(e.response.data.errors);
      } else {
        setErrors({ form: e.response?.data?.error || 'Failed to save' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  const initials = (user?.name || user?.phoneNumber || 'U').slice(0, 2).toUpperCase();
  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';

  return (
    <div className="page" style={{ background: '#F9FAFB' }}>
      <div style={{ background: isCaptain ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'linear-gradient(135deg, #1A56DB, #1E40AF)', padding: '48px 24px 28px', color: 'white' }}>
        <div style={{ width: '68px', height: '68px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', border: '3px solid rgba(255,255,255,0.4)' }}>
          {initials}
        </div>
        <h2 style={{ margin: '0 0 4px' }}>{user?.name || 'Guest'}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8, fontSize: '0.85rem' }}>
          <MdPhone size={14} /> +91 {user?.phoneNumber}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          {user?.isVerified && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem' }}>Verified</span>}
          {joined && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem' }}>Joined {joined}</span>}
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem' }}>{bookingCount} orders</span>
          {isCaptain && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.72rem' }}>{user?.tankerCapacity || 0}L tanker</span>}
        </div>
      </div>

      <div style={{ padding: '20px 20px 100px' }}>
        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1F2937' }}>Profile Details</h3>
            <button onClick={() => editing ? save() : startEditing()} style={{ background: '#EEF2FF', border: 'none', color: '#1A56DB', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {editing ? <><MdSave size={14} />{saving ? 'Saving...' : 'Save'}</> : <><MdEdit size={14} />Edit</>}
            </button>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errors.form && <div style={{ color: '#DC2626', background: '#FEF2F2', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}>{errors.form}</div>}
              <div className="input-group"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="input-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                {errors.email && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.email}</span>}
              </div>
              {isCaptain && (
                <>
                  <div style={{ width: '100%', height: '1px', background: '#E5E7EB', margin: '8px 0' }} />
                  <p style={{ fontWeight: 700, margin: '0 0 6px', fontSize: '0.95rem' }}>Tanker Settings</p>
                  
                  <div className="input-group">
                    <label>Vehicle Number</label>
                    <input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())} />
                    {errors.vehicleNumber && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.vehicleNumber}</span>}
                  </div>
                  
                  <div className="input-group">
                    <label>Tanker Capacity</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[500, 1000, 2000, 5000].map(c => (
                        <button key={c} onClick={() => setCapacity(c)} type="button" style={{ flex: 1, padding: '8px 0', border: `2px solid ${capacity === c ? '#F97316' : '#E5E7EB'}`, borderRadius: '8px', background: capacity === c ? '#FFF7ED' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: capacity === c ? '#F97316' : '#6B7280' }}>{c}L</button>
                      ))}
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Base Price per Trip (₹)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="range" min={100} max={2500} step={25} value={basePrice} onChange={e => setBasePrice(+e.target.value)} style={{ flex: 1, accentColor: '#F97316' }} />
                      <span style={{ fontWeight: 700, color: '#F97316', minWidth: '46px' }}>₹{basePrice}</span>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Base Price per Trip (₹)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="range" min={100} max={2500} step={25} value={basePrice} onChange={e => setBasePrice(+e.target.value)} style={{ flex: 1, accentColor: '#F97316' }} />
                      <span style={{ fontWeight: 700, color: '#F97316', minWidth: '46px' }}>₹{basePrice}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[[MdPhone, 'Phone', '+91 ' + user?.phoneNumber], [MdEmail, 'Email', user?.email || 'Not set'], [MdPerson, 'Role', user?.role]].map(([Icon, label, val]: any) => (
                <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color="#6B7280" /></div>
                  <div><p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>{label}</p><p style={{ fontWeight: 600, margin: '2px 0 0', fontSize: '0.9rem', color: '#374151' }}>{val}</p></div>
                </div>
              ))}
              
              {isCaptain && (
                <>
                  <div style={{ width: '100%', height: '1px', background: '#F3F4F6', margin: '4px 0' }} />
                  {[[MdLocalShipping, 'Vehicle Info', `${user?.vehicleNumber || 'Not set'} · ${user?.tankerCapacity || 0}L`], 
                    [MdSpeed, 'Base Pricing', `₹${user?.basePrice || 500}/trip`]].map(([Icon, label, val]: any) => (
                    <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color="#F97316" /></div>
                      <div><p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>{label}</p><p style={{ fontWeight: 600, margin: '2px 0 0', fontSize: '0.9rem', color: '#374151' }}>{val}</p></div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          {[
            { Icon: MdReceipt, label: 'My Orders', path: '/orders' },
            ...(isCaptain ? [] : [{ Icon: MdLocationOn, label: 'Saved Addresses', path: '/addresses' }]),
            { Icon: MdNotifications, label: 'Notifications', path: '#' },
            { Icon: MdHelp, label: 'Help & Support', path: '#' },
            { Icon: MdStarRate, label: 'Rate App', path: '#' },
          ].map(({ Icon, label, path }, i, arr) => (
            <Link key={label} to={path} style={{ display: 'flex', gap: '12px', padding: '16px', alignItems: 'center', textDecoration: 'none', color: '#374151', borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color="#6B7280" /></div>
              <span style={{ fontWeight: 600, flex: 1, fontSize: '0.9rem' }}>{label}</span>
              <MdArrowForwardIos size={14} color="#D1D5DB" />
            </Link>
          ))}
        </div>

        <button onClick={handleLogout} style={{ width: '100%', border: 'none', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, cursor: 'pointer', padding: '16px', fontSize: '0.95rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <MdLogout size={18} /> Logout Default
        </button>
      </div>

      <BottomNav role={user?.role === 'ADMIN' ? 'ADMIN' : user?.role === 'CAPTAIN' ? 'CAPTAIN' : 'CUSTOMER'} />
    </div>
  );
}
