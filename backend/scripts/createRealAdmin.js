#!/usr/bin/env node
/**
 * ==============================================================================
 * GSFC UNIVERSITY PLACEMENT MANAGEMENT PORTAL
 * PRODUCTION ADMINISTRATOR PROVISIONING SCRIPT
 * ==============================================================================
 * Usage:
 *   1. Interactive CLI:
 *      node backend/scripts/createRealAdmin.js
 *
 *   2. Non-interactive via environment variables:
 *      ADMIN_EMAIL="admin@gsfcuniversity.ac.in" ADMIN_PASSWORD="YourSecurePassword123!" ADMIN_ROLE="admin" node backend/scripts/createRealAdmin.js
 *
 * Features:
 *   - Securely provisions or updates the primary TPC Administrator / Superadmin.
 *   - Strong password validation (minimum 10 chars, uppercase, lowercase, digit).
 *   - High-entropy async bcrypt password hashing (cost factor 10).
 *   - Leaves zero plaintext passwords in files or logs.
 */

import readline from 'readline';
import bcrypt from 'bcryptjs';
import db, { initDatabase } from '../db/index.js';
import { validatePasswordPolicy } from '../middleware/security.js';

console.log('\n======================================================');
console.log('🏛️  GSFC UNIVERSITY PLACEMENT PORTAL');
console.log('🛡️  PRODUCTION ADMINISTRATOR PROVISIONING UTILITY');
console.log('======================================================\n');

initDatabase();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runProvisioning() {
  try {
    let email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    let password = process.env.ADMIN_PASSWORD || '';
    let role = (process.env.ADMIN_ROLE || 'admin').trim().toLowerCase();

    // 1. Prompt for Email if not in env
    if (!email) {
      email = (await askQuestion('Enter Administrator Email [admin@gsfcuniversity.ac.in]: ')).trim().toLowerCase();
      if (!email) {
        email = 'admin@gsfcuniversity.ac.in';
      }
    }

    if (!email.includes('@') || !email.includes('.')) {
      throw new Error(`Invalid email format: "${email}".`);
    }

    // 2. Prompt for Role if not specified
    if (!['admin', 'superadmin'].includes(role)) {
      const roleChoice = (await askQuestion('Select Role (1: admin, 2: superadmin) [1]: ')).trim();
      role = roleChoice === '2' ? 'superadmin' : 'admin';
    }

    // 3. Prompt for Password if not in env
    if (!password) {
      password = await askQuestion('Enter Secure Password (min 10 characters): ');
      if (!password) {
        throw new Error('Password cannot be empty.');
      }
      const confirmPass = await askQuestion('Confirm Password: ');
      if (password !== confirmPass) {
        throw new Error('Password confirmation does not match.');
      }
    }

    // 4. Validate Password Policy
    const passCheck = validatePasswordPolicy(password, email);
    if (!passCheck.valid) {
      throw new Error(`Password policy violation: ${passCheck.message}`);
    }

    console.log('\n🔐 Generating cryptographic bcrypt hash (Cost Factor 10)...');
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Insert or Update User in Database
    const existingUser = db.prepare('SELECT id, email, role FROM users WHERE lower(email) = ?').get(email);
    const userId = existingUser?.id || ('u_admin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

    if (existingUser) {
      db.prepare(`
        UPDATE users 
        SET password_hash = ?, role = ?, status = 'active', auth_provider = 'local', email_verified = 1
        WHERE id = ?
      `).run(passwordHash, role, existingUser.id);
      console.log(`✅ Updated existing administrator account (${email}) with new secure credentials.`);
    } else {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, role, auth_provider, email_verified, status)
        VALUES (?, ?, ?, ?, 'local', 1, 'active')
      `).run(userId, email, passwordHash, role);
      console.log(`✅ Successfully created primary administrator account (${email}) [Role: ${role.toUpperCase()}].`);
    }

    console.log('\n======================================================');
    console.log('🎉 ADMINISTRATOR PROVISIONING COMPLETE');
    console.log(`👤 User ID : ${userId}`);
    console.log(`📧 Email   : ${email}`);
    console.log(`🛡️ Role    : ${role.toUpperCase()}`);
    console.log(`🔒 Security: Stored as high-entropy bcrypt hash`);
    console.log('======================================================\n');

  } catch (err) {
    console.error(`\n❌ [PROVISIONING FAILED]: ${err.message}\n`);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

runProvisioning();
