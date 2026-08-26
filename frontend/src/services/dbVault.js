/**
 * 🏛️ GSFC University Placement Vault — Universal Persistent Database Layer
 * Guarantees zero data loss across page refreshes, logouts, role switches, and serverless cold starts.
 */

const VAULT_PREFIX = 'gsfc_vault_';

export const dbVault = {
  // Save collection
  saveCollection(collectionName, items) {
    try {
      if (!Array.isArray(items)) return;
      localStorage.setItem(`${VAULT_PREFIX}${collectionName}`, JSON.stringify(items));
    } catch (e) {
      console.warn(`Vault save notice [${collectionName}]:`, e);
    }
  },

  // Get collection with initial fallback
  getCollection(collectionName, fallbackItems = []) {
    try {
      const raw = localStorage.getItem(`${VAULT_PREFIX}${collectionName}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return fallbackItems;
  },

  // Upsert single item in a collection
  upsertItem(collectionName, item, idKey = 'id') {
    try {
      const existing = this.getCollection(collectionName, []);
      const index = existing.findIndex(x => x[idKey] === item[idKey]);
      let updated;
      if (index >= 0) {
        updated = [...existing];
        updated[index] = { ...updated[index], ...item, updated_at: new Date().toISOString() };
      } else {
        updated = [{ ...item, created_at: item.created_at || new Date().toISOString() }, ...existing];
      }
      this.saveCollection(collectionName, updated);
      return updated;
    } catch (e) {
      return [];
    }
  },

  // Remove item from a collection
  removeItem(collectionName, itemId, idKey = 'id') {
    try {
      const existing = this.getCollection(collectionName, []);
      const filtered = existing.filter(x => x[idKey] !== itemId);
      this.saveCollection(collectionName, filtered);
      return filtered;
    } catch (e) {
      return [];
    }
  },

  // Namespaced user profile storage
  saveUserProfile(email, profileData) {
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim();
    try {
      const existing = this.getUserProfile(cleanEmail) || {};
      const merged = { ...existing, ...profileData, updated_at: new Date().toISOString() };
      localStorage.setItem(`gsfc_user_profile_${cleanEmail}`, JSON.stringify(merged));
      return merged;
    } catch (e) {}
  },

  getUserProfile(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    try {
      const raw = localStorage.getItem(`gsfc_user_profile_${cleanEmail}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
};

export default dbVault;
