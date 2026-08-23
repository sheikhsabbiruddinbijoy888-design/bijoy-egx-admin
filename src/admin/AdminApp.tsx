import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from './AdminLayout';
import { AdminLogin } from './AdminLogin';

// Admin Tab Components
import { AdminDashboard } from './AdminDashboard';
import { AdminUsers } from './AdminUsers';
import { AdminUserPayments } from './AdminUserPayments';
import { AdminDeposits } from './AdminDeposits';
import { AdminWithdrawals } from './AdminWithdrawals';
import { AdminTransactions } from './AdminTransactions';
import { AdminTournaments } from './AdminTournaments';
import { AdminMatches } from './AdminMatches';
import { AdminMatchResults } from './AdminMatchResults';
import { AdminParticipants } from './AdminParticipants';
import { AdminHomepage } from './AdminHomepage';
import { AdminBannerManagement } from './AdminBannerManagement';
import { AdminMusicManagement } from './AdminMusicManagement';
import { AdminCategories } from './AdminCategories';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminNotifications } from './AdminNotifications';
import { AdminSettings } from './AdminSettings';
import { AdminAuditLogs } from './AdminAuditLogs';

interface AdminAppProps {
  onExitAdmin: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onExitAdmin }) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Handle URL hash changes like #admin/deposits or #admin/tournaments
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#admin/')) {
        const tab = hash.replace('#admin/', '');
        if (tab) setCurrentTab(tab);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = `admin/${tab}`;
  };

  // If user is not authenticated or not an admin, render AdminLogin
  if (!user || user.role !== 'ADMIN') {
    return (
      <AdminLogin 
        onSuccess={() => setCurrentTab('dashboard')} 
        onBackToUserPanel={onExitAdmin} 
      />
    );
  }

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      onExitAdmin={onExitAdmin}
    >
      {currentTab === 'dashboard' && <AdminDashboard onNavigate={handleSelectTab} />}
      {currentTab === 'users' && <AdminUsers />}
      {currentTab === 'user-payments' && <AdminUserPayments />}
      {currentTab === 'deposits' && <AdminDeposits />}
      {currentTab === 'withdrawals' && <AdminWithdrawals />}
      {currentTab === 'transactions' && <AdminTransactions />}
      {currentTab === 'tournaments' && <AdminTournaments />}
      {currentTab === 'matches' && <AdminMatches />}
      {currentTab === 'results' && <AdminMatchResults />}
      {currentTab === 'participants' && <AdminParticipants />}
      {currentTab === 'homepage' && <AdminHomepage />}
      {currentTab === 'banner-management' && <AdminBannerManagement />}
      {currentTab === 'music-management' && <AdminMusicManagement />}
      {currentTab === 'categories' && <AdminCategories />}
      {currentTab === 'announcements' && <AdminAnnouncements />}
      {currentTab === 'notifications' && <AdminNotifications />}
      {currentTab === 'payment-settings' && <AdminSettings initialTab="payment-settings" />}
      {currentTab === 'website-settings' && <AdminSettings initialTab="website-settings" />}
      {currentTab === 'support-settings' && <AdminSettings initialTab="support-settings" />}
      {currentTab === 'admin-profile' && <AdminSettings initialTab="admin-profile" />}
      {currentTab === 'audit-logs' && <AdminAuditLogs />}
    </AdminLayout>
  );
};
