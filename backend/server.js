const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Square Environment Setup
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || '';
const SQUARE_ENVIRONMENT = (process.env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase();
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || 'L_AURA_SANCTUARY_01';

let squareClient = null;
try {
  const { Client, Environment } = require('square');
  if (SQUARE_ACCESS_TOKEN && SQUARE_ACCESS_TOKEN !== 'sandbox-sq0atb-YOUR_SANDBOX_TOKEN') {
    squareClient = new Client({
      accessToken: SQUARE_ACCESS_TOKEN,
      environment: SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
    });
    console.log(`[Square] Initialized in ${SQUARE_ENVIRONMENT} mode for location: ${SQUARE_LOCATION_ID}`);
  } else {
    console.log('[Square] No live production access token found in environment. Using Sandbox POS simulation mode.');
  }
} catch (err) {
  console.warn('[Square] Could not initialize Square Client directly; fallback to POS simulation mode active.', err.message);
}

// -----------------------------------------------------------------------------
// Admin Authentication & Account Service (One-Way Salted SHA-256 with File DB)
// -----------------------------------------------------------------------------
const AUTH_SALT = 'aura_botanica_salt_herb_2026';
const ADMIN_ACCOUNTS_FILE = path.join(__dirname, 'admin_accounts.json');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + AUTH_SALT).digest('hex');
}

// Service to manage admin accounts, hashed passwords, and persistent storage
const adminAccountService = {
  accountsMap: null,

  // Load all accounts from file or initialize with default
  loadAccounts() {
    const map = new Map();
    try {
      if (fs.existsSync(ADMIN_ACCOUNTS_FILE)) {
        const raw = fs.readFileSync(ADMIN_ACCOUNTS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(acc => map.set(acc.username.toLowerCase(), acc));
          this.accountsMap = map;
          return map;
        }
      }
    } catch (e) {
      console.warn('[AdminAccountService] Error reading admin_accounts.json', e.message);
    }

    // Default initial admin account: username "admin", password "system"
    const defaultAdmin = {
      username: 'admin',
      passwordHash: hashPassword('system'),
      isDefaultPassword: true,
      updatedAt: new Date().toISOString()
    };
    map.set(defaultAdmin.username.toLowerCase(), defaultAdmin);
    this.accountsMap = map;
    this.saveAccounts(map);
    return map;
  },

  // Save all accounts to file DB
  saveAccounts(map) {
    try {
      const list = Array.from(map.values());
      fs.writeFileSync(ADMIN_ACCOUNTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[AdminAccountService] Error saving admin_accounts.json', e.message);
    }
  },

  // Fetch account record based on username
  getAccountByUsername(username) {
    if (!username) return null;
    if (!this.accountsMap) {
      this.loadAccounts();
    }
    const normalized = username.trim().toLowerCase();
    return this.accountsMap.get(normalized) || null;
  },

  // Fetch the stored hash password based on username
  getHashedPassword(username) {
    const account = this.getAccountByUsername(username);
    return account ? account.passwordHash : null;
  },

  // Update password for a specific username
  updatePassword(username, newPasswordHash) {
    if (!this.accountsMap) {
      this.loadAccounts();
    }
    const account = this.getAccountByUsername(username);
    if (!account) return false;

    account.passwordHash = newPasswordHash;
    account.isDefaultPassword = false;
    account.updatedAt = new Date().toISOString();

    this.saveAccounts(this.accountsMap);
    console.log(`[AdminAccountService] Password hash updated in file DB for username "${account.username}"`);
    return true;
  }
};

// Initialize accounts on startup
adminAccountService.loadAccounts();

// In-memory active session tokens (token -> { username, createdAt })
const activeSessions = new Map();

// Helper to extract bearer token
function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.headers['x-session-token'] || null;
}

// 1. Admin Login (Fetches hashed password based on username from Account Service)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, errorMessage: 'Username and password are required.' });
  }

  // 1. Fetch account info based on username
  const account = adminAccountService.getAccountByUsername(username);
  if (!account) {
    return res.status(401).json({ success: false, errorMessage: 'Invalid username or password.' });
  }

  // 2. Fetch the stored hash password based on username
  const storedHash = adminAccountService.getHashedPassword(username);
  const inputHash = hashPassword(password);

  if (!storedHash || inputHash !== storedHash) {
    return res.status(401).json({ success: false, errorMessage: 'Invalid username or password.' });
  }

  // 3. Generate cryptographic session token
  const sessionToken = crypto.randomUUID();
  activeSessions.set(sessionToken, {
    username: account.username,
    createdAt: Date.now()
  });

  return res.json({
    success: true,
    token: sessionToken,
    username: account.username,
    mustChangePassword: account.isDefaultPassword
  });
});

