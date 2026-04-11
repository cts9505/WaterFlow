import { Link } from 'react-router-dom';
import { MdArrowBack, MdWaterDrop, MdLocationOn, MdSpeed, MdSecurity, MdPeople, MdVerified, MdEmail, MdPhone } from 'react-icons/md';

const values = [
  { Icon: MdSpeed, title: 'Speed', desc: 'We believe access to water should never be delayed. Our platform connects you with nearby offices in under 2 minutes.', color: '#F97316', bg: '#FFF7ED' },
  { Icon: MdSecurity, title: 'Transparency', desc: 'No hidden charges, no surprises. Every office shows upfront pricing and service radius before you book.', color: '#16A34A', bg: '#F0FDF4' },
  { Icon: MdVerified, title: 'Trust', desc: 'Every water office is admin-verified before appearing on our platform. We track quality and reliability metrics.', color: '#1A56DB', bg: '#EEF2FF' },
  { Icon: MdPeople, title: 'Community', desc: 'We empower local water businesses with technology — helping them manage, dispatch, and grow sustainably.', color: '#7C3AED', bg: '#F5F3FF' },
];

export default function AboutUs() {
  return (
    <div className="page" style={{ background: 'white', minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0F172A 0%, #1E3A5F 40%, #1A56DB 100%)',
        padding: '44px 24px 40px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '-20px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px', position: 'relative' }}>
          <MdArrowBack size={16} /> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', position: 'relative' }}>
          <MdWaterDrop size={28} />
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>About WaterFlow</h1>
        </div>
        <p style={{ opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '340px', position: 'relative' }}>
          We're building India's most reliable water tanker delivery platform — connecting communities with verified water offices.
        </p>
      </div>

      <div style={{ padding: '28px 24px' }}>
        {/* Mission */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1A56DB', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Our Mission</p>
          <h2 style={{ margin: '0 0 12px', color: '#0F172A', fontSize: '1.3rem' }}>Water access shouldn't be a struggle</h2>
          <p style={{ color: '#4B5563', fontSize: '0.88rem', lineHeight: 1.7 }}>
            In many Indian cities and towns, getting water delivered is still a phone call, a guess, and a wait. WaterFlow changes that by bringing technology to an essential service — making water tanker booking as easy as ordering food online.
          </p>
          <p style={{ color: '#4B5563', fontSize: '0.88rem', lineHeight: 1.7, marginTop: '12px' }}>
            We don't own tankers. We don't supply water. We build the technology that makes the entire process — from discovery to delivery — transparent, trackable, and reliable.
          </p>
        </div>

        {/* How It Works */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>How It Works</p>
          <h2 style={{ margin: '0 0 16px', color: '#0F172A', fontSize: '1.3rem' }}>Simple for everyone</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { role: 'Customers', desc: 'Open the app, see water offices on the map, book a tanker or call directly, and track your delivery in real-time.' },
              { role: 'Water Offices', desc: 'Register your depot, set your service area and pricing, manage your team of captains, and receive bookings automatically.' },
              { role: 'Captains', desc: 'Join a water office, go online when ready, accept delivery requests, and complete deliveries with GPS navigation.' },
            ].map(item => (
              <div key={item.role} style={{ padding: '16px', borderRadius: '12px', border: '1.5px solid #E5E7EB' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>{item.role}</p>
                <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Our Values</p>
          <h2 style={{ margin: '0 0 16px', color: '#0F172A', fontSize: '1.3rem' }}>What drives us</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {values.map(({ Icon, title, desc, color, bg }) => (
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

        {/* Contact */}
        <div style={{ padding: '20px', borderRadius: '14px', background: '#F9FAFB', border: '1.5px solid #E5E7EB' }}>
          <h3 style={{ margin: '0 0 12px', color: '#0F172A' }}>Get in Touch</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a href="mailto:hello@waterflow.in" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1A56DB', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}>
              <MdEmail size={18} /> hello@waterflow.in
            </a>
            <a href="tel:+91XXXXXXXXXX" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1A56DB', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500 }}>
              <MdPhone size={18} /> +91 XXXXX XXXXX
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6B7280', fontSize: '0.88rem' }}>
              <MdLocationOn size={18} /> Maharashtra, India
            </div>
          </div>
        </div>

        {/* Links */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/privacy" style={{ color: '#6B7280', fontSize: '0.82rem', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: '#6B7280', fontSize: '0.82rem', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
