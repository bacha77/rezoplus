import { createClient } from "@libsql/client";
import crypto from "crypto";

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !dbToken) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set in .env.local");
}

export const client = createClient({
  url: dbUrl,
  authToken: dbToken,
});

// Alias for backwards compatibility where possible, but Note: methods are different.
export const db = client;

export const initDb = async () => {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS carriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dot_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      insurance_status TEXT DEFAULT 'ACTIVE',
      authority_status TEXT DEFAULT 'AUTHORIZED',
      safety_score INTEGER DEFAULT 0,
      insurance_amount INTEGER DEFAULT 0,
      power_units INTEGER DEFAULT 0,
      oos_rate REAL DEFAULT 0.0,
      address TEXT,
      phone TEXT,
      safety_rating TEXT,
      last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const cols = [
    { name: 'insurance_amount', type: 'INTEGER DEFAULT 0' },
    { name: 'power_units', type: 'INTEGER DEFAULT 0' },
    { name: 'oos_rate', type: 'REAL DEFAULT 0.0' },
    { name: 'address', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'safety_rating', type: 'TEXT' }
  ];

  for (const col of cols) {
    try {
      await client.execute(`ALTER TABLE carriers ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      // Ignore if column already exists
    }
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS carrier_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrier_id INTEGER NOT NULL,
      insurance_status TEXT NOT NULL,
      authority_status TEXT NOT NULL,
      safety_score INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (carrier_id) REFERENCES carriers(id)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_key TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      user_id TEXT PRIMARY KEY,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_price_id TEXT,
      status TEXT,
      current_period_end DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      alert_email TEXT,
      email_alerts_enabled BOOLEAN DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Auto-init for now
initDb().catch(console.error);

export const getAllCarriers = async (): Promise<any[]> => {
  const result = await client.execute('SELECT * FROM carriers');
  return result.rows;
};

export const getCarrierByDot = async (dotNumber: string): Promise<any> => {
  const result = await client.execute({
    sql: 'SELECT * FROM carriers WHERE dot_number = ?',
    args: [dotNumber]
  });
  return result.rows[0];
};

export const addCarrier = async (data: {
  dotNumber: string;
  name: string;
  insurance_amount?: number;
  power_units?: number;
  oos_rate?: number;
  address?: string;
  phone?: string;
  safety_rating?: string;
}): Promise<void> => {
  await client.execute({
    sql: `INSERT INTO carriers (
            dot_number, name, insurance_amount, power_units, oos_rate, address, phone, safety_rating
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.dotNumber, 
      data.name, 
      data.insurance_amount || 0, 
      data.power_units || 0, 
      data.oos_rate || 0, 
      data.address || '', 
      data.phone || '', 
      data.safety_rating || ''
    ]
  });
};

export const insertCarrierHistory = async (
  carrierId: number, 
  insuranceStatus: string, 
  authorityStatus: string, 
  safetyScore: number
): Promise<void> => {
  await client.execute({
    sql: 'INSERT INTO carrier_history (carrier_id, insurance_status, authority_status, safety_score) VALUES (?, ?, ?, ?)',
    args: [carrierId, insuranceStatus, authorityStatus, safetyScore]
  });
};

export const getCarrierHistory = async (carrierId: number): Promise<any[]> => {
  const result = await client.execute({
    sql: 'SELECT * FROM carrier_history WHERE carrier_id = ? ORDER BY timestamp ASC',
    args: [carrierId]
  });
  return result.rows;
};

export const generateApiKey = async (customerName: string): Promise<string> => {
  const newKey = 'rzp_' + crypto.randomBytes(24).toString('hex');
  await client.execute({
    sql: 'INSERT INTO api_keys (api_key, customer_name) VALUES (?, ?)',
    args: [newKey, customerName]
  });
  return newKey;
};

export const getApiKeys = async (): Promise<any[]> => {
  const result = await client.execute('SELECT id, customer_name, api_key, is_active, created_at FROM api_keys');
  return result.rows;
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  const result = await client.execute({
    sql: 'SELECT id FROM api_keys WHERE api_key = ? AND is_active = 1',
    args: [apiKey]
  });
  return result.rows.length > 0;
};

export const clearAllCarriers = async (): Promise<void> => {
  await client.execute('DELETE FROM carrier_history');
  await client.execute('DELETE FROM carriers');
};

export const getUserSettings = async (userId: string): Promise<{ alert_email: string | null, email_alerts_enabled: boolean }> => {
  const result = await client.execute({
    sql: 'SELECT alert_email, email_alerts_enabled FROM user_settings WHERE user_id = ?',
    args: [userId]
  });
  if (result.rows.length === 0) {
    return { alert_email: null, email_alerts_enabled: true };
  }
  return {
    alert_email: result.rows[0].alert_email as string | null,
    email_alerts_enabled: Boolean(result.rows[0].email_alerts_enabled)
  };
};

export const updateUserSettings = async (userId: string, email: string, enabled: boolean): Promise<void> => {
  await client.execute({
    sql: `
      INSERT INTO user_settings (user_id, alert_email, email_alerts_enabled, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET 
        alert_email = excluded.alert_email,
        email_alerts_enabled = excluded.email_alerts_enabled,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [userId, email, enabled ? 1 : 0]
  });
};

export const getAllAlertSettings = async (): Promise<{ user_id: string, alert_email: string }[]> => {
  // Returns all users who have email alerts enabled and have an email set
  const result = await client.execute(`
    SELECT user_id, alert_email FROM user_settings 
    WHERE email_alerts_enabled = 1 AND alert_email IS NOT NULL AND alert_email != ''
  `);
  return result.rows as unknown as { user_id: string, alert_email: string }[];
};
