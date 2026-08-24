import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, User, Mail, Phone, Lock, 
  CheckCircle2, XCircle, Clock, MapPin, RefreshCw, X, Check, Eye
} from 'lucide-react';

export default function AdminSecurityStaffManager() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Officer Form
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    phone: '',
    gate_assigned: 'Main Campus Gate A',
    shift: 'Day Shift (08:00 AM - 04:00 PM)',
    password: 'password123'
  });

  useEffect(() => {
    fetchSecurityStaff();
  }, []);

  const fetchSecurityStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/security-staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      } else {
        // Fallback default security staff
        setStaffList([
          { id: 'sec_prof_u_sec_01', user_id: 'u_sec_01', name: 'Officer Vikram Singh', email: 'security@gsfcuniversity.ac.in', phone: '+91 98250 11223', gate_assigned: 'Main Campus Gate A', shift: 'Day Shift (08:00 AM - 04:00 PM)', active_status: 'active', total_scans_performed: 48, last_scan_time: '2026-08-24 09:45:22' },
          { id: 'sec_prof_u_sec_02', user_id: 'u_sec_02', name: 'Officer Rajesh Rawat', email: 'guard@gsfcuniversity.ac.in', phone: '+91 98250 44556', gate_assigned: 'Dome Event Gate B', shift: 'Evening Shift (04:00 PM - 12:00 AM)', active_status: 'active', total_scans_performed: 32, last_scan_time: '2026-08-24 10:05:14' }
        ]);
      }
    } catch (err) {
      console.error('Error loading security staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!newOfficer.name || !newOfficer.email) {
      alert('Officer name and email are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/security-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOfficer)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create security account.');
      }

      setCreateModalOpen(false);
      setNewOfficer({
        name: '',
        email: '',
        phone: '',
        gate_assigned: 'Main Campus Gate A',
        shift: 'Day Shift (08:00 AM - 04:00 PM)',
        password: 'password123'
      });
      fetchSecurityStaff();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/security-staff/${staffId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_status: nextStatus })
      });
      if (res.ok) {
        setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, active_status: nextStatus } : s));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
        <div>
          <div className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Gate Security Staff Management
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            🛡️ Security Officer Accounts & Terminal Assignments
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Create and manage security personnel login credentials, assigned campus gates, shifts, and scan performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecurityStaff}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            title="Refresh Staff List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Create Security Account</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] tracking-wider font-black">
              <tr>
                <th className="py-3 px-4">Officer Name</th>
                <th className="py-3 px-4">Email / Login ID</th>
                <th className="py-3 px-4">Assigned Gate</th>
                <th className="py-3 px-4">Duty Shift</th>
                <th className="py-3 px-4">Total Scans Performed</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-bold">
                    Loading security staff roster...
                  </td>
                </tr>
              ) : staffList.length > 0 ? (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-all">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div>{staff.name}</div>
                        {staff.phone && <div className="text-[10px] text-slate-400 font-normal">{staff.phone}</div>}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                      {staff.email}
                    </td>

                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {staff.gate_assigned || 'Main Campus Gate A'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {staff.shift || 'Day Shift'}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-black text-slate-900 dark:text-white text-xs">{staff.total_scans_performed || 0} scans</span>
                      {staff.last_scan_time && (
                        <div className="text-[10px] text-slate-400 font-mono">Last: {staff.last_scan_time}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                        staff.active_status === 'active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                      }`}>
                        {staff.active_status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {staff.active_status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(staff.id, staff.active_status)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          staff.active_status === 'active'
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        {staff.active_status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400 font-bold">
                    No security staff accounts found. Create one using the button above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SECURITY ACCOUNT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" /> Create Security Staff Account
                </h3>
                <p className="text-xs text-slate-500 font-medium">Provision gate scanner login for security personnel.</p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Officer Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Officer Vikram Singh"
                    value={newOfficer.name}
                    onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Security Email / Login ID *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="security3@gsfcuniversity.ac.in"
                    value={newOfficer.email}
                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value.toLowerCase() })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 98250 11223"
                    value={newOfficer.phone}
                    onChange={(e) => setNewOfficer({ ...newOfficer, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Assigned Gate</label>
                  <select
                    value={newOfficer.gate_assigned}
                    onChange={(e) => setNewOfficer({ ...newOfficer, gate_assigned: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Main Campus Gate A">Main Campus Gate A</option>
                    <option value="Dome Event Gate B">Dome Event Gate B</option>
                    <option value="Auditorium Gate 1">Auditorium Gate 1</option>
                    <option value="Tech Hub Gate C">Tech Hub Gate C</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Duty Shift</label>
                  <select
                    value={newOfficer.shift}
                    onChange={(e) => setNewOfficer({ ...newOfficer, shift: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Day Shift (08:00 AM - 04:00 PM)">Day (08 AM - 04 PM)</option>
                    <option value="Evening Shift (04:00 PM - 12:00 AM)">Evening (04 PM - 12 AM)</option>
                    <option value="Night Shift (12:00 AM - 08:00 AM)">Night (12 AM - 08 AM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 dark:text-slate-300 mb-1">Initial Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="password123"
                    value={newOfficer.password}
                    onChange={(e) => setNewOfficer({ ...newOfficer, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-black shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
