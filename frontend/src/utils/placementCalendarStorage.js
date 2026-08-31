/**
 * 📅 CampusHire AI — Placement & Corporate Drives Calendar Storage
 * Manages upcoming company drive dates, rounds, and eligibility.
 * Authorized for editing by Faculty and Admin only; Read-only for Students & Guests.
 */

import { dbVault } from '../services/dbVault';

export const DEFAULT_PLACEMENT_EVENTS = [
  {
    id: 'evt_google_01',
    company_name: 'Google Cloud India',
    role: 'Software Engineer — AI & Cloud',
    ctc: '₹28.00 LPA',
    date: '2026-09-04',
    time: '10:00 AM IST',
    stage: 'Online Coding Assessment (Proctored)',
    location: 'GSFC Computer Lab 4 & Remote AI Sandbox',
    eligible_batches: ['2025', '2026'],
    eligible_branches: ['CSE', 'IT', 'AI & DS'],
    status: 'Scheduled',
    updated_by: 'TPC Admin Coordinator',
    updated_at: new Date().toISOString()
  },
  {
    id: 'evt_microsoft_01',
    company_name: 'Microsoft Azure Systems',
    role: 'Graduate Software Engineer',
    ctc: '₹24.00 LPA',
    date: '2026-09-08',
    time: '02:00 PM IST',
    stage: 'Technical Interview Round 1 & DSA',
    location: 'Virtual Video Panel Room 3',
    eligible_batches: ['2025', '2026'],
    eligible_branches: ['CSE', 'IT', 'ECE'],
    status: 'Scheduled',
    updated_by: 'Dr. Faculty Head (TPC)',
    updated_at: new Date().toISOString()
  },
  {
    id: 'evt_tcs_01',
    company_name: 'Tata Consultancy Services',
    role: 'Digital Systems & Data Analyst',
    ctc: '₹12.00 LPA',
    date: '2026-09-12',
    time: '09:30 AM IST',
    stage: 'Pre-Placement Talk (PPT) & Orientation',
    location: 'GSFC University Main Auditorium',
    eligible_batches: ['2025', '2026', '2027'],
    eligible_branches: ['All Departments'],
    status: 'Scheduled',
    updated_by: 'TPC Admin Coordinator',
    updated_at: new Date().toISOString()
  },
  {
    id: 'evt_reliance_01',
    company_name: 'Reliance Industries Limited',
    role: 'Software Development Engineer - Cloud',
    ctc: '₹10.20 LPA',
    date: '2026-09-18',
    time: '11:00 AM IST',
    stage: 'Core Technical & System Architecture Round',
    location: 'SOT Seminar Hall A',
    eligible_batches: ['2025', '2026'],
    eligible_branches: ['CSE', 'Chemical', 'Mechanical', 'IT'],
    status: 'Scheduled',
    updated_by: 'Faculty Placement Officer',
    updated_at: new Date().toISOString()
  },
  {
    id: 'evt_amazon_01',
    company_name: 'Amazon Web Services',
    role: 'SDE-1 Cloud Microservices',
    ctc: '₹32.00 LPA',
    date: '2026-09-24',
    time: '03:30 PM IST',
    stage: 'Bar Raiser & Behavioral Leadership Panel',
    location: 'Virtual Interview Studio',
    eligible_batches: ['2025', '2026'],
    eligible_branches: ['CSE', 'IT'],
    status: 'Scheduled',
    updated_by: 'TPC Admin Coordinator',
    updated_at: new Date().toISOString()
  }
];

const STORAGE_KEY = 'gsfc_placement_calendar_events';

let inMemoryCache = null;
let isFetching = false;

// Background initial sync with Backend SQLite API
async function syncFromBackend() {
  if (isFetching || typeof window === 'undefined') return;
  isFetching = true;
  try {
    const res = await fetch('/api/events/calendar');
    if (res.ok) {
      const serverEvents = await res.json();
      if (Array.isArray(serverEvents) && serverEvents.length > 0) {
        inMemoryCache = serverEvents;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverEvents));
          dbVault.saveCollection(STORAGE_KEY, serverEvents);
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('placement_calendar_updated', { detail: serverEvents }));
      }
    }
  } catch (err) {
    console.warn('Backend placement calendar sync notice:', err.message);
  } finally {
    isFetching = false;
  }
}

// Trigger initial sync
if (typeof window !== 'undefined') {
  syncFromBackend();
}

export const placementCalendarStorage = {
  fetchServerEvents: async () => {
    await syncFromBackend();
    return inMemoryCache || placementCalendarStorage.getEvents();
  },

  getEvents: () => {
    if (inMemoryCache && Array.isArray(inMemoryCache) && inMemoryCache.length > 0) {
      return inMemoryCache;
    }
    try {
      const vaultData = dbVault.getCollection(STORAGE_KEY);
      if (Array.isArray(vaultData) && vaultData.length > 0) {
        inMemoryCache = vaultData;
        return vaultData;
      }
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading placement calendar events:', e);
    }
    // Initialize defaults & trigger background server sync
    inMemoryCache = DEFAULT_PLACEMENT_EVENTS;
    placementCalendarStorage.saveEvents(DEFAULT_PLACEMENT_EVENTS);
    syncFromBackend();
    return DEFAULT_PLACEMENT_EVENTS;
  },

  saveEvents: (events) => {
    try {
      inMemoryCache = events;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      dbVault.saveCollection(STORAGE_KEY, events);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('placement_calendar_updated', { detail: events }));
      }
    } catch (e) {
      console.error('Error saving placement calendar events:', e);
    }
  },

  upsertEvent: (eventData, authorizedUser) => {
    const events = placementCalendarStorage.getEvents();
    const existingIdx = events.findIndex(e => e.id === eventData.id);

    const updatedEvent = {
      ...eventData,
      id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      updated_by: authorizedUser?.name || authorizedUser?.role || 'Authorized Coordinator',
      updated_at: new Date().toISOString()
    };

    let nextEvents = [];
    if (existingIdx >= 0) {
      nextEvents = [...events];
      nextEvents[existingIdx] = updatedEvent;
    } else {
      nextEvents = [updatedEvent, ...events];
    }

    placementCalendarStorage.saveEvents(nextEvents);

    // Persist asynchronously to SQLite Backend API
    try {
      fetch('/api/events/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEvent)
      }).catch(err => console.warn('Async calendar API save notice:', err));
    } catch (e) {}

    return updatedEvent;
  },

  deleteEvent: (eventId) => {
    const events = placementCalendarStorage.getEvents();
    const nextEvents = events.filter(e => e.id !== eventId);
    placementCalendarStorage.saveEvents(nextEvents);

    // Delete asynchronously from SQLite Backend API
    try {
      fetch(`/api/events/calendar/${eventId}`, {
        method: 'DELETE'
      }).catch(err => console.warn('Async calendar API delete notice:', err));
    } catch (e) {}

    return nextEvents;
  },

  isAuthorizedToEdit: (user) => {
    if (!user) return false;
    const role = (user.role || user.user_role || user.role_name || '').toLowerCase();
    const isFaculty = role === 'faculty' || role === 'professor' || role === 'teacher' || role === 'tpc_faculty';
    const isAdmin = role === 'admin' || role === 'superadmin' || role === 'super_admin' || role === 'placement_officer' || role === 'tpc_admin';
    return isFaculty || isAdmin;
  }
};

