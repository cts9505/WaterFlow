import { Link } from 'react-router-dom';
import { MdArrowBack, MdWaterDrop } from 'react-icons/md';

export default function PrivacyPolicy() {
  return (
    <div className="page" style={{ background: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F)', padding: '44px 24px 24px', color: 'white' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>
          <MdArrowBack size={16} /> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <MdWaterDrop size={24} />
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Privacy Policy</h1>
        </div>
        <p style={{ opacity: 0.7, fontSize: '0.82rem', margin: 0 }}>Last updated: April 11, 2026</p>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', fontSize: '0.88rem', lineHeight: 1.7, color: '#374151' }}>
        <Section title="1. Introduction">
          WaterFlow ("we", "our", "us") operates the WaterFlow water tanker delivery platform. This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our website and mobile application (the "Service").
        </Section>

        <Section title="2. Information We Collect">
          <B>Account Information:</B> When you register, we collect your name, mobile number, and password. Captains additionally provide vehicle number, tanker capacity, and office details.
          <br /><br />
          <B>Location Data:</B> We collect your device's GPS coordinates to show nearby water offices and enable live delivery tracking. Captain location is shared with customers only during active deliveries.
          <br /><br />
          <B>Booking Data:</B> We store delivery addresses, order details, pricing, booking status, and cancellation reasons.
          <br /><br />
          <B>Usage Data:</B> We automatically collect device type, browser, IP address, and pages visited for analytics and security.
        </Section>

        <Section title="3. How We Use Your Information">
          <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>
            <li>To provide and improve the tanker booking service</li>
            <li>To match you with nearby water offices and captains</li>
            <li>To enable real-time GPS tracking of deliveries</li>
            <li>To process payments and send booking confirmations</li>
            <li>To communicate service updates and support</li>
            <li>To detect fraud and ensure platform security</li>
            <li>To generate anonymized analytics for business improvement</li>
          </ul>
        </Section>

        <Section title="4. Location Data & Privacy">
          <B>Customer Location:</B> Used solely to find nearby offices and set delivery addresses. Not shared publicly.
          <br /><br />
          <B>Captain Location:</B> While online, captain GPS coordinates are used internally for dispatch. Captain live location is shared with customers <strong>only during an active delivery</strong>. At all other times, only the office location is displayed.
          <br /><br />
          You can disable location access through your device settings, but this will limit the app's functionality.
        </Section>

        <Section title="5. Data Sharing">
          We do <strong>not sell</strong> your personal data. We may share data with:
          <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>
            <li><B>Service Partners:</B> Water offices and captains receive necessary booking details to fulfill your order</li>
            <li><B>Legal Requirements:</B> When required by law, regulation, or legal process</li>
            <li><B>Business Transfers:</B> In connection with a merger, acquisition, or sale of assets</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          We retain your account data as long as your account is active. Booking history is retained for 3 years for legal and dispute resolution purposes. You may request account deletion by contacting us.
        </Section>

        <Section title="7. Data Security">
          We employ industry-standard measures including encrypted connections (HTTPS), hashed passwords (bcrypt), and access controls. However, no transmission method is 100% secure.
        </Section>

        <Section title="8. Your Rights">
          You have the right to:
          <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>
            <li>Access and download your personal data</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and associated data</li>
            <li>Withdraw consent for location tracking</li>
            <li>Lodge a complaint with a data protection authority</li>
          </ul>
        </Section>

        <Section title="9. Cookies">
          We use HTTP-only session cookies for authentication. We do not use third-party tracking cookies.
        </Section>

        <Section title="10. Children's Privacy">
          Our Service is not intended for children under 18. We do not knowingly collect data from minors.
        </Section>

        <Section title="11. Changes to This Policy">
          We may update this policy periodically. Changes will be posted on this page with an updated revision date.
        </Section>

        <Section title="12. Contact Us">
          If you have questions about this Privacy Policy, contact us at:
          <br /><br />
          <strong>Email:</strong> privacy@waterflow.in<br />
          <strong>Phone:</strong> +91 XXXXX XXXXX
        </Section>

        <div style={{ marginTop: '32px', padding: '16px', background: '#F3F4F6', borderRadius: '12px', textAlign: 'center' }}>
          <Link to="/terms" style={{ color: '#1A56DB', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
            Read our Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 8px', color: '#111827', fontSize: '1rem' }}>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: '#111827' }}>{children}</strong>;
}
