/**
 * 📅 CampusHire AI — Placement & Corporate Drives Calendar Storage
 * Manages upcoming company drive dates, rounds, and eligibility.
 * Authorized for editing by Faculty and Admin only; Read-only for Students & Guests.
 */

import { dbVault } from '../services/dbVault';

export const DEFAULT_PLACEMENT_EVENTS = [];

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
      if (Array.isArray(serverEvents)) {
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
    if (inMemoryCache && Array.isArray(inMemoryCache)) {
      return inMemoryCache;
    }
    try {
      const vaultData = dbVault.getCollection(STORAGE_KEY);
      if (Array.isArray(vaultData)) {
        const cleanVault = vaultData.filter(e => !e.id?.includes('evt_google') && !e.id?.includes('evt_microsoft') && !e.id?.includes('evt_tcs'));
        inMemoryCache = cleanVault;
        return cleanVault;
      }
      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const cleanLocal = parsed.filter(e => !e.id?.includes('evt_google') && !e.id?.includes('evt_microsoft') && !e.id?.includes('evt_tcs'));
          inMemoryCache = cleanLocal;
          return cleanLocal;
        }
      }
    } catch (e) {
      console.warn('Error reading placement calendar events:', e);
    }
    inMemoryCache = [];
    return [];
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

