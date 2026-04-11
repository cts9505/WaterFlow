import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../context/AuthContext';
import { MdArrowBack, MdBusiness, MdPerson, MdCheckCircle, MdCancel, MdPhone, MdVisibility, MdCallMade, MdLocalShipping, MdContentCopy } from 'react-icons/md';

export default function OfficeDashboard() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [office, setOffice] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/offices/${id}`).then(r => setOffice(r.data.office)),
      api.get(`/offices/${id}/members`).then(r => setMembers(r.data.members)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  const handleMemberAction = async (memberId: string, status: string) => {
    try {
      await api.patch(`/offices/${id}/members/${memberId}`, { status });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, status } : m));
    } catch {}
  };

  const copyCode = () => {
    navigator.clipboard.writeText(office?.code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7280' }}>Loading office...</div>;
  }

  if (!office) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#DC2626' }}>Office not found</div>;
  }

  const isOwner = office.ownerId === user?.id;
  const pending = members.filter(m => m.status === 'PENDING');
  const approved = members.filter(m => m.status === 'APPROVED');

  return (
    <div className="page" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1A56DB, #1E40AF)', padding: '48px 20px 24px', color: 'white' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginBottom: '12px' }}>
          <MdArrowBack size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdBusiness size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>{office.name}</h2>
            <p style={{ opacity: 0.8, fontSize: '0.85rem', margin: '2px 0 0' }}>{office.city} · {office.serviceRadiusKm}km radius</p>
          </div>
        </div>

        {/* Office Code */}
        <div onClick={copyCode} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.15)', padding: '12px 16px', borderRadius: '12px', marginTop: '16px', cursor: 'pointer' }}>
          <div>
            <p style={{ fontSize: '0.7rem', opacity: 0.7, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Office Code</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '4px' }}>{office.code}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {copied ? <MdCheckCircle size={20} /> : <MdContentCopy size={20} style={{ opacity: 0.7 }} />}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '16px' }}>
          {[
            [String(approved.length), 'Captains', MdLocalShipping],
            [String(office.viewCount || 0), 'Views', MdVisibility],
            [String(office.callCount || 0), 'Calls', MdCallMade],
          ].map(([val, label, Icon]: any) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <Icon size={16} style={{ opacity: 0.8, marginBottom: '4px' }} />
              <p style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{val}</p>
              <p style={{ fontSize: '0.68rem', opacity: 0.7, margin: '2px 0 0' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* Contact */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: '#F9FAFB', borderRadius: '12px', marginBottom: '16px' }}>
          <MdPhone size={18} color="#1A56DB" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{office.phone}</span>
          {office.address && <span style={{ color: '#6B7280', fontSize: '0.8rem', marginLeft: 'auto' }}>{office.address}</span>}
        </div>

        {/* Pending Requests */}
        {isOwner && pending.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '10px', color: '#F97316', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MdPerson size={18} /> Pending Requests ({pending.length})
            </h3>
            {pending.map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1.5px solid #FED7AA', borderRadius: '12px', marginBottom: '8px', background: '#FFF7ED' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{m.captain.name || 'Captain'}</p>
                  <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: '2px 0 0' }}>{m.captain.phoneNumber} · {m.captain.vehicleNumber || 'No vehicle'} · {m.captain.tankerCapacity}L</p>
                </div>
                <button onClick={() => handleMemberAction(m.id, 'APPROVED')}
                  style={{ background: '#16A34A', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdCheckCircle size={14} /> Accept
                </button>
                <button onClick={() => handleMemberAction(m.id, 'REJECTED')}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MdCancel size={14} /> Reject
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Active Members */}
        <h3 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MdLocalShipping size={18} color="#1A56DB" /> Members ({approved.length})
        </h3>
        {approved.length === 0 && (
          <p style={{ color: '#6B7280', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No approved members yet</p>
        )}
        {approved.map((m: any) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '12px', marginBottom: '8px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: m.captain.isOnline ? '#F0FDF4' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MdPerson size={18} color={m.captain.isOnline ? '#16A34A' : '#9CA3AF'} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>{m.captain.name || 'Captain'}</p>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '2px 0 0' }}>{m.captain.vehicleNumber || ''} · {m.captain.tankerCapacity}L</p>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '8px', fontWeight: 600, background: m.captain.isOnline ? '#F0FDF4' : '#F3F4F6', color: m.captain.isOnline ? '#16A34A' : '#9CA3AF' }}>
              {m.captain.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
