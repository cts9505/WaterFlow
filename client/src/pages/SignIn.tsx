import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdVisibility, MdVisibilityOff, MdPhone, MdLock,
  MdArrowForward, MdWaterDrop, MdPerson, MdLocalShipping, MdBusiness
} from 'react-icons/md';

export default function SignIn() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialRole = params.get('role') === 'captain' ? 'CAPTAIN' : 'CUSTOMER';
  const initialTab = params.get('tab') === 'register' ? 'register' : 'login';

  const initialIntent = params.get('intent') || '';
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [role, setRole] = useState<'CUSTOMER' | 'CAPTAIN'>(initialRole);
  const [intent] = useState(initialIntent);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setErrors({});
    const e: Record<string, string> = {};
    if (!/^[6-9]\d{9}$/.test(phone)) e.phoneNumber = 'Enter a valid 10-digit Indian mobile number (start with 6-9)';
    if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (tab === 'register' && (!name.trim() || name.trim().length < 2)) e.name = 'Name must be at least 2 characters';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(phone, password, role);
        navigate(role === 'CAPTAIN' ? (intent === 'create-office' ? '/create-office' : '/captain') : '/home');
      } else {
        await register({ phoneNumber: phone, password, name, role });
        navigate(intent ? `/onboarding?intent=${intent}` : '/onboarding');
      }
    } catch (err: any) {
      const se = err.response?.data?.errors;
      if (se && typeof se === 'object') setErrors(se);
      else setErrors({ form: err.response?.data?.error || 'Something went wrong' });
    } finally { setLoading(false); }
  };

  return (
    <div className="page" style={{ minHeight: '100vh', background: 'white' }}>
      <div style={{ background: 'linear-gradient(135deg, #1A56DB, #1E40AF)', padding: '48px 24px 32px', color: 'white' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
          <MdArrowForward size={16} style={{ transform: 'rotate(180deg)' }} /> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <MdWaterDrop size={28} /><h2 style={{ margin: 0 }}>WaterFlow</h2>
        </div>
        <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
          {tab === 'login' ? 'Welcome back! Sign in to continue.' : intent === 'create-office' ? 'Create an Office Owner account' : 'Create your account to get started.'}
        </p>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Role Toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#F3F4F6', borderRadius: '12px', padding: '4px' }}>
          {([['CUSTOMER', 'Customer', MdPerson], ['CAPTAIN', 'Captain', MdLocalShipping]] as const).map(([r, label, Icon]) => (
            <button key={r} onClick={() => setRole(r)}
              style={{ flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', background: role === r ? 'white' : 'transparent', color: role === r ? '#1A56DB' : '#6B7280', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: role === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontSize: '0.9rem', transition: 'all 0.2s' }}>
              <Icon size={18} />{label}
            </button>
          ))}
        </div>

        {/* Tab Toggle */}
        <div style={{ display: 'flex', marginBottom: '24px', borderBottom: '2px solid #F3F4F6' }}>
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setErrors({}); }}
              style={{ flex: 1, padding: '12px 0', border: 'none', background: 'none', fontWeight: 600, color: tab === t ? '#1A56DB' : '#9CA3AF', borderBottom: tab === t ? '2px solid #1A56DB' : '2px solid transparent', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '-2px' }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {errors.form && <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 500 }}>{errors.form}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tab === 'register' && (
            <div className="input-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdPerson size={14} color="#6B7280" /> Full Name</label>
              <input placeholder="e.g. Raj Kumar" value={name} onChange={e => setName(e.target.value)} />
              {errors.name && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.name}</span>}
            </div>
          )}

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdPhone size={14} color="#6B7280" /> Mobile Number</label>
            <div style={{ display: 'flex', alignItems: 'stretch' }}>
              <span style={{ padding: '14px 16px', background: '#F3F4F6', borderRadius: '12px 0 0 12px', border: '1.5px solid #E5E7EB', borderRight: 'none', color: '#374151', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>+91</span>
              <input placeholder="9876543210" value={phone} maxLength={10} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} style={{ borderRadius: '0 12px 12px 0', borderLeft: 'none', flex: 1 }} />
            </div>
            {errors.phoneNumber && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.phoneNumber}</span>}
          </div>

          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MdLock size={14} color="#6B7280" /> Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                {showPw ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
            {errors.password && <span style={{ color: '#DC2626', fontSize: '0.78rem' }}>{errors.password}</span>}
          </div>
        </div>

        <button className="btn btn-blue" onClick={handleSubmit} disabled={loading} style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'} {!loading && <MdArrowForward size={18} />}
        </button>

        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.85rem', marginTop: '20px' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setErrors({}); }} style={{ background: 'none', border: 'none', color: '#1A56DB', fontWeight: 600, cursor: 'pointer' }}>
            {tab === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>

        {/* Create Office Shortcut */}
        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1.5px solid #F3F4F6', paddingTop: '20px' }}>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '12px' }}>Want to supply water or manage an office?</p>
          <button onClick={() => navigate('/manage')} style={{ background: '#FFF7ED', color: '#F97316', border: '1.5px solid #FFEDD5', padding: '10px 16px', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 auto' }}>
            <MdBusiness size={16} /> Enterprise Portal
          </button>
        </div>
      </div>
    </div>
  );
}
