import { Link } from 'react-router-dom';
import { MdWaterDrop, MdLocalShipping, MdSpeed, MdSecurity, MdArrowForward, MdPerson, MdLocationOn, MdVerified } from 'react-icons/md';

const features = [
  { Icon: MdLocalShipping, title: 'On-demand delivery', desc: 'Book a tanker in under 2 minutes', color: '#1A56DB', bg: '#EEF2FF' },
  { Icon: MdSpeed, title: 'Live GPS tracking', desc: 'Watch your tanker approach in real-time', color: '#F97316', bg: '#FFF7ED' },
  { Icon: MdSecurity, title: 'Verified offices', desc: 'Every water office is vetted & approved', color: '#16A34A', bg: '#F0FDF4' },
  { Icon: MdLocationOn, title: 'Area coverage', desc: 'Find offices serving your exact location', color: '#7C3AED', bg: '#F5F3FF' },
];

const stats = [
  { value: '500+', label: 'Water Offices' },
  { value: '10K+', label: 'Deliveries' },
  { value: '4.8★', label: 'Rating' },
];

export default function Landing() {
  return (
    <div className="page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E3A5F 40%, #1A56DB 100%)',
        padding: '40px 24px 48px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        <div style={{ position: 'absolute', top: '50%', right: '20%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59,130,246,0.15)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', position: 'relative' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MdWaterDrop size={24} />
          </div>
          <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px' }}>WaterFlow</span>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '14px', letterSpacing: '-0.5px' }}>
            Water Tanker<br />
            <span style={{ background: 'linear-gradient(90deg, #60A5FA, #93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>at Your Doorstep</span>
          </h1>
          <p style={{ opacity: 0.75, fontSize: '0.92rem', lineHeight: 1.55, maxWidth: '320px' }}>
            India's smartest way to book a water tanker. Transparent pricing, live GPS tracking, and verified offices.
          </p>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '28px', position: 'relative' }}>
          <Link to="/signin?role=customer&tab=register"
            style={{ flex: 1, padding: '14px 16px', background: 'white', color: '#1A56DB', borderRadius: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', transition: 'transform 0.15s' }}>
            <MdPerson size={18} /> I need water
          </Link>
          <Link to="/signin?role=captain&tab=register"
            style={{ flex: 1, padding: '14px 16px', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backdropFilter: 'blur(8px)' }}>
            <MdLocalShipping size={18} /> I drive a tanker
          </Link>
        </div>

        {/* Stats Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '32px', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.12)', position: 'relative' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: '1.2rem', margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: '0.68rem', opacity: 0.6, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: '32px 24px 8px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1A56DB', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>How it works</p>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px', color: '#0F172A' }}>Simple & Fast</h2>
        <p style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '20px' }}>Get water delivered in 3 easy steps</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '8px' }}>
          {[
            { step: '1', title: 'Find nearby offices', desc: 'See all water offices serving your area on the map' },
            { step: '2', title: 'Book or call directly', desc: 'Choose a tanker size and book instantly, or call the office' },
            { step: '3', title: 'Track your delivery', desc: 'Watch your tanker arrive in real-time with live GPS' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #1A56DB, #3B82F6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                {s.step}
              </div>
              <div>
                <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: '0.92rem', color: '#0F172A' }}>{s.title}</p>
                <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '24px 24px 8px' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Why WaterFlow</p>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: '#0F172A' }}>Built for reliability</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {features.map(({ Icon, title, desc, color, bg }) => (
            <div key={title} style={{ padding: '16px', borderRadius: '14px', background: bg, border: `1px solid ${color}15` }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Icon size={20} color={color} />
              </div>
              <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '0.85rem', color: '#0F172A' }}>{title}</p>
              <p style={{ color: '#6B7280', margin: 0, fontSize: '0.72rem', lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust banner */}
      <div style={{ margin: '24px 24px', padding: '18px', borderRadius: '14px', background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <MdVerified size={28} color="#16A34A" />
        <div>
          <p style={{ fontWeight: 700, margin: 0, fontSize: '0.88rem', color: '#15803D' }}>All offices verified</p>
          <p style={{ color: '#6B7280', fontSize: '0.75rem', margin: '2px 0 0' }}>Every water depot is admin-approved before appearing on the map</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '24px', background: '#F9FAFB', borderTop: '1px solid #E5E7EB', textAlign: 'center', marginTop: 'auto' }}>
        <p style={{ color: '#9CA3AF', fontSize: '0.78rem', marginBottom: '8px' }}>Already have an account?</p>
        <Link to="/signin" style={{ color: '#1A56DB', fontWeight: 700, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
          Sign In <MdArrowForward size={16} />
        </Link>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <Link to="/manage" style={{ color: '#F97316', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}>Fleet Portal</Link>
          <Link to="/about" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'none' }}>About</Link>
          <Link to="/privacy" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'none' }}>Privacy</Link>
          <Link to="/terms" style={{ color: '#6B7280', fontSize: '0.75rem', textDecoration: 'none' }}>Terms</Link>
        </div>
        <p style={{ color: '#D1D5DB', fontSize: '0.68rem', marginTop: '12px' }}>© 2026 WaterFlow · India</p>
      </div>
    </div>
  );
}
