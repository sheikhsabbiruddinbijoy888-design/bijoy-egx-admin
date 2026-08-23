import React, { useState, useEffect } from 'react';
import { 
  ScrollText, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  User, 
  Activity,
  Terminal
} from 'lucide-react';
import { safeFetchJson } from '../lib/api';
import { AuditLog } from '../types';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<AuditLog[]>('/api/admin/audit-logs');
      if (res.ok && Array.isArray(res.data)) setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.targetType && log.targetType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.targetId && log.targetId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.adminEmail && log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.details && JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())) ||
    log.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-[#10213A] dark:text-white tracking-tight">
            Security & Audit Activity Logs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable tracking record of every administrative action, deposit confirmation, user suspension, and match result.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[#10213A] dark:text-white text-xs font-black flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-[#0B132B] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search action, actor, target or details..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium focus:outline-hidden focus:border-[#176BFF]"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          {filteredLogs.length} Records Logged
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#0B132B] rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-400 border-b border-slate-200 dark:border-slate-800 uppercase font-black text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target / Entity</th>
                <th className="py-3.5 px-4">Operator / Admin</th>
                <th className="py-3.5 px-4">Metadata Details</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 font-mono">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#176BFF] dark:text-blue-400 font-black text-[10px] border border-blue-200 dark:border-blue-800">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-[#10213A] dark:text-white">
                      {log.targetType || 'ENTITY'} {log.targetId ? `(#${log.targetId})` : ''}
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {log.adminEmail || 'System / Admin'}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-xs font-sans text-xs">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || log.newValue || '-')}
                    </td>

                    <td className="py-3 px-4 text-right text-[11px] text-slate-400">
                      {log.timestamp || log.createdAt ? (
                        <>
                          {new Date(log.timestamp || log.createdAt || '').toLocaleDateString()} {new Date(log.timestamp || log.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
