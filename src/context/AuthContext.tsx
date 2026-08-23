import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  Tournament, 
  CategoryInfo, 
  BannerMedia, 
  Announcement, 
  PaymentSettings, 
  SupportSettings, 
  WebsiteSettings,
  MusicSettings,
  Notification,
  Transaction
} from '../types';
import { Language, translations } from '../lib/i18n';
import { safeFetchJson } from '../lib/api';

interface BootstrapData {
  categories: CategoryInfo[];
  banners: BannerMedia[];
  announcements: Announcement[];
  paymentSettings: PaymentSettings;
  supportSettings: SupportSettings;
  websiteSettings: WebsiteSettings;
  tournaments: Tournament[];
  musicSettings?: MusicSettings;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  bootstrap: BootstrapData | null;
  notifications: Notification[];
  unreadNotifsCount: number;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string; user?: User; isAdmin?: boolean; redirect?: string }>;
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string; user?: User; isAdmin?: boolean; redirect?: string }>;
  signup: (formData: any) => Promise<{ success: boolean; error?: string; user?: User; redirect?: string }>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  joinTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('egx_token'));
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('egx_lang') as Language) || 'bn');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('egx_theme') || localStorage.getItem('theme');
    return saved === 'dark';
  });
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const t = translations[language];

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('egx_lang', lang);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('egx_theme', next ? 'dark' : 'light');
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('egx_theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('egx_theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const refreshBootstrap = async () => {
    const res = await safeFetchJson<BootstrapData>('/api/bootstrap');
    if (res.ok && res.data) {
      setBootstrap(res.data);
    }
  };

  const refreshUserData = async () => {
    if (!token) return;
    const res = await safeFetchJson<{ user: User }>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok && res.data?.user) {
      setUser(res.data.user);
    } else if (res.status === 401 || res.status === 403) {
      logout();
    }

    // Fetch notifications
    const notifRes = await safeFetchJson<Notification[]>('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (notifRes.ok && Array.isArray(notifRes.data)) {
      setNotifications(notifRes.data);
    }
  };

  useEffect(() => {
    refreshBootstrap();
    if (token) {
      refreshUserData();
    }
  }, [token]);

  // Real-time Event Stream (SSE)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        if (!event.data) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.type === 'DATABASE_SYNC') {
            refreshBootstrap();
            if (token) {
              refreshUserData();
            }
          }
        } catch (e) {
          // ignore non-json frames safely
        }
      };
      eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    } catch (e) {
      console.error('SSE Error:', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    const res = await safeFetchJson<any>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: pass })
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Incorrect Email or Password.' };
    }
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('egx_token', res.data.token);
    return { 
      success: true, 
      user: res.data.user, 
      isAdmin: Boolean(res.data.isAdmin || res.data.user?.role === 'ADMIN'),
      redirect: res.data.redirect || (res.data.user?.role === 'ADMIN' ? '/admin' : '/')
    };
  };

  const adminLogin = async (email: string, pass: string) => {
    const res = await safeFetchJson<any>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Invalid Admin Credentials.' };
    }
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('egx_token', res.data.token);
    return { 
      success: true, 
      user: res.data.user, 
      isAdmin: true,
      redirect: '/admin'
    };
  };

  const signup = async (formData: any) => {
    const res = await safeFetchJson<any>('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Signup failed' };
    }
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('egx_token', res.data.token);
    return { 
      success: true, 
      user: res.data.user,
      redirect: '/'
    };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('egx_token');
  };

  const markNotificationsAsRead = async () => {
    if (!token) return;
    await safeFetchJson('/api/notifications/read-all', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const joinTournament = async (tournamentId: string) => {
    if (!token) {
      return { success: false, error: 'Please login or register to join tournaments.' };
    }
    const res = await safeFetchJson<any>(`/api/tournaments/${tournamentId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok || !res.data) {
      return { success: false, error: res.error || 'Failed to join tournament' };
    }
    setUser(res.data.user);
    refreshBootstrap();
    return { success: true, message: res.data.message };
  };

  const unreadNotifsCount = (Array.isArray(notifications) ? notifications : []).filter(n => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin: user?.role === 'ADMIN',
        language,
        setLanguage,
        t,
        isDarkMode,
        toggleDarkMode,
        bootstrap,
        notifications,
        unreadNotifsCount,
        login,
        adminLogin,
        signup,
        logout,
        refreshUserData,
        refreshBootstrap,
        markNotificationsAsRead,
        joinTournament
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
