import { useState, useEffect } from 'react';
import { api, useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdDashboard, MdBusiness, MdPeople, MdReceipt, MdCheckCircle, MdCancel, MdTrendingUp, MdLocalShipping, MdVisibility, MdAttachMoney, MdLogout } from 'react-icons/md';

type Tab = 'overview' | 'offices' | 'bookings' | 'users';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [officeFilter, setOfficeFilter] = useState('');
  const [bookingFilter, setBookingFilter] = useState('');

  const fetchData = async () => {
    try {
      if (tab === 'overview') api.get('/admin/stats').then(r => setStats(r.data.stats)).catch(() => {});
      if (tab === 'offices') api.get(`/admin/offices${officeFilter ? `?status=${officeFilter}` : ''}`).then(r => setOffices(r.data.offices)).catch(() => {});
      if (tab === 'bookings') api.get(`/admin/bookings${bookingFilter ? `?status=${bookingFilter}` : ''}`).then(r => setBookings(r.data.bookings)).catch(() => {});
      if (tab === 'users') api.get('/admin/users').then(r => setUsers(r.data.users)).catch(() => {});
    } catch (e) {
      console.error("Failed to fetch admin data");
    }
  };

  const handleDelete = async (type: 'offices' | 'bookings' | 'users', id: string) => {
    if (!confirm(`WARNING: Are you sure you want to permanently delete this ${type}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/${type}/${id}`);
      if (type === 'offices') setOffices(prev => prev.filter(p => p.id !== id));
      if (type === 'bookings') setBookings(prev => prev.filter(p => p.id !== id));
      if (type === 'users') setUsers(prev => prev.filter(p => p.id !== id));
      fetchData();
    } catch (e) {
      alert(`Failed to delete ${type}. Target may be bounded by rigid database relations.`);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [tab, officeFilter, bookingFilter]);

  const handleOfficeStatus = async (id: string, status: string) => {
    await api.patch(`/admin/offices/${id}/status`, { status });
    setOffices(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    api.get('/admin/stats').then(r => setStats(r.data.stats)).catch(() => {});
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs: { key: Tab; label: string; Icon: any }[] = [
    { key: 'overview', label: 'System Overview', Icon: MdDashboard },
    { key: 'offices', label: 'Fleet Offices', Icon: MdBusiness },
    { key: 'bookings', label: 'Live Bookings', Icon: MdReceipt },
    { key: 'users', label: 'User Directory', Icon: MdPeople },
  ];

  return (
    <div className="admin-portal-layout" style={{ display: 'flex', minHeight: '100vh', background: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        .admin-portal-layout { flex-direction: row; }
        .admin-sidebar { width: 260px; min-height: 100vh; position: sticky; top: 0; }
        .admin-content { flex: 1; padding: 40px; overflow-y: auto; }
        .stat-grid { grid-template-columns: repeat(3, 1fr); }
        .table-container { overflow-x: auto; }
        
        @media (max-width: 900px) {
          .admin-portal-layout { flex-direction: column !important; }
          .admin-sidebar { width: 100% !important; min-height: auto !important; position: static !important; }
          .admin-content { padding: 20px !important; }
          .stat-grid { grid-template-columns: 1fr !important; }
          .admin-nav-items { display: flex; overflow-x: auto; gap: 8px; padding-bottom: 8px; }
          .admin-nav-items button { flex: 0 0 auto; white-space: nowrap; }
        }
      `}</style>
      
      {/* Sidebar Navigation */}
      <div className="admin-sidebar" style={{ background: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdDashboard size={28} color="#8B5CF6" />
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Master Admin</h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>WaterFlow Core System</p>
        </div>
        
        <div className="admin-nav-items" style={{ padding: '24px', flex: 1 }}>
          <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748B', letterSpacing: '1px', marginBottom: '16px' }}>Control Panel</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ textAlign: 'left', padding: '12px 16px', border: 'none', borderRadius: '10px', background: tab === t.key ? '#8B5CF6' : 'transparent', color: tab === t.key ? 'white' : '#CBD5E1', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s' }}>
                <t.Icon size={20} />{t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {user?.name?.[0] || 'A'}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{user?.name || 'Administrator'}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>Super Permissions</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', color: '#CBD5E1', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
            <MdLogout size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="admin-content">
        <h1 style={{ margin: '0 0 8px', color: '#0F172A', fontSize: '2rem', fontWeight: 800 }}>
          {tabs.find(t => t.key === tab)?.label}
        </h1>
        <p style={{ color: '#64748B', margin: '0 0 32px', fontSize: '1rem' }}>Manage the entire infrastructure from this terminal.</p>

        {/* ── Overview Tab ──────── */}
        {tab === 'overview' && stats && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {stats.pendingOffices > 0 && (
              <div onClick={() => { setTab('offices'); setOfficeFilter('PENDING'); }}
                style={{ cursor: 'pointer', background: '#FFF7ED', border: '1.5px solid #F97316', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.1)' }}>
                <div style={{ background: '#F97316', color: 'white', padding: '8px', borderRadius: '50%' }}><MdBusiness size={24} /></div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: '#9A3412', fontSize: '1.1rem' }}>Action Required: {stats.pendingOffices} Offices Awaiting Approval</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#C2410C' }}>Click here to review fleet depots applying to join the network.</p>
                </div>
              </div>
            )}

            <div className="stat-grid" style={{ display: 'grid', gap: '20px', marginBottom: '24px' }}>
              {[
                { label: 'Total Platform Volume', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: MdAttachMoney, color: '#16A34A', bg: 'white', border: '#bbf7d0' },
                { label: 'Total Completed Bookings', value: stats.totalBookings, icon: MdReceipt, color: '#4F46E5', bg: 'white', border: '#c7d2fe' },
                { label: 'Daily Operations (Today)', value: stats.todayBookings, icon: MdTrendingUp, color: '#F97316', bg: 'white', border: '#fed7aa' },
                { label: 'Successful Delivery Rate', value: stats.deliveredBookings, icon: MdCheckCircle, color: '#16A34A', bg: 'white', border: '#bbf7d0' },
                { label: 'Pending Dispatch', value: stats.pendingBookings, icon: MdVisibility, color: '#F59E0B', bg: 'white', border: '#fde68a' },
                { label: 'Cancellation / Drop Rate', value: `${stats.cancelledBookings} (${stats.cancellationRate}%)`, icon: MdCancel, color: '#DC2626', bg: 'white', border: '#fecaca' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: '16px', padding: '24px', border: `1px solid ${s.border}`, borderTop: `4px solid ${s.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <s.icon size={28} color={s.color} />
                  </div>
                  <p style={{ fontWeight: 800, fontSize: '2rem', margin: '0 0 4px', color: '#0F172A' }}>{s.value}</p>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
                </div>
              ))}
            </div>

            <h3 style={{ margin: '32px 0 16px', color: '#0F172A' }}>Network Demographics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { label: 'Registered Customers', value: stats.totalUsers, color: '#8B5CF6' },
                { label: 'Fleet Captains', value: stats.totalCaptains, color: '#F97316' },
                { label: 'Active Depots', value: stats.totalOffices, color: '#3B82F6' },
              ].map(s => (
                <div key={s.label} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</p>
                    <p style={{ fontWeight: 800, fontSize: '2rem', margin: 0, color: s.color }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Offices Tab ──────── */}
        {tab === 'offices' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {['', 'PENDING', 'APPROVED', 'SUSPENDED', 'REJECTED'].map(f => (
                <button key={f} onClick={() => setOfficeFilter(f)}
                  style={{ padding: '8px 16px', borderRadius: '20px', border: `1.5px solid ${officeFilter === f ? '#8B5CF6' : '#E2E8F0'}`, background: officeFilter === f ? '#8B5CF6' : 'white', color: officeFilter === f ? 'white' : '#64748B', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                  {f === '' ? 'All Offices' : f}
                </button>
              ))}
            </div>

            <div className="table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Depot Name</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Location Metrics</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offices.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ fontWeight: 700, margin: 0, color: '#0F172A', fontSize: '1rem' }}>{o.name}</p>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Code <strong>{o.code}</strong> · {o.memberCount} Captains</p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ margin: 0, fontWeight: 500, color: '#334155' }}>City: {o.city}</p>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Radius: {o.serviceRadiusKm}km · {o.viewCount} views</p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: o.status === 'APPROVED' ? '#DCFCE7' : o.status === 'PENDING' ? '#FFEDD5' : '#FEE2E2', color: o.status === 'APPROVED' ? '#16A34A' : o.status === 'PENDING' ? '#EA580C' : '#DC2626', border: `1px solid ${o.status === 'APPROVED' ? '#BBF7D0' : o.status === 'PENDING' ? '#FED7AA' : '#FECACA'}` }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {o.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleOfficeStatus(o.id, 'APPROVED')} style={{ padding: '8px 16px', background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => handleOfficeStatus(o.id, 'REJECTED')} style={{ padding: '8px 16px', background: 'white', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                          </>
                        )}
                        {o.status === 'APPROVED' && (
                          <button onClick={() => handleOfficeStatus(o.id, 'SUSPENDED')} style={{ padding: '8px 16px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Suspend</button>
                        )}
                        <button onClick={() => handleDelete('offices', o.id)} style={{ padding: '8px 12px', background: 'white', color: '#DC2626', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: 0.8 }}><MdCancel size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {offices.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No offices found in this category.</div>}
            </div>
          </div>
        )}

        {/* ── Bookings Tab ──────── */}
        {tab === 'bookings' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
              {['', 'PENDING', 'ACCEPTED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(f => (
                <button key={f} onClick={() => setBookingFilter(f)}
                  style={{ padding: '8px 16px', borderRadius: '20px', border: `1.5px solid ${bookingFilter === f ? '#8B5CF6' : '#E2E8F0'}`, background: bookingFilter === f ? '#8B5CF6' : 'white', color: bookingFilter === f ? 'white' : '#64748B', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                  {f || 'All Bookings'}
                </button>
              ))}
            </div>

            <div className="table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Date & Customer</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Delivery Details</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Financial</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>{b.customer?.name || 'Guest User'}</p>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>{new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>To: {b.societyName || 'Local Delivery'}</p>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>via {b.captain?.name || 'Unassigned'} {b.office ? `(${b.office.name})` : ''}</p>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <p style={{ margin: 0, fontWeight: 800, color: '#16A34A', fontSize: '1.1rem' }}>₹{b.price}</p>
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', marginBottom: '8px', background: b.status === 'DELIVERED' ? '#DCFCE7' : b.status === 'CANCELLED' ? '#FEE2E2' : '#EFF6FF', color: b.status === 'DELIVERED' ? '#16A34A' : b.status === 'CANCELLED' ? '#DC2626' : '#2563EB', border: `1px solid ${b.status === 'DELIVERED' ? '#BBF7D0' : b.status === 'CANCELLED' ? '#FECACA' : '#BFDBFE'}` }}>{b.status}</span>
                        <div>
                          <button onClick={() => handleDelete('bookings', b.id)} style={{ padding: '4px 8px', background: 'none', color: '#DC2626', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                        </div>
                        {b.cancelReason && <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#DC2626', background: '#FEF2F2', padding: '4px 8px', borderRadius: '4px' }}>By {b.cancelledBy}: {b.cancelReason}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>No bookings found.</div>}
            </div>
          </div>
        )}

        {/* ── Users Tab ──────── */}
        {tab === 'users' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="table-container" style={{ background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.5px' }}>
                  <tr>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>User Entity</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Role & Verification</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Platform Footprint</th>
                    <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: u.role === 'CAPTAIN' ? '#FFF7ED' : '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {u.role === 'CAPTAIN' ? <MdLocalShipping size={20} color="#EA580C" /> : <MdPeople size={20} color="#4F46E5" />}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, margin: 0, color: '#0F172A' }}>{u.name || 'Anonymous'}</p>
                          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>{u.phoneNumber}</p>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, background: u.role === 'CAPTAIN' ? '#FFEDD5' : '#E0E7FF', color: u.role === 'CAPTAIN' ? '#C2410C' : '#4338CA' }}>{u.role}</span>
                        {u.role === 'CAPTAIN' && (
                          <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '6px' }}>Tanker: {u.vehicleNumber || 'Unset'} ({u.tankerCapacity}L)</div>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {u._count.bookingsAsCustomer > 0 && <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#F1F5F9', borderRadius: '6px', fontWeight: 600, color: '#475569' }}>{u._count.bookingsAsCustomer} Orders</span>}
                          {u._count.bookingsAsCaptain > 0 && <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#F0FDF4', borderRadius: '6px', fontWeight: 600, color: '#16A34A' }}>{u._count.bookingsAsCaptain} Deliveries</span>}
                        </div>
                        {u.isOnline && <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }}/> Actively Online</p>}
                      </td>
                      <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                        <button onClick={() => handleDelete('users', u.id)} style={{ padding: '6px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Delete Account</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
