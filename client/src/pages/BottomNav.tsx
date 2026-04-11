import { Link, useLocation } from 'react-router-dom';
import { MdWaterDrop, MdLocalShipping, MdPerson, MdReceipt, MdTrendingUp, MdPersonOutline, MdDashboard } from 'react-icons/md';

const customerTabs = [
  { path: '/home', label: 'Home', Icon: MdWaterDrop },
  { path: '/orders', label: 'Orders', Icon: MdReceipt },
  { path: '/profile', label: 'Profile', Icon: MdPerson },
];

const captainTabs = [
  { path: '/captain', label: 'Home', Icon: MdLocalShipping },
  { path: '/captain/earnings', label: 'Earnings', Icon: MdTrendingUp },
  { path: '/profile', label: 'Profile', Icon: MdPersonOutline },
];

const adminTabs = [
  { path: '/admin', label: 'Dashboard', Icon: MdDashboard },
  { path: '/profile', label: 'Profile', Icon: MdPerson },
];

export default function BottomNav({ role }: { role: 'CUSTOMER' | 'CAPTAIN' | 'ADMIN' }) {
  const location = useLocation();
  const tabs = role === 'ADMIN' ? adminTabs : role === 'CAPTAIN' ? captainTabs : customerTabs;
  const accentColor = role === 'CAPTAIN' ? '#F97316' : role === 'ADMIN' ? '#7C3AED' : '#1A56DB';

  return (
    <>
      {/* Inject responsive styles */}
      <style>{`
        .wf-bottom-nav {
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid #E5E7EB;
          padding: 8px 0;
          padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
          background: white;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 999;
          box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
        }
        @media (min-width: 481px) {
          .wf-bottom-nav {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            max-width: 430px;
            width: 100%;
          }
        }
      `}</style>
      <nav className="wf-bottom-nav">
        {tabs.map(t => {
          const active = location.pathname === t.path ||
            (t.path !== '/' && t.path !== '/home' && t.path !== '/captain' && t.path !== '/admin'
              && location.pathname.startsWith(t.path));
          const color = active ? accentColor : '#9CA3AF';
          return (
            <Link key={t.path} to={t.path}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                textDecoration: 'none', color, padding: '4px 16px', transition: 'color 0.15s',
                position: 'relative',
              }}>
              {active && (
                <div style={{
                  position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)',
                  width: '20px', height: '3px', borderRadius: '2px', background: accentColor,
                }} />
              )}
              <t.Icon size={22} />
              <span style={{ fontSize: '0.65rem', fontWeight: active ? 700 : 500 }}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
