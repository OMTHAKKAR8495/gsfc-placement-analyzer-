import express from 'express';
import crypto from 'crypto';
import db from '../db/index.js';

const router = express.Router();
const uuidv4 = () => crypto.randomUUID();

// 1. Get Revenue & Subscription Overview Metrics
router.get('/overview', (req, res) => {
  try {
    const totalRevenue = db.prepare(`
      SELECT SUM(amount_inr) as total FROM payment_transactions WHERE status = 'paid'
    `).get()?.total || 0;

    const totalTransactions = db.prepare(`
      SELECT count(*) as count FROM payment_transactions WHERE status = 'paid'
    `).get()?.count || 0;

    const activeSubsCount = db.prepare(`
      SELECT count(*) as count FROM company_subscriptions WHERE status = 'active' AND expires_at > datetime('now')
    `).get()?.count || 0;

    const expiringSoonCount = db.prepare(`
      SELECT count(*) as count FROM company_subscriptions 
      WHERE status = 'active' 
        AND expires_at > datetime('now') 
        AND expires_at <= datetime('now', '+15 days')
    `).get()?.count || 0;

    const tierBreakdown = db.prepare(`
      SELECT plan_name, count(*) as count, SUM(price_inr) as revenue
      FROM (
        SELECT cs.plan_name, sp.price_inr 
        FROM company_subscriptions cs
        LEFT JOIN subscription_plans sp ON cs.plan_id = sp.id
        WHERE cs.status = 'active' AND cs.expires_at > datetime('now')
      )
      GROUP BY plan_name
    `).all();

    const recentTransactions = db.prepare(`
      SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10
    `).all();

    res.json({
      success: true,
      total_revenue_inr: totalRevenue,
      total_transactions: totalTransactions,
      active_subscriptions: activeSubsCount,
      expiring_soon: expiringSoonCount,
      tier_breakdown: tierBreakdown,
      recent_transactions: recentTransactions
    });
  } catch (err) {
    console.error('Error fetching admin subscription overview:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Subscription Plans for Admin Management
router.get('/plans', (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM subscription_plans ORDER BY display_order ASC, price_inr ASC
    `).all();

    const formatted = plans.map(p => ({
      ...p,
      features: typeof p.features_json === 'string' ? JSON.parse(p.features_json || '{}') : p.features_json
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Existing Subscription Plan (Price, Duration, Limits, Features)
router.put('/plans/:planId', (req, res) => {
  try {
    const { planId } = req.params;
    const { name, badge_title, price_inr, duration_days, max_postings, description, features, is_active } = req.body;

    const existing = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId);
    if (!existing) {
      return res.status(404).json({ error: 'Subscription plan not found.' });
    }

    const featuresJson = typeof features === 'object' ? JSON.stringify(features) : (features || existing.features_json);
    const activeVal = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE subscription_plans
      SET name = COALESCE(?, name),
          badge_title = COALESCE(?, badge_title),
          price_inr = COALESCE(?, price_inr),
          duration_days = COALESCE(?, duration_days),
          max_postings = COALESCE(?, max_postings),
          description = COALESCE(?, description),
          features_json = ?,
          is_active = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, badge_title, price_inr !== undefined ? parseInt(price_inr) : existing.price_inr,
      duration_days !== undefined ? parseInt(duration_days) : existing.duration_days,
      max_postings !== undefined ? parseInt(max_postings) : existing.max_postings,
      description, featuresJson, activeVal, planId
    );

    const updated = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId);
    res.json({
      success: true,
      message: `✅ Plan "${updated.name}" updated successfully.`,
      plan: {
        ...updated,
        features: JSON.parse(updated.features_json || '{}')
      }
    });
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Create New Custom Subscription Plan
router.post('/plans', (req, res) => {
  try {
    const { id, name, badge_title, price_inr, duration_days, max_postings, description, features } = req.body;
    
    if (!name || price_inr === undefined || !duration_days) {
      return res.status(400).json({ error: 'name, price_inr, and duration_days are required.' });
    }

    const planId = id || ('plan_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    const featuresJson = typeof features === 'object' ? JSON.stringify(features) : JSON.stringify(features || {});
    
    db.prepare(`
      INSERT INTO subscription_plans 
      (id, name, badge_title, price_inr, duration_days, max_postings, description, features_json, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 99)
    `).run(
      planId, name, badge_title || name, parseInt(price_inr), parseInt(duration_days),
      max_postings !== undefined ? parseInt(max_postings) : 5, description || '', featuresJson
    );

    const created = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId);
    res.status(201).json({
      success: true,
      message: `✅ New plan "${created.name}" created.`,
      plan: {
        ...created,
        features: JSON.parse(created.features_json || '{}')
      }
    });
  } catch (err) {
    console.error('Error creating plan:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Get All Payment Transactions & Invoices (with Search / Filters)
router.get('/transactions', (req, res) => {
  try {
    const { status, search, planId, limit = 50, offset = 0 } = req.query;
    
    let query = `SELECT * FROM payment_transactions WHERE 1=1`;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }
    if (planId) {
      query += ` AND plan_id = ?`;
      params.push(planId);
    }
    if (search) {
      query += ` AND (company_name LIKE ? OR receipt_number LIKE ? OR gateway_payment_id LIKE ? OR billing_email LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (err) {
    console.error('Error fetching admin transactions:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Manual Subscription Grant for MoU Partners / Special Companies
router.post('/manual-grant', (req, res) => {
  try {
    const { companyId, planId, durationDays, notes } = req.body;

    let company = db.prepare('SELECT * FROM company_profiles WHERE id = ? OR user_id = ?').get(companyId, companyId);
    if (!company) {
      company = db.prepare('SELECT * FROM company_profiles WHERE id LIKE ? OR company_name LIKE ? LIMIT 1').get(`%${companyId}%`, `%${companyId}%`);
    }
    if (!company) {
      company = db.prepare('SELECT * FROM company_profiles LIMIT 1').get();
    }
    if (!company) {
      return res.status(404).json({ error: 'Company profile not found.' });
    }


    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId || 'plan_gold');
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found.' });
    }

    const days = durationDays ? parseInt(durationDays) : plan.duration_days;
    const now = new Date();
    const expiry = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    const subId = 'sub_manual_' + uuidv4().slice(0, 8);
    const receiptNum = 'GSFC-MOU-' + now.getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

    // Create grant transaction
    db.prepare(`
      INSERT INTO payment_transactions 
      (id, company_id, company_name, plan_id, plan_name, amount_inr, currency, gateway, gateway_order_id, gateway_payment_id, status, receipt_number, billing_email, invoice_data_json, paid_at)
      VALUES (?, ?, ?, ?, ?, 0, 'INR', 'TPC Admin Grant', ?, ?, 'paid', ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      'tx_' + uuidv4().slice(0, 10), company.id, company.company_name, plan.id, plan.name,
      'order_mou_' + Date.now(), 'pay_mou_grant', receiptNum, company.contact_email || 'hr@company.com',
      JSON.stringify({ notes: notes || 'Complimentary University MoU Partner Subscription', grantedBy: 'TPC Admin' })
    );

    // Insert active subscription
    db.prepare(`
      INSERT INTO company_subscriptions 
      (id, company_id, plan_id, plan_name, started_at, expires_at, postings_used, max_postings, status, last_payment_id)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'active', 'mou_grant')
    `).run(subId, company.id, plan.id, plan.name, now.toISOString(), expiry.toISOString(), plan.max_postings);

    res.json({
      success: true,
      message: `✅ Plan "${plan.name}" successfully granted to ${company.company_name} for ${days} days.`,
      subscription_id: subId,
      expires_at: expiry.toISOString()
    });
  } catch (err) {
    console.error('Error granting manual subscription:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
