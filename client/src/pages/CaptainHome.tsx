import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import { MdLocalShipping, MdPowerSettingsNew, MdLocationOn, MdCheckCircle, MdAttachMoney, MdBusiness } from 'react-icons/md';
import BottomNav from './BottomNav';

export default function CaptainHome() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [online, setOnline] = useState(user?.isOnline || false);
  const [orders, setOrders] = useState<any[]>([]);
  const [toggling, setToggling] = useState(false);
  const [stats, setStats] = useState({ todayEarnings: 0, todayTrips: 0, totalEarnings: 0, totalTrips: 0 });
  const [myOffices, setMyOffices] = useState<any[]>([]);

  useEffect(() => {
    if (user?.isOnline !== undefined) setOnline(user.isOnline);
  }, [user?.isOnline]);

  const pushLocation = () => {
    navigator.geolocation.getCurrentPosition(
      p => api.post('/captains/location', { lat: p.coords.latitude, lng: p.coords.longitude }),
      () => { if (user?.operationLat) api.post('/captains/location', { lat: user.operationLat, lng: user.operationLng }); }
    );
  };

  // Set price before going online — init from user's saved price
  const [basePrice, setBasePrice] = useState(user?.basePrice || 500);
  const [showPriceSetter, setShowPriceSetter] = useState(false);

  useEffect(() => {
    if (user?.basePrice) setBasePrice(user.basePrice);
  }, [user?.basePrice]);

  // Fetch stats from DB
  useEffect(() => {
    api.get('/auth/captain/stats').then(r => setStats(r.data.stats)).catch(() => {});
  }, []);

  // Fetch my offices
  useEffect(() => {
    api.get('/offices/my/list').then(r => setMyOffices(r.data.offices || [])).catch(() => {});
  }, []);

  const isApproved = myOffices.some((o: any) => o.memberStatus === 'APPROVED' || o.isOwner);

  const toggleOnline = async () => {
    if (!isApproved && !online) {
      alert("You must be approved by an Office to operate.");
      return;
    }
    if (!online && !showPriceSetter) {
      setShowPriceSetter(true);
      return;
    }
    setToggling(true);
    const newState = !online;
    try {
      await api.patch('/captain/toggle-online', { isOnline: newState, basePrice: newState ? basePrice : undefined });
      setOnline(newState);
      setShowPriceSetter(false);
      if (newState) pushLocation();
      await refresh();
    } catch {}
    setToggling(false);
  };

  const goOnlineWithPrice = async () => {
    setToggling(true);
    try {
      await api.patch('/captain/toggle-online', { isOnline: true, basePrice });
      setOnline(true);
      setShowPriceSetter(false);
      pushLocation();
      await refresh();
    } catch {}
    setToggling(false);
  };

  // Poll for pending orders when online
  useEffect(() => {
    if (!online) { setOrders([]); return; }
    const fetch = () => api.get('/bookings/pending').then(r => setOrders(r.data.bookings)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 8000);
    return () => clearInterval(interval);
  }, [online]);

  const acceptOrder = async (bookingId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/accept`);
      navigate(`/captain/active/${bookingId}`);
    } catch (err: any) {
      if (err.response?.status === 409) alert('This order was already accepted by another captain.');
      else alert(err.response?.data?.error || 'Failed to accept');
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', padding: '48px 20px 24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ opacity: 0.85, fontSize: '0.85rem', marginBottom: '4px' }}>Welcome,</p>
            <h2 style={{ marginBottom: '4px' }}>{user?.name || 'Captain'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8, fontSize: '0.85rem' }}>
              <MdLocalShipping size={16} /> {user?.vehicleNumber || 'Tanker'} · {user?.tankerCapacity || 1000}L
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <button onClick={toggleOnline} disabled={toggling}
              style={{ padding: '10px 18px', borderRadius: '20px', border: '2px solid rgba(255,255,255,0.5)', background: online ? 'white' : 'transparent', color: online ? '#EA580C' : 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdPowerSettingsNew size={16} />{online ? 'Online' : 'Go Online'}
            </button>
            {/* Show current price when online */}
            {online && user?.basePrice && (
              <span style={{ background: 'rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                ₹{user.basePrice}/trip
              </span>
            )}
          </div>
        </div>

        {/* Stats from DB */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '20px' }}>
          {[
            [`₹${stats.todayEarnings}`, "Today's Earning"],
            [`${stats.todayTrips}`, 'Trips Today'],
            [`₹${stats.totalEarnings}`, 'Total Earnings'],
          ].map(([val, label]) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{val}</p>
              <p style={{ fontSize: '0.68rem', opacity: 0.8, margin: '2px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Office Section */}
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MdBusiness size={18} color="#1A56DB" /> My Offices
          </h3>
          {myOffices.length === 0 ? (
            <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <MdBusiness size={36} color="#D1D5DB" />
              <p style={{ color: '#6B7280', margin: '8px 0 16px', fontSize: '0.85rem' }}>You're not part of any office yet.</p>
              <button className="btn btn-blue" style={{ width: 'auto', padding: '10px 16px', fontSize: '0.85rem' }} onClick={() => navigate('/onboarding')}>
                Enter Office Code
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myOffices.map((o: any) => (
                <div key={o.id} onClick={() => navigate(`/office/${o.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MdBusiness size={20} color="#1A56DB" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{o.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '2px 0 0' }}>Code: {o.code} · {o.city}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '8px', fontWeight: 600, background: o.memberStatus === 'APPROVED' ? '#F0FDF4' : '#FFF7ED', color: o.memberStatus === 'APPROVED' ? '#16A34A' : '#F97316' }}>
                    {o.memberStatus === 'APPROVED' ? (o.isOwner ? 'Owner' : 'Member') : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Locked State Override */}
        {!isApproved && myOffices.length > 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFF7ED', borderRadius: '16px', border: '2px solid #FFEDD5', marginTop: '16px' }}>
            <MdPowerSettingsNew size={48} color="#F97316" style={{ opacity: 0.5 }} />
            <h3 style={{ margin: '12px 0 8px', color: '#C2410C' }}>Pending Office Approval</h3>
            <p style={{ color: '#F97316', fontWeight: 500, margin: 0 }}>You cannot receive orders until your Office Manager accepts your application.</p>
          </div>
        ) : (
          <>
            {/* SET PRICE — shown before going online */}
            {showPriceSetter && !online && (
              <div style={{ border: '2px solid #F97316', borderRadius: '14px', padding: '20px', marginBottom: '16px', background: '#FFF7ED' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <MdAttachMoney size={20} color="#F97316" />
                  <h3 style={{ margin: 0 }}>Set Your Base Price</h3>
                </div>
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#F97316' }}>₹{basePrice}</div>
                  <p style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>per trip</p>
                </div>
                <input type="range" min={200} max={2000} step={50} value={basePrice} onChange={e => setBasePrice(+e.target.value)} style={{ width: '100%', accentColor: '#F97316', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', justifyContent: 'center' }}>
                  {[300, 500, 700, 1000].map(s => (
                    <button key={s} onClick={() => setBasePrice(s)} style={{ padding: '6px 12px', borderRadius: '14px', border: `1.5px solid ${basePrice === s ? '#F97316' : '#E5E7EB'}`, background: basePrice === s ? '#FFF7ED' : 'white', color: basePrice === s ? '#F97316' : '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>₹{s}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-blue" style={{ flex: 1, background: 'linear-gradient(135deg, #F97316, #EA580C)' }} onClick={goOnlineWithPrice} disabled={toggling}>
                    {toggling ? 'Going online...' : 'Go Online Now'}
                  </button>
                  <button onClick={() => setShowPriceSetter(false)} style={{ padding: '12px 16px', border: '1.5px solid #E5E7EB', borderRadius: '10px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            <h3 style={{ marginBottom: '12px', marginTop: '16px' }}>
              {online ? `Incoming Requests (${orders.length})` : showPriceSetter ? '' : 'You are offline'}
            </h3>

            {!online && !showPriceSetter && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F9FAFB', borderRadius: '16px' }}>
                <MdPowerSettingsNew size={48} color="#D1D5DB" />
                <p style={{ color: '#6B7280', fontWeight: 500, margin: '12px 0 0' }}>Go online to receive delivery requests</p>
                <button className="btn btn-blue" style={{ marginTop: '16px', maxWidth: '200px', background: '#F97316' }} onClick={toggleOnline}>Go Online Now</button>
              </div>
            )}

            {online && orders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F9FAFB', borderRadius: '16px' }}>
                <MdLocalShipping size={48} color="#D1D5DB" />
                <p style={{ color: '#6B7280', fontWeight: 500, margin: '12px 0 0' }}>Listening for nearby orders...</p>
              </div>
            )}

            {online && orders.map((order: any) => (
              <div key={order.id} style={{ border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '14px', marginBottom: '10px', borderLeft: '4px solid #F97316' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MdLocationOn size={16} color="#EF4444" />{order.societyName || order.city || 'New delivery'}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0' }}>
                      <MdLocalShipping size={13} style={{ verticalAlign: 'middle' }} /> {order.capacityLitres}L
                      {order.customer?.name && ` · ${order.customer.name}`}
                    </p>
                  </div>
                  <p style={{ fontWeight: 800, fontSize: '1.15rem', color: '#16A34A', margin: 0 }}>₹{order.price}</p>
                </div>
                <button className="btn btn-blue" style={{ background: '#F97316' }} onClick={() => acceptOrder(order.id)}>
                  <MdCheckCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Accept Trip
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <BottomNav role="CAPTAIN" />
    </div>
  );
}
