import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import Onboarding from './pages/Onboarding';
import HomeMap from './pages/HomeMap';
import OrderPage from './pages/OrderPage';
import LiveTracking from './pages/LiveTracking';
import BookingHistory from './pages/BookingHistory';
import Profile from './pages/Profile';
import SetPrice from './pages/SetPrice';
import AddressSetup from './pages/AddressSetup';
import CaptainHome from './pages/CaptainHome';
import CaptainActiveDelivery from './pages/CaptainActiveDelivery';
import CaptainEarnings from './pages/CaptainEarnings';
import CreateOffice from './pages/CreateOffice';
import JoinOffice from './pages/JoinOffice';
import OfficeDashboard from './pages/OfficeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AboutUs from './pages/AboutUs';
import OfficeAuth from './pages/office/OfficeAuth';
import OfficePortal from './pages/office/OfficePortal';

const Protect = ({ children, role }: { children: React.ReactNode; role?: 'CAPTAIN' | 'CUSTOMER' | 'ADMIN' }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#1A56DB', fontSize: '1.2rem', fontWeight: 600 }}>Loading...</div>;
  if (!user) return <Navigate to="/signin" replace />;
  
  if (role && user.role !== role) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to={user.role === 'CAPTAIN' ? '/captain' : '/home'} replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/onboarding" element={<Protect><Onboarding /></Protect>} />
      <Route path="/home" element={<Protect role="CUSTOMER"><HomeMap /></Protect>} />
      <Route path="/order" element={<Protect role="CUSTOMER"><OrderPage /></Protect>} />
      <Route path="/track/:bookingId" element={<Protect role="CUSTOMER"><LiveTracking /></Protect>} />
      <Route path="/orders" element={<Protect><BookingHistory /></Protect>} />
      <Route path="/profile" element={<Protect><Profile /></Protect>} />
      <Route path="/set-price" element={<Protect><SetPrice /></Protect>} />
      <Route path="/addresses" element={<Protect><AddressSetup /></Protect>} />
      <Route path="/captain" element={<Protect role="CAPTAIN"><CaptainHome /></Protect>} />
      <Route path="/captain/active/:bookingId" element={<Protect role="CAPTAIN"><CaptainActiveDelivery /></Protect>} />
      <Route path="/captain/earnings" element={<Protect role="CAPTAIN"><CaptainEarnings /></Protect>} />
      <Route path="/office/create" element={<Protect role="CAPTAIN"><CreateOffice /></Protect>} />
      <Route path="/office/join" element={<Protect role="CAPTAIN"><JoinOffice /></Protect>} />
      <Route path="/office/:id" element={<Protect><OfficeDashboard /></Protect>} />
      <Route path="/admin" element={<Protect role="ADMIN"><AdminDashboard /></Protect>} />
      
      {/* Office Admin Desktop Portal */}
      <Route path="/manage" element={<OfficeAuth />} />
      <Route path="/manage/dashboard" element={<Protect role="CAPTAIN"><OfficePortal /></Protect>} />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayouts />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppLayouts() {
  const location = useLocation();
  const isDesktop = location.pathname.startsWith('/manage') || location.pathname.startsWith('/admin');

  return isDesktop ? (
    <AppRoutes />
  ) : (
    <div className="shell">
      <AppRoutes />
    </div>
  );
}