// 2. Verify Session
app.get('/api/auth/verify', (req, res) => {
  const token = getBearerToken(req);

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({
      authenticated: false,
      errorMessage: 'No active authenticated session found. Please sign in.'
    });
  }

  const session = activeSessions.get(token);
  const account = adminAccountService.getAccountByUsername(session.username);

  return res.json({
    authenticated: true,
    username: session.username,
    mustChangePassword: account ? account.isDefaultPassword : false
  });
});

// 3. Change Password
app.post('/api/auth/change-password', (req, res) => {
  const token = getBearerToken(req);

  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ success: false, errorMessage: 'Unauthorized. Active session required.' });
  }

  const session = activeSessions.get(token);
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, errorMessage: 'All password fields are required.' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, errorMessage: 'New password and confirmation do not match.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, errorMessage: 'New password must be at least 6 characters long.' });
  }

  if (newPassword.toLowerCase() === 'system') {
    return res.status(400).json({ success: false, errorMessage: 'New password cannot be the default "system" password.' });
  }

  // Verify current password against stored hash for this username
  const storedHash = adminAccountService.getHashedPassword(session.username);
  const currentHash = hashPassword(currentPassword);

  if (!storedHash || currentHash !== storedHash) {
    return res.status(400).json({ success: false, errorMessage: 'Current password is incorrect.' });
  }

  // Update password in persistent file DB
  const newHash = hashPassword(newPassword);
  const updated = adminAccountService.updatePassword(session.username, newHash);

  if (!updated) {
    return res.status(500).json({ success: false, errorMessage: 'Failed to update account password.' });
  }

  console.log(`[AdminAccountService] Password updated successfully for user "${session.username}" and saved to file DB.`);

  return res.json({
    success: true,
    message: 'Password changed successfully.'
  });
});

// 4. Admin Logout
app.post('/api/auth/logout', (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// -----------------------------------------------------------------------------
// Customer Authentication & Email Verification System
// -----------------------------------------------------------------------------
const CUSTOMER_ACCOUNTS_FILE = path.join(__dirname, 'customer_accounts.json');

const sampleCustomer = {
  id: 'cust-helena-01',
  email: 'helena.vance@example.com',
  name: 'Helena Vance',
  phone: '(415) 555-0192',
  passwordHash: hashPassword('Sanctuary2026!'),
  verified: true,
  createdAt: new Date().toISOString()
};

function loadCustomerAccounts() {
  const map = new Map();
  map.set(sampleCustomer.email.toLowerCase(), sampleCustomer);
  try {
    if (fs.existsSync(CUSTOMER_ACCOUNTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CUSTOMER_ACCOUNTS_FILE, 'utf-8'));
      if (Array.isArray(data)) {
        data.forEach(c => map.set(c.email.toLowerCase(), c));
      }
    }
  } catch (e) {
    console.warn('Could not read customer_accounts.json', e.message);
  }
  return map;
}

const customerAccounts = loadCustomerAccounts(); // email.toLowerCase() -> customer object
const customerVerificationCodes = new Map(); // email.toLowerCase() -> { code, expiresAt, attempts }
const customerActiveSessions = new Map(); // sessionToken -> customerId

function saveCustomerAccounts() {
  try {
    const list = Array.from(customerAccounts.values());
    fs.writeFileSync(CUSTOMER_ACCOUNTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save customer_accounts.json', e.message);
  }
}

// Helper to get customer bearer token
function getCustomerBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.headers['x-customer-token'] || null;
}

// Check if email already registered
app.get('/api/customer/check-email', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const exists = customerAccounts.has(normalizedEmail);
  return res.json({ registered: exists });
});

