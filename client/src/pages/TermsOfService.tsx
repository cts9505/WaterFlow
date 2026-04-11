import { Link } from 'react-router-dom';
import { MdArrowBack, MdWaterDrop } from 'react-icons/md';

export default function TermsOfService() {
  return (
    <div className="page" style={{ background: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F)', padding: '44px 24px 24px', color: 'white' }}>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>
          <MdArrowBack size={16} /> Back
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <MdWaterDrop size={24} />
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Terms of Service</h1>
        </div>
        <p style={{ opacity: 0.7, fontSize: '0.82rem', margin: 0 }}>Last updated: April 11, 2026</p>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', fontSize: '0.88rem', lineHeight: 1.7, color: '#374151' }}>
        <Section title="1. Acceptance of Terms">
          By accessing or using the WaterFlow platform ("Service"), you agree to be bound by these Terms of Service. If you disagree with any part, you may not use our Service.
        </Section>

        <Section title="2. Service Description">
          WaterFlow is a technology platform that connects customers who need water tanker deliveries with verified water offices and their tanker drivers ("Captains"). We do not directly provide water delivery services — we facilitate connections between customers and independent water offices.
        </Section>

        <Section title="3. Eligibility">
          You must be at least 18 years old and legally capable of entering into contracts to use this Service. By registering, you confirm you meet these requirements.
        </Section>

        <Section title="4. User Accounts">
          <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>
            <li>You are responsible for maintaining the confidentiality of your credentials</li>
            <li>You must provide accurate, current, and complete information</li>
            <li>One account per person; accounts are non-transferable</li>
            <li>You must immediately notify us of any unauthorized use</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
          </ul>
        </Section>

        <Section title="5. Booking & Delivery">
          <B>Placing Orders:</B> When you book a water tanker, you agree to pay the quoted price. Prices are set by individual offices/captains and may vary.
          <br /><br />
          <B>Acceptance:</B> A booking is confirmed only when a captain accepts it. We do not guarantee that every booking request will be fulfilled.
          <br /><br />
          <B>Delivery:</B> Delivery times are estimates. We are not liable for delays caused by traffic, weather, or office availability.
        </Section>

        <Section title="6. Cancellation Policy">
          <B>Customer Cancellations:</B> You may cancel a booking before the tanker departs. A cancellation reason is required and will be recorded.
          <br /><br />
          <B>Captain/Office Cancellations:</B> Captains may cancel bookings with a valid reason. Frequent cancellations may result in account review.
          <br /><br />
          <B>Refunds:</B> Refund eligibility depends on the cancellation timing and reason. Contact support for disputes.
        </Section>

        <Section title="7. Payments">
          All payments are processed directly between customers and water offices. WaterFlow does not handle, process, or store payment information at this time. Payment terms are determined by individual offices.
        </Section>

        <Section title="8. Water Office & Captain Responsibilities">
          <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>
            <li>Offices must maintain valid permits and licenses as required by local law</li>
            <li>Water quality is the sole responsibility of the delivering office</li>
            <li>Captains must operate vehicles with valid licenses and insurance</li>
            <li>Offices must accurately represent their service radius and pricing</li>
          </ul>
        </Section>

        <Section title="9. Prohibited Conduct">
          You agree not to:
          <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>
            <li>Use the Service for any unlawful purpose</li>
            <li>Impersonate another person or entity</li>
            <li>Submit false office registrations or fake reviews</li>
            <li>Attempt to hack, disable, or overload the platform</li>
            <li>Harass, threaten, or abuse other users or captains</li>
            <li>Manipulate pricing or booking systems</li>
          </ul>
        </Section>

        <Section title="10. Intellectual Property">
          The WaterFlow name, logo, and all platform content are owned by WaterFlow. You may not copy, modify, or distribute any part of our Service without written permission.
        </Section>

        <Section title="11. Limitation of Liability">
          WaterFlow is a technology platform and does not guarantee water quality, delivery timeliness, or captain behavior. To the maximum extent permitted by law:
          <ul style={{ paddingLeft: '18px', margin: '8px 0' }}>
            <li>We are not liable for indirect, incidental, or consequential damages</li>
            <li>Our total liability shall not exceed the amount paid for the specific booking in dispute</li>
            <li>We do not warrant uninterrupted or error-free service</li>
          </ul>
        </Section>

        <Section title="12. Indemnification">
          You agree to indemnify and hold WaterFlow harmless from any claims, losses, or damages arising from your use of the Service or violation of these Terms.
        </Section>

        <Section title="13. Dispute Resolution">
          Any disputes shall first be attempted to resolve through good-faith negotiation. If unresolved, disputes shall be subject to arbitration in accordance with Indian law, with the seat of arbitration in Maharashtra, India.
        </Section>

        <Section title="14. Governing Law">
          These Terms are governed by the laws of India, specifically the Indian Contract Act, 1872 and the Information Technology Act, 2000.
        </Section>

        <Section title="15. Modifications">
          We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="16. Contact Us">
          For questions about these Terms, contact us at:
          <br /><br />
          <strong>Email:</strong> legal@waterflow.in<br />
          <strong>Phone:</strong> +91 XXXXX XXXXX
        </Section>

        <div style={{ marginTop: '32px', padding: '16px', background: '#F3F4F6', borderRadius: '12px', textAlign: 'center' }}>
          <Link to="/privacy" style={{ color: '#1A56DB', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
            Read our Privacy Policy →
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
