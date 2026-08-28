import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Building2, MapPin, Users, 
  Plus, Edit3, Trash2, CheckCircle2, AlertCircle, ChevronLeft, 
  ChevronRight, Lock, ShieldCheck, Sparkles, X, Save, Eye, Layers
} from 'lucide-react';
import { placementCalendarStorage, DEFAULT_PLACEMENT_EVENTS } from '../../utils/placementCalendarStorage';
import { useToast } from '../../context/ToastContext';

export default function CompanyPlacementCalendar({ currentUser, onSelectEvent }) {
  const { showToast } = useToast();

  const [events, setEvents] = useState(() => placementCalendarStorage.getEvents());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 8, 1)); // September 2026
  const [activeView, setActiveView] = useState('calendar'); // 'calendar' | 'timeline'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  // Form State for Faculty/Admin
  const [formData, setFormData] = useState({
    company_name: '',
    role: '',
    ctc: '₹12.00 LPA',
    date: '2026-09-15',
    time: '10:00 AM IST',
    stage: 'Online Coding Assessment (Proctored)',
    location: 'GSFC University Auditorium & Remote Lab',
    eligible_batches: '2025, 2026',
    eligible_branches: 'CSE, IT, AI & DS',
    status: 'Scheduled'
  });

  // Check role authorization
  const isAuthorized = placementCalendarStorage.isAuthorizedToEdit(currentUser);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) {
        setEvents(e.detail);
      } else {
        setEvents(placementCalendarStorage.getEvents());
      }
    };
    window.addEventListener('placement_calendar_updated', handleUpdate);
    return () => window.removeEventListener('placement_calendar_updated', handleUpdate);
  }, []);

  const openAddModal = (initialDate = selectedDate) => {
    if (!isAuthorized) {
      showToast({
        type: 'warning',
        title: 'Authorization Required',
        message: 'Only TPC Faculty and Admin coordinators can add or update placement drive dates.'
      });
      return;
    }
    setEditingEvent(null);
    setFormData({
      company_name: '',
      role: '',
      ctc: '₹14.00 LPA',
      date: initialDate || new Date().toISOString().split('T')[0],
      time: '10:00 AM IST',
      stage: 'Online Coding Assessment (Proctored)',
      location: 'GSFC Computer Lab & Virtual AI Arena',
      eligible_batches: '2025, 2026',
      eligible_branches: 'CSE, IT, Chemical, Mechanical',
      status: 'Scheduled'
    });
    setModalOpen(true);
  };

  const openEditModal = (eventItem) => {
    if (!isAuthorized) {
      showToast({
        type: 'warning',
        title: 'Authorization Required',
        message: 'Only TPC Faculty and Admin coordinators can edit placement drive dates.'
      });
      return;
    }
    setEditingEvent(eventItem);
    setFormData({
      company_name: eventItem.company_name,
      role: eventItem.role,
      ctc: eventItem.ctc,
      date: eventItem.date,
      time: eventItem.time,
      stage: eventItem.stage,
      location: eventItem.location,
      eligible_batches: Array.isArray(eventItem.eligible_batches) ? eventItem.eligible_batches.join(', ') : (eventItem.eligible_batches || '2025, 2026'),
      eligible_branches: Array.isArray(eventItem.eligible_branches) ? eventItem.eligible_branches.join(', ') : (eventItem.eligible_branches || 'CSE, IT'),
      status: eventItem.status || 'Scheduled'
    });
    setModalOpen(true);
  };

  const handleDelete = (eventId, companyName) => {
    if (!isAuthorized) return;
    if (window.confirm(`Are you sure you want to remove the placement schedule for ${companyName}?`)) {
      const updated = placementCalendarStorage.deleteEvent(eventId);
      setEvents(updated);
      showToast({
        type: 'info',
        title: 'Schedule Removed',
        message: `Removed drive schedule for ${companyName}.`
      });
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formData.company_name.trim()) {
      showToast({ type: 'warning', title: 'Company Name Required', message: 'Please provide the name of the company.' });
      return;
    }

    const payload = {
      id: editingEvent ? editingEvent.id : undefined,
      company_name: formData.company_name,
      role: formData.role || 'Placement Candidate',
      ctc: formData.ctc,
      date: formData.date,
      time: formData.time,
      stage: formData.stage,
      location: formData.location,
      eligible_batches: formData.eligible_batches.split(',').map(s => s.trim()).filter(Boolean),
      eligible_branches: formData.eligible_branches.split(',').map(s => s.trim()).filter(Boolean),
      status: formData.status
    };

    const saved = placementCalendarStorage.upsertEvent(payload, currentUser);
    setEvents(placementCalendarStorage.getEvents());
    setModalOpen(false);

    showToast({
      type: 'success',
      title: editingEvent ? '📅 Drive Date Updated' : '✨ New Company Drive Scheduled',
      message: `${saved.company_name} date showcased on ${saved.date}!`,
      triggerCrackles: true
    });
  };

  // Calendar Grid Calculation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // Events on selected date
  const eventsOnSelectedDate = events.filter(e => e.date === selectedDate);

  // Helper: map events by date
  const eventsByDate = {};
  events.forEach(evt => {
    if (!eventsByDate[evt.date]) eventsByDate[evt.date] = [];
    eventsByDate[evt.date].push(evt);
  });

  return (
    <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-900 text-white rounded-xl shadow-xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs text-slate-900">Upcoming Placement Calendar</h4>
            <p className="text-[10px] font-bold text-slate-500">Corporate Drive Dates & Schedules</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isAuthorized ? (
            <button
              onClick={() => openAddModal()}
              className="px-2.5 py-1 bg-gradient-to-r from-blue-900 to-indigo-800 hover:from-blue-800 hover:to-indigo-700 text-white rounded-lg text-[10px] font-black shadow-xs flex items-center gap-1 cursor-pointer transition-all hover:scale-102"
              title="Add / Schedule Company Drive Date (Faculty & Admin Only)"
            >
              <Plus className="w-3 h-3" />
              <span>Add Date</span>
            </button>
          ) : (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black rounded-md border border-slate-200 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Read-Only
            </span>
          )}
        </div>
      </div>

      {/* Sub-Tabs: Mini Calendar vs Upcoming Timeline */}
      <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl text-[11px] font-black">
        <button
          onClick={() => setActiveView('calendar')}
          className={`flex-1 py-1 px-2 rounded-lg text-center transition-all ${
            activeView === 'calendar' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 Month Grid
        </button>
        <button
          onClick={() => setActiveView('timeline')}
          className={`flex-1 py-1 px-2 rounded-lg text-center transition-all ${
            activeView === 'timeline' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📋 Upcoming List ({events.length})
        </button>
      </div>

      {/* VIEW 1: MONTHLY CALENDAR GRID */}
      {activeView === 'calendar' && (
        <div className="space-y-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          {/* Month Switcher */}
          <div className="flex items-center justify-between text-xs font-black text-slate-900 px-1">
            <span>{monthNames[month]} {year}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-black text-slate-400">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty_${i}`} className="h-7"></div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const hasEvents = dayEvents.length > 0;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={`day_${dayNum}`}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-7 rounded-lg font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white font-black shadow-xs'
                      : hasEvents
                      ? 'bg-blue-50 text-blue-900 hover:bg-blue-100 font-black border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-[11px] leading-none">{dayNum}</span>
                  {hasEvents && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-amber-400' : 'bg-blue-600'}`}></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Date Details Box */}
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black">
              <span className="text-slate-600">
                Events on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {isAuthorized && (
                <button
                  onClick={() => openAddModal(selectedDate)}
                  className="text-[10px] text-blue-900 font-bold hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-2.5 h-2.5" /> Add Drive Here
                </button>
              )}
            </div>

            {eventsOnSelectedDate.length > 0 ? (
              <div className="space-y-2">
                {eventsOnSelectedDate.map((evt) => (
                  <div key={evt.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-left">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="font-black text-xs text-slate-900">{evt.company_name}</div>
                        <div className="text-[10px] text-blue-900 font-bold">{evt.role}</div>
                      </div>
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 font-black text-[9px] rounded border border-emerald-300">
                        {evt.ctc}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-600 font-medium space-y-0.5">
                      <div className="flex items-center gap-1 font-bold text-slate-800">
                        <Sparkles className="w-3 h-3 text-amber-500 shrink-0" /> {evt.stage}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" /> {evt.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {evt.location}
                      </div>
                    </div>

                    {isAuthorized && (
                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-200/80">
                        <button
                          onClick={() => openEditModal(evt)}
                          className="px-2 py-0.5 bg-white hover:bg-slate-100 text-blue-900 font-bold text-[10px] rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-2.5 h-2.5" /> Edit Date
                        </button>
                        <button
                          onClick={() => handleDelete(evt.id, evt.company_name)}
                          className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                          title="Remove Schedule"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-slate-400 text-[11px] font-medium">
                No company drives scheduled on this date.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: TIMELINE LIST */}
      {activeView === 'timeline' && (
        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-blue-500/60 transition-all space-y-2 shadow-xs"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex flex-col items-center justify-center font-black leading-tight shrink-0 shadow-xs">
                    <span className="text-[8px] uppercase">{new Date(evt.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-xs">{new Date(evt.date + 'T00:00:00').getDate()}</span>
                  </div>
                  <div>
                    <h5 className="font-black text-xs text-slate-900">{evt.company_name}</h5>
                    <div className="text-[10px] text-slate-600 font-bold">{evt.role}</div>
                  </div>
                </div>

                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 font-black text-[9px] rounded border border-emerald-300">
                  {evt.ctc}
                </span>
              </div>

              <div className="p-2 bg-slate-50 rounded-xl text-[10px] text-slate-700 font-medium space-y-1 border border-slate-200">
                <div className="font-bold text-blue-900 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> {evt.stage}
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>⏰ {evt.time}</span>
                  <span className="px-1.5 py-0.2 bg-blue-50 text-blue-900 rounded font-black">{evt.status}</span>
                </div>
              </div>

              {isAuthorized && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                  <span className="text-slate-400 text-[9px]">By {evt.updated_by}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(evt)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(evt.id, evt.company_name)}
                      className="p-1 hover:bg-rose-50 text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* EDIT / SCHEDULE DRIVE MODAL (FACULTY & ADMIN ONLY) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-900 text-white rounded-xl">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    {editingEvent ? 'Edit Placement Drive Date' : 'Schedule Company Drive Date'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500">Authorized TPC Faculty & Admin Control</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3 text-xs">
              <div>
                <label className="block font-black text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Cloud India, Reliance Industries"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-slate-700 mb-1">Job Role / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">Offered CTC</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹18.00 LPA"
                    value={formData.ctc}
                    onChange={(e) => setFormData({ ...formData, ctc: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">Time & Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM IST"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">Drive Stage / Event Type</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                >
                  <option value="Online Coding Assessment (Proctored)">Online Coding Assessment (Proctored)</option>
                  <option value="Pre-Placement Talk (PPT) & Orientation">Pre-Placement Talk (PPT) & Orientation</option>
                  <option value="Technical Interview Round 1 & DSA">Technical Interview Round 1 & DSA</option>
                  <option value="System Design & Low-Level Architecture">System Design & Low-Level Architecture</option>
                  <option value="HR & Leadership Bar Raiser Round">HR & Leadership Bar Raiser Round</option>
                  <option value="Final Placement Offer Release">Final Placement Offer Release</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 mb-1">Venue / Mode</label>
                <input
                  type="text"
                  placeholder="e.g. GSFC Auditorium / Virtual Panel"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black text-slate-700 mb-1">Eligible Batches</label>
                  <input
                    type="text"
                    placeholder="2025, 2026"
                    value={formData.eligible_batches}
                    onChange={(e) => setFormData({ ...formData, eligible_batches: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  />
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">Placement Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-900"
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Shortlist Released">Shortlist Released</option>
                    <option value="Placed / Completed">Placed / Completed</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-[11px] text-blue-950 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                <span>Updates will immediately reflect across all student dashboards and the Live TPC Feed.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-900 to-indigo-800 hover:from-blue-800 hover:to-indigo-700 text-white rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingEvent ? 'Save Changes' : 'Schedule Drive'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