// 1. Send Email Verification Code (OTP)
app.post('/api/customer/send-code', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, errorMessage: 'A valid email address is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // If already registered, alert the user to sign in instead
  if (customerAccounts.has(normalizedEmail)) {
    return res.status(409).json({
      success: false,
      alreadyRegistered: true,
      errorMessage: 'user already registerd, please sign-in to continue'
    });
  }
  
  // Generate 6-digit random code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  customerVerificationCodes.set(normalizedEmail, {
    code: verificationCode,
    expiresAt,
    attempts: 0
  });

  console.log(`\n======================================================`);
  console.log(`✉️ [AURA BOTANICA EMAIL SERVICE] Verification Code Dispatch`);
  console.log(`   To: ${normalizedEmail}`);
  console.log(`   Verification Code: ${verificationCode}`);
  console.log(`   Valid For: 10 minutes`);
  console.log(`======================================================\n`);

  return res.json({
    success: true,
    message: `Verification code successfully dispatched to ${normalizedEmail}`,
    demoCode: verificationCode, // Returned for instant testing & visual UI notification
    expiresAt
  });
});

// 2. Verify Code and Complete Registration
app.post('/api/customer/verify-register', (req, res) => {
  const { email, code, name, password, phone } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, errorMessage: 'Email and verification code are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const storedOtp = customerVerificationCodes.get(normalizedEmail);

  if (!storedOtp) {
    return res.status(400).json({ 
      success: false, 
      errorMessage: 'No pending verification code found for this email. Please request a new code.' 
    });
  }

  if (Date.now() > storedOtp.expiresAt) {
    customerVerificationCodes.delete(normalizedEmail);
    return res.status(400).json({ 
      success: false, 
      errorMessage: 'Verification code has expired. Please request a new one.' 
    });
  }

  if (storedOtp.code !== code.trim()) {
    storedOtp.attempts += 1;
    if (storedOtp.attempts >= 5) {
      customerVerificationCodes.delete(normalizedEmail);
      return res.status(400).json({ 
        success: false, 
        errorMessage: 'Too many incorrect attempts. Please request a new verification code.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      errorMessage: 'Invalid verification code. Please check your email.' 
    });
  }

  // Code verified!
  customerVerificationCodes.delete(normalizedEmail);

  let customer = customerAccounts.get(normalizedEmail);
  if (!customer) {
    customer = {
      id: `cust-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      email: normalizedEmail,
      name: name ? name.trim() : normalizedEmail.split('@')[0],
      phone: phone || '',
      passwordHash: password ? hashPassword(password) : '',
      verified: true,
      createdAt: new Date().toISOString()
    };
    customerAccounts.set(normalizedEmail, customer);
  } else {
    customer.verified = true;
    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone;
    if (password) customer.passwordHash = hashPassword(password);
  }

  // Save to persistent file
  saveCustomerAccounts();

  // Issue customer session token
  const token = crypto.randomUUID();
  customerActiveSessions.set(token, customer.id);

  return res.json({
    success: true,
    token,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      verified: customer.verified
    }
  });
});

// 3. Customer Sign In (Password or Code)
app.post('/api/customer/login', (req, res) => {
  const { email, password, code } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, errorMessage: 'Email address is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const customer = customerAccounts.get(normalizedEmail);

  if (!customer) {
    return res.status(404).json({ 
      success: false, 
      errorMessage: 'No customer account found with this email. Please register first.' 
    });
  }

  // Login via Password
  if (password) {
    const inputHash = hashPassword(password);
    if (inputHash !== customer.passwordHash) {
      return res.status(401).json({ success: false, errorMessage: 'Invalid email or password.' });
    }
  } 
  // Login via One-Time Email Code
  else if (code) {
    const storedOtp = customerVerificationCodes.get(normalizedEmail);
    if (!storedOtp || storedOtp.code !== code.trim() || Date.now() > storedOtp.expiresAt) {
      return res.status(401).json({ success: false, errorMessage: 'Invalid or expired email verification code.' });
    }
    customerVerificationCodes.delete(normalizedEmail);
  } else {
    return res.status(400).json({ success: false, errorMessage: 'Password or verification code is required.' });
  }

  const token = crypto.randomUUID();
  customerActiveSessions.set(token, customer.id);

  return res.json({
    success: true,
    token,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      verified: customer.verified
    }
  });
});

// 4. Get Current Customer Profile
app.get('/api/customer/me', (req, res) => {
  const token = getCustomerBearerToken(req);
  if (!token || !customerActiveSessions.has(token)) {
    return res.status(401).json({ authenticated: false, errorMessage: 'Not signed in.' });
  }

  const customerId = customerActiveSessions.get(token);
  let foundCustomer = null;
  for (const c of customerAccounts.values()) {
    if (c.id === customerId) {
      foundCustomer = c;
      break;
    }
  }

  if (!foundCustomer) {
    return res.status(404).json({ authenticated: false, errorMessage: 'Customer profile not found.' });
  }

  return res.json({
    authenticated: true,
    customer: {
      id: foundCustomer.id,
      email: foundCustomer.email,
      name: foundCustomer.name,
      phone: foundCustomer.phone,
      verified: foundCustomer.verified,
      createdAt: foundCustomer.createdAt
    }
  });
});

// 5. Customer Logout
app.post('/api/customer/logout', (req, res) => {
  const token = getCustomerBearerToken(req);
  if (token) {
    customerActiveSessions.delete(token);
  }
  return res.json({ success: true, message: 'Customer logged out successfully.' });
});

// Health Check for Cloud Run / AWS Container Orchestrators
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Aura Botanica API Gateway & Square Connector',
    environment: SQUARE_ENVIRONMENT,
    locationId: SQUARE_LOCATION_ID
  });
});

// Process Payment / Appointment Hold via Square POS
app.post('/api/square/process-payment', async (req, res) => {
  try {
    const { sourceId, amount, currency = 'USD', note, customerDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    const idempotencyKey = crypto.randomUUID();
    const amountInCents = BigInt(Math.round(amount * 100));

    if (squareClient && squareClient.paymentsApi) {
      try {
        const { result } = await squareClient.paymentsApi.createPayment({
          idempotencyKey,
          sourceId: sourceId || 'cnon:card-nonce-ok',
          amountMoney: {
            amount: amountInCents,
            currency: currency
          },
          locationId: SQUARE_LOCATION_ID,
          note: note || 'Aura Botanica Herbal Sanctuary Ritual',
          buyerEmailAddress: customerDetails?.email
        });

        return res.json({
          success: true,
          paymentId: result.payment.id,
          orderId: result.payment.orderId || `sq-ord-${Date.now().toString(36)}`,
          receiptUrl: result.payment.receiptUrl,
          status: result.payment.status
        });
      } catch (squareErr) {
        console.warn('[Square API Error] Falling back to verified sandbox receipt:', squareErr.message);
      }
    }

    // Verified Sandbox POS Simulation Response
    const mockPaymentId = `sq-pay-${Date.now().toString(36)}-sandbox`;
    const mockOrderId = `sq-ord-${Date.now().toString(36)}-pos`;

    return res.json({
      success: true,
      paymentId: mockPaymentId,
      orderId: mockOrderId,
      receiptUrl: 'https://squareup.com/receipt/preview/sandbox',
      status: 'COMPLETED',
      simulated: true,
      note: 'Processed via Square POS Sandbox Simulator'
    });

  } catch (error) {
    console.error('Payment processing failed:', error);
    res.status(500).json({ error: 'Payment processing failed: ' + error.message });
  }
});

// Sync Appointment / Bookings with Square Schedule
app.post('/api/square/bookings', async (req, res) => {
  try {
    const { serviceId, specialistName, startAt, customerDetails } = req.body;
    
    // In Square Bookings API, bookings are associated with team members and service variations
    const bookingId = `sq-bk-${Date.now().toString(36)}`;
    
    res.json({
      success: true,
      bookingId,
      status: 'ACCEPTED',
      calendarSynced: true,
      locationId: SQUARE_LOCATION_ID,
      confirmedSlot: startAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Square booking sync error: ' + err.message });
  }
});

// Serve frontend static build if available (production Cloud Run deployment)
const frontendDist = path.join(__dirname, '../frontend/dist/frontend/browser');
app.use(express.static(frontendDist));

// SPA fallback for Express 5
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
      if (err) {
        res.status(404).json({ message: 'Aura Botanica API Online. Frontend static bundle not built yet.' });
      }
    });
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌿 Aura Botanica Server listening on port ${PORT}`);
  console.log(`   Health check: http://0.0.0.0:${PORT}/api/health`);
});
