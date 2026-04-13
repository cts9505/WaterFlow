import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

import { api } from '../services/api';
export { api };

interface User { id: string; name: string; phoneNumber: string; email?: string; role: 'CUSTOMER' | 'CAPTAIN' | 'ADMIN'; isVerified: boolean; isOnline?: boolean; vehicleNumber?: string; serviceRadiusKm?: number; tankerCapacity?: number; basePrice?: number; operationLat?: number; operationLng?: number; addresses?: any[]; createdAt?: string; }

interface AuthCtx { user: User | null; loading: boolean; login: (phone: string, password: string, role?: string) => Promise<void>; register: (data: any) => Promise<void>; logout: () => Promise<void>; refresh: () => Promise<void>; }

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try { const r = await api.get('/auth/me'); setUser(r.data.user); }
    catch { setUser(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  // NOTE: Removed the beforeunload handler that was setting captains offline.
  // This was causing the "status resets on refresh" bug.
  // Stale captains are now cleaned up by the server-side heartbeat interval.

  const login = async (phoneNumber: string, password: string, role?: string) => {
    const r = await api.post('/auth/login', { phoneNumber, password, role });
    if (r.data.token) localStorage.setItem('waterflow_token', r.data.token);
    setUser(r.data.user);
  };

  const register = async (data: any) => {
    const r = await api.post('/auth/register', data);
    if (r.data.token) localStorage.setItem('waterflow_token', r.data.token);
    setUser(r.data.user);
  };

  const logout = async () => { 
    await api.post('/auth/logout'); 
    localStorage.removeItem('waterflow_token');
    setUser(null); 
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
};

export const useAuth = () => useContext(Ctx);
