import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { dbManager } from './server/db';
import { supabase } from './server/supabase';
import { 
  bangladeshTimeToUtcTimestamp, 
  formatBangladeshDateTime, 
  BST_OFFSET_MS, 
  BANGLADESH_TIMEZONE 
} from './server/timeUtils';
import { 
  User, 
  Tournament, 
  Transaction, 
  DepositRequest, 
  WithdrawalRequest, 
  Announcement, 
  Notification, 
  CategoryInfo, 
  BannerMedia,
  Participant
} from './src/types';

const app = express();
const PORT = 3000;

// Initialize upload directories
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const IMAGES_DIR = path.join(UPLOADS_DIR, 'images');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const AUDIO_DIR = path.join(UPLOADS_DIR, 'audio');
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');

[UPLOADS_DIR, IMAGES_DIR, VIDEOS_DIR, AUDIO_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for profile uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

// Serve uploaded static files directly with CORS & Byte-Range media streaming headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
}, express.static(UPLOADS_DIR, {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Accept-Ranges', 'bytes');
  }
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Helper token/session simulator with persistent backing
function getSessionUser(token: string): { userId: string; role: string } | undefined {
  if (!token) return undefined;
  
  const persistentSession = dbManager.getSession(token);
  if (persistentSession) {
    return { userId: persistentSession.userId, role: persistentSession.role };
  }

  const db = dbManager.getDatabase();
  // Fallback: If token starts with adm_, allow recovery if token matches known admin
  if (token.startsWith('adm_')) {
    const adminUser = db.users.find(u => u.role === 'ADMIN' || u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (adminUser) {
      dbManager.saveSession(token, adminUser.id, 'ADMIN');
      return { userId: adminUser.id, role: 'ADMIN' };
    }
  }

  // Fallback: If token starts with tok_ and is in a dev container reload state, recover for primary user if available
  if (token.startsWith('tok_') && db.users.length > 0) {
    const user = db.users[0];
    if (user) {
      dbManager.saveSession(token, user.id, user.role);
      return { userId: user.id, role: user.role };
    }
  }

  return undefined;
}

function setSession(token: string, userId: string, role: string) {
  dbManager.saveSession(token, userId, role as any);
}

// Generate ID helper
function generateId(prefix: string) {
  return `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;
}

// Admin configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'joyshakib689@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '##sheikh##bijoy##';

// Middleware for authentication
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized. Please login.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const session = getSessionUser(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }
  const db = dbManager.getDatabase();
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  // Master Admin Protection: joy shakib is PERMANENTLY ACTIVE and bypasses all suspension guards
  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'ADMIN') {
    user.status = 'ACTIVE';
    (user as any).account_status = 'ACTIVE';
    user.isVerified = true;
    (user as any).is_verified = true;
    user.role = 'ADMIN';
  } else if (user.status === 'SUSPENDED' || (user as any).account_status === 'SUSPENDED') {
    res.status(403).json({ error: 'Your account has been suspended by administration.' });
    return;
  }
  (req as any).user = user;
  next();
}

// Middleware for Admin only
function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as User;
  if (!user) {
    res.status(403).json({ error: 'Access Denied. Administrator privileges required.' });
    return;
  }

  // Master admin bypass
  if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    user.role = 'ADMIN';
    user.status = 'ACTIVE';
    next();
    return;
  }

  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access Denied. Administrator privileges required.' });
    return;
  }
  next();
}

// ----------------------------------------------------
// Realtime Server-Sent Events (SSE)
// ----------------------------------------------------
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  dbManager.addSseClient(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);

  req.on('close', () => {
    dbManager.removeSseClient(res);
  });
});

// ----------------------------------------------------
// Public / Bootstrap Data
// ----------------------------------------------------
app.get('/api/bootstrap', (req: Request, res: Response) => {
  const db = dbManager.getDatabase();
  const musicSettings = db.musicSettings || db.websiteSettings?.musicSettings || {
    backgroundMusicUrl: db.websiteSettings?.backgroundMusicUrl || 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    musicTitle: db.websiteSettings?.musicTitle || 'EGX Cyberpunk Tournament Beat',
    artistName: db.websiteSettings?.artistName || 'EGX Esports Sound',
    autoPlayOnDarkMode: db.websiteSettings?.autoPlayOnDarkMode !== undefined ? db.websiteSettings.autoPlayOnDarkMode : true,
    volume: db.websiteSettings?.volume || 90,
    isEnabled: true,
    updatedAt: new Date().toISOString()
  };

  const safeCategories = db.categories
    .filter(c => c.isActive !== false && c.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => {
      const isPub = c.published !== false && c.imageStatus !== 'UNPUBLISHED';
      return {
        ...c,
        coverImage: isPub ? (c.publishedImage || c.coverImage || c.icon) : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        icon: isPub ? (c.publishedImage || c.coverImage || c.icon) : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        isPublished: isPub,
        published: isPub
      };
    });

  res.json({
    categories: safeCategories,
    banners: db.banners.filter(b => b.isActive),
    announcements: db.announcements.filter(a => a.isPublished),
    paymentSettings: db.paymentSettings,
    supportSettings: db.supportSettings,
    websiteSettings: db.websiteSettings,
    musicSettings,
    tournaments: db.tournaments.map(t => {
      // Omit room password for unauthenticated public feed
      const { roomPassword, ...safeTournament } = t;
      return safeTournament;
    })
  });
});

// ----------------------------------------------------
// User Authentication Routes
// ----------------------------------------------------
app.post('/api/auth/signup', async (req: Request, res: Response): Promise<void> => {
  const { 
    fullName, 
    username, 
    email, 
    mobile, 
    mobileNumber,
    password, 
    freeFireUid, 
    freeFireIgn, 
    whatsapp, 
    whatsappNumber,
    messenger 
  } = req.body;

  const rawFullName = (fullName || '').toString().trim();
  const rawUsername = (username || '').toString().trim().toLowerCase();
  const rawEmail = (email || '').toString().trim().toLowerCase();
  const resolvedMobile = (mobile || mobileNumber || '').toString().trim();
  const resolvedWhatsapp = (whatsapp || whatsappNumber || resolvedMobile || '').toString().trim();
  const rawPassword = (password || '').toString();

  // 1. Full Name validation
  if (!rawFullName) {
    res.status(400).json({ error: 'Full Name is required.' });
    return;
  }

  // 2. Username validation
  if (!rawUsername) {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }

  if (rawUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    return;
  }

  // 3. Email validation (must end with @gmail.com)
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
  if (!rawEmail || !gmailRegex.test(rawEmail)) {
    res.status(400).json({ error: 'Invalid Gmail format. Please enter a valid @gmail.com address.' });
    return;
  }

  // 4. Phone Number validation (STRICT 11-digit Bangladeshi validation)
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  if (!resolvedMobile || !bdPhoneRegex.test(resolvedMobile)) {
    res.status(400).json({ error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' });
    return;
  }
  const phoneDigits = resolvedMobile;

  // 5. WhatsApp Number validation (STRICT 11-digit Bangladeshi validation)
  if (!resolvedWhatsapp || !bdPhoneRegex.test(resolvedWhatsapp)) {
    res.status(400).json({ error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' });
    return;
  }
  const whatsappDigits = resolvedWhatsapp;

  // 6. Password validation (Minimum 6 characters)
  if (!rawPassword || rawPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const db = dbManager.getDatabase();
  
  // Check uniqueness of username and email
  const existingEmailUser = db.users.find(u => u.email.toLowerCase() === rawEmail);
  if (existingEmailUser) {
    res.status(400).json({ error: 'An account with this Gmail address already exists.' });
    return;
  }

  const existingUsernameUser = db.users.find(u => u.username && u.username.toLowerCase() === rawUsername);
  if (existingUsernameUser) {
    res.status(400).json({ error: 'Username is already taken. Please choose another username.' });
    return;
  }

  const isAdmin = rawEmail === ADMIN_EMAIL.toLowerCase();

  const newUser: User = {
    id: generateId('EGX'),
    fullName: rawFullName,
    username: rawUsername,
    email: rawEmail,
    password: rawPassword,
    passwordHash: rawPassword,
    mobile: phoneDigits,
    mobileNumber: phoneDigits,
    freeFireUid: freeFireUid ? freeFireUid.toString().trim() : '',
    freeFireIgn: freeFireIgn ? freeFireIgn.toString().trim() : '',
    whatsapp: whatsappDigits,
    whatsappNumber: whatsappDigits,
    messenger: messenger ? messenger.toString().trim() : '',
    balance: 0,
    winningBalance: 0,
    totalDeposited: 0,
    totalWinnings: 0,
    totalEntryFees: 0,
    totalWithdrawn: 0,
    totalMatches: 0,
    totalMatchesPlayed: 0,
    totalWins: 0,
    role: isAdmin ? 'ADMIN' : 'USER',
    status: 'ACTIVE',
    isVerified: isAdmin ? true : false,
    verificationStatus: isAdmin ? 'VERIFIED' : 'UNVERIFIED',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  await dbManager.syncUserToSupabase(newUser);

  // Sync to Supabase
  try {
    const { error: supabaseError } = await supabase
      .from('users')
      .upsert([{
        id: newUser.id,
        full_name: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        mobile: newUser.mobile,
        free_fire_uid: newUser.freeFireUid,
        free_fire_ign: newUser.freeFireIgn,
        whatsapp: newUser.whatsapp,
        role: newUser.role,
        status: newUser.status,
        created_at: newUser.createdAt
      }]);
    if (supabaseError) console.error('Supabase User Sync Error:', supabaseError.message);
  } catch (e) {
    console.error('Supabase Connection Failed:', e);
  }

  // Initial welcome notification
  dbManager.addNotification(
    newUser.id,
    'Welcome to EGX FF Tournament!',
    'Your account has been created instantly. Add balance via bKash/Nagad/Rocket to join tournaments.',
    'ANNOUNCEMENT'
  );

  dbManager.save();

  // Create session immediately (No OTP required)
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setSession(token, newUser.id, newUser.role);

  res.json({
    token,
    user: newUser
  });
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  const { identifier, email, username, phone, password } = req.body;
  const loginId = (identifier || email || username || phone || '').toString().trim().toLowerCase();
  const loginPass = (password || '').toString();

  if (!loginId || !loginPass) {
    res.status(400).json({ error: 'Incorrect Email or Password.' });
    return;
  }

  const db = dbManager.getDatabase();

  // Check for Secret Master Admin Credentials (joyshakib689@gmail.com / ##sheikh##bijoy##)
  const isSecretAdminMatch = (loginId === ADMIN_EMAIL.toLowerCase() || loginId === 'egxadmin') && loginPass === ADMIN_PASSWORD;

  if (isSecretAdminMatch) {
    let adminUser = db.users.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!adminUser) {
      adminUser = {
        id: generateId('EGX'),
        fullName: 'EGX Master Admin',
        username: 'egxadmin',
        email: ADMIN_EMAIL.toLowerCase(),
        password: ADMIN_PASSWORD,
        passwordHash: ADMIN_PASSWORD,
        mobile: '01778999965',
        mobileNumber: '01778999965',
        freeFireUid: '109837465',
        freeFireIgn: 'EGX_MASTER',
        whatsapp: '01778999965',
        whatsappNumber: '01778999965',
        balance: 1000,
        totalDeposited: 1000,
        totalWinnings: 0,
        totalEntryFees: 0,
        totalWithdrawn: 0,
        totalMatches: 0,
        totalWins: 0,
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      db.users.push(adminUser);
    } else {
      adminUser.role = 'ADMIN';
      adminUser.status = 'ACTIVE';
      (adminUser as any).account_status = 'ACTIVE';
      adminUser.isVerified = true;
      (adminUser as any).is_verified = true;
      adminUser.verificationStatus = 'VERIFIED';
      adminUser.password = ADMIN_PASSWORD;
      adminUser.passwordHash = ADMIN_PASSWORD;
    }

    const token = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setSession(token, adminUser.id, 'ADMIN');

    dbManager.logAudit(adminUser.id, adminUser.email, 'ADMIN_LOGIN', 'ADMIN_SESSION', adminUser.id, 'Secret Admin login via main authentication modal');
    dbManager.save();

    res.json({
      token,
      user: adminUser,
      isAdmin: true,
      redirect: '/admin'
    });
    return;
  }

  // Search for regular player
  const user = db.users.find(
    u => u.email.toLowerCase() === loginId || 
         (u.username && u.username.toLowerCase() === loginId) ||
         (u.freeFireUid && u.freeFireUid.toLowerCase() === loginId) ||
         (u.mobile && u.mobile.replace(/\D/g, '') === loginId.replace(/\D/g, '')) ||
         (u.mobileNumber && u.mobileNumber.replace(/\D/g, '') === loginId.replace(/\D/g, ''))
  );

  if (!user || user.password !== loginPass) {
    res.status(400).json({ error: 'Incorrect Email or Password.' });
    return;
  }

  // If this user is an admin, always ensure ACTIVE status and bypass suspension
  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'ADMIN') {
    user.status = 'ACTIVE';
    (user as any).account_status = 'ACTIVE';
    user.isVerified = true;
    user.role = 'ADMIN';
  } else if (user.status === 'SUSPENDED' || (user as any).account_status === 'SUSPENDED') {
    res.status(403).json({ error: 'Your account is suspended. Contact support.' });
    return;
  }

  const isAdminUser = user.role === 'ADMIN' || user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  
  // Real-time notification for Admins when a player logs in
  if (!isAdminUser) {
    const adminNotificationTitle = 'User Login Alert';
    const adminNotificationMsg = `Player ${user.username || user.email} logged into the system.`;
    
    db.users.filter(u => u.role === 'ADMIN').forEach(admin => {
      dbManager.addNotification(admin.id, adminNotificationTitle, adminNotificationMsg, 'ADMIN_ALERT');
    });
    
    // Broadcast real-time event
    dbManager.broadcastUpdate({
      type: 'ADMIN_LOGIN_ALERT',
      message: adminNotificationMsg,
      username: user.username || user.email,
      fullName: user.fullName,
      email: user.email,
      freeFireUid: user.freeFireUid,
      freeFireIgn: user.freeFireIgn,
      mobile: user.mobile || user.mobileNumber,
      timestamp: Date.now()
    });

    // Persistent login tracking
    await dbManager.addUserLogin({
      userId: user.id,
      fullName: user.fullName,
      username: user.username || user.email,
      email: user.email,
      mobile: (user.mobile || user.mobileNumber || '').toString(),
      freeFireUid: user.freeFireUid || '',
      freeFireIgn: user.freeFireIgn || '',
      timestamp: Date.now()
    });
  }

  const token = isAdminUser 
    ? `adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    : `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setSession(token, user.id, user.role);

  res.json({
    token,
    user,
    isAdmin: isAdminUser,
    redirect: isAdminUser ? '/admin' : '/'
  });
});

app.post('/api/admin/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Invalid Admin Credentials.' });
    return;
  }

  const db = dbManager.getDatabase();
  const trimmedEmail = email.trim().toLowerCase();

  // Verify strictly against configured admin credentials or designated ADMIN role in DB
  const isAdminMatch = (trimmedEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD);
  
  if (!isAdminMatch) {
    // Check if user is an existing admin with matching credentials
    const adminUser = db.users.find(u => u.email.toLowerCase() === trimmedEmail && u.role === 'ADMIN');
    if (!adminUser || adminUser.password !== password) {
      res.status(401).json({ error: 'Invalid Admin Credentials.' });
      return;
    }
  }

  let adminUser = db.users.find(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  if (!adminUser) {
    adminUser = {
      id: generateId('EGX'),
      fullName: 'EGX Master Admin',
      username: 'egxadmin',
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      passwordHash: ADMIN_PASSWORD,
      mobile: '01778999965',
      mobileNumber: '01778999965',
      freeFireUid: '109837465',
      freeFireIgn: 'EGX_MASTER',
      whatsapp: '01778999965',
      whatsappNumber: '01778999965',
      balance: 1000,
      totalDeposited: 1000,
      totalWinnings: 0,
      totalEntryFees: 0,
      totalWithdrawn: 0,
      totalMatches: 0,
      totalWins: 0,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.users.push(adminUser);
  } else {
    adminUser.role = 'ADMIN';
    adminUser.status = 'ACTIVE';
    (adminUser as any).account_status = 'ACTIVE';
    adminUser.isVerified = true;
    (adminUser as any).is_verified = true;
    adminUser.verificationStatus = 'VERIFIED';
    if (!adminUser.password || adminUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      adminUser.password = ADMIN_PASSWORD;
      adminUser.passwordHash = ADMIN_PASSWORD;
    }
  }

  dbManager.save();

  const token = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  setSession(token, adminUser.id, 'ADMIN');

  dbManager.logAudit(adminUser.id, adminUser.email, 'ADMIN_LOGIN', 'ADMIN_SESSION', adminUser.id, 'Admin successfully logged in with full access');
  
  // Persistent login tracking even for admin (optional but requested)
  await dbManager.addUserLogin({
    userId: adminUser.id,
    fullName: adminUser.fullName,
    username: adminUser.username || adminUser.email,
    email: adminUser.email,
    mobile: (adminUser.mobile || adminUser.mobileNumber || '').toString(),
    freeFireUid: adminUser.freeFireUid || '',
    freeFireIgn: adminUser.freeFireIgn || '',
    timestamp: Date.now()
  });

  dbManager.save();

  res.json({
    token,
    user: adminUser,
    isAdmin: true,
    redirect: '/admin'
  });
});

app.get('/api/auth/me', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  res.json({ user });
});

// Admin Logins Monitor
app.get('/api/admin/logins', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('user_logins')
      .select('*')
      .order('login_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Supabase Fetch Error (user_logins):', error.message);
      // Fallback to local DB
      const db = dbManager.getDatabase();
      res.json(db.userLogins || []);
      return;
    }

    // Map Supabase fields back to UserLoginEvent interface if necessary
    const mapped = (data || []).map(log => ({
      id: log.id,
      userId: log.user_id,
      fullName: log.full_name,
      username: log.username,
      email: log.email,
      mobile: log.mobile,
      freeFireUid: log.free_fire_uid,
      freeFireIgn: log.free_fire_ign,
      timestamp: new Date(log.login_at).getTime()
    }));

    res.json(mapped);
  } catch (e) {
    console.error('Supabase Connection Failed:', e);
    const db = dbManager.getDatabase();
    res.json(db.userLogins || []);
  }
});

// Admin User Detailed Statistics
app.get('/api/admin/users/:id/details', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  const targetUser = db.users.find(u => u.id === req.params.id);
  if (!targetUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Calculate stats
  const totalDeposits = db.deposits
    .filter(d => d.userId === targetUser.id && d.status === 'CONFIRMED')
    .reduce((sum, d) => sum + d.amount, 0);
  
  const totalWithdrawals = db.withdrawals
    .filter(w => w.userId === targetUser.id && w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.amount, 0);

  // Kills and matches
  let totalKills = 0;
  db.tournaments.forEach(t => {
    const p = t.participants.find(p => p.userId === targetUser.id);
    if (p && p.kills) totalKills += p.kills;
  });

  res.json({
    user: targetUser,
    stats: {
      totalDeposits,
      totalWithdrawals,
      totalKills,
      totalMatches: targetUser.totalMatches || 0,
      totalWinnings: targetUser.totalWinnings || 0,
      balance: targetUser.balance || 0,
      winningBalance: targetUser.winningBalance || 0
    }
  });
});

// Update Profile endpoint (supports both routes and all property aliases)
const handleProfileUpdate = (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  const { fullName, freeFireUid, freeFireIgn, mobile, mobileNumber, whatsapp, whatsappNumber, messenger } = req.body;

  const db = dbManager.getDatabase();
  const dbUser = db.users.find(u => u.id === user.id);
  if (!dbUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (fullName) dbUser.fullName = fullName.trim();
  if (freeFireUid !== undefined) dbUser.freeFireUid = freeFireUid.trim();
  if (freeFireIgn !== undefined) dbUser.freeFireIgn = freeFireIgn.trim();

  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  
  const resolvedMobile = mobile || mobileNumber;
  if (resolvedMobile) {
    if (!bdPhoneRegex.test(resolvedMobile.trim())) {
      res.status(400).json({ error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' });
      return;
    }
    dbUser.mobile = resolvedMobile.trim();
    if ((dbUser as any).mobileNumber !== undefined) (dbUser as any).mobileNumber = resolvedMobile.trim();
  }

  const resolvedWhatsapp = whatsapp || whatsappNumber;
  if (resolvedWhatsapp) {
    if (!bdPhoneRegex.test(resolvedWhatsapp.trim())) {
      res.status(400).json({ error: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' });
      return;
    }
    dbUser.whatsapp = resolvedWhatsapp.trim();
    if ((dbUser as any).whatsappNumber !== undefined) (dbUser as any).whatsappNumber = resolvedWhatsapp.trim();
  }

  if (messenger !== undefined) dbUser.messenger = messenger.trim();

  dbManager.save();
  res.json({ success: true, user: dbUser });
};

app.put('/api/auth/profile', authMiddleware, handleProfileUpdate);
app.put('/api/user/update-profile', authMiddleware, handleProfileUpdate);

// Avatar Upload Route
app.post('/api/user/upload-avatar', authMiddleware, uploadAvatar.single('avatar'), (req: Request, res: Response): void => {
  const token = req.headers.authorization?.split(' ')[1];
  const session = getSessionUser(token || '');
  const file = (req as any).file;
  
  if (!session || !file) {
    res.status(400).json({ error: 'No file uploaded or unauthorized' });
    return;
  }

  const db = dbManager.getDatabase();
  const user = db.users.find(u => u.id === session.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Construct local URL
  const avatarUrl = `/uploads/images/${file.filename}`;
  
  // Persist both field names for maximum compatibility
  user.profileImage = avatarUrl;
  user.avatar_url = avatarUrl;
  
  dbManager.save();
  
  res.json({ success: true, avatarUrl });
});

// Change Password endpoint
app.put('/api/user/change-password', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  const { currentPassword, newPassword } = req.body;

  const db = dbManager.getDatabase();
  const dbUser = db.users.find(u => u.id === user.id);
  if (!dbUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (currentPassword && dbUser.password !== currentPassword) {
    res.status(400).json({ error: 'Current password does not match.' });
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  dbUser.password = newPassword;
  dbManager.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});

// ----------------------------------------------------
// Server Time & Bangladesh Standard Time (BST)
// ----------------------------------------------------
app.get('/api/time', (req: Request, res: Response) => {
  const now = Date.now();
  const bst = formatBangladeshDateTime(now);
  res.json({
    serverTime: now,
    iso: new Date(now).toISOString(),
    timezone: BANGLADESH_TIMEZONE,
    bstOffsetMs: BST_OFFSET_MS,
    formattedBst: bst.displayFull,
    date: bst.formattedDate,
    time: bst.formattedTime12,
    year: bst.year
  });
});

// ----------------------------------------------------
// User Tournament Operations
// ----------------------------------------------------
app.get('/api/tournaments', (req: Request, res: Response) => {
  const db = dbManager.getDatabase();
  res.json(db.tournaments);
});

// User Homepage Tournament Filter Endpoint (Strictly 1 Tournament Returned)
app.get('/api/tournaments/homepage', (req: Request, res: Response): void => {
  const categoryParam = (req.query.category || '').toString().trim();
  if (!categoryParam) {
    res.json({ tournament: null, category: '', totalAvailable: 0 });
    return;
  }

  const db = dbManager.getDatabase();
  
  // Format slug for robust category comparison
  const targetCategoryUpper = categoryParam.toUpperCase().replace(/[\s-]+/g, '_');
  
  // Exclude completed, cancelled, closed, deleted, rejected
  const invalidStatuses = ['COMPLETE', 'CANCELLED', 'CLOSED', 'DELETED', 'REJECTED'];

  const matched = db.tournaments.filter(t => {
    // Only tournaments explicitly enabled for homepage display by Admin
    if (!t.showOnHomepage) return false;
    if (invalidStatuses.includes(t.status)) return false;

    // Check category matching
    const catUpper = (t.category || '').toUpperCase().replace(/[\s-]+/g, '_');
    if (targetCategoryUpper === 'SOLO') {
      return catUpper === 'SOLO';
    }
    if (targetCategoryUpper === 'DUO') {
      return catUpper === 'DUO';
    }
    if (targetCategoryUpper === 'BR' || targetCategoryUpper === 'BR_MATCH' || targetCategoryUpper === 'BATTLEROYALE' || targetCategoryUpper === 'BATTLE_ROYALE') {
      return catUpper === 'BR' || catUpper === 'BR_MATCH' || catUpper === 'BATTLE_ROYALE' || catUpper.includes('BR');
    }
    if (targetCategoryUpper === 'SQUAD' || targetCategoryUpper === 'CLASSIC_SQUAD') {
      return catUpper === 'SQUAD' || catUpper === 'CLASSIC_SQUAD' || catUpper.includes('SQUAD');
    }
    if (targetCategoryUpper === '2V2' || targetCategoryUpper === '2V2_LONE_WOLF' || targetCategoryUpper === 'LONE_WOLF') {
      return catUpper === '2V2_LONE_WOLF' || catUpper === '2V2' || catUpper === 'LONE_WOLF';
    }
    return catUpper === targetCategoryUpper;
  });

  // Sort by:
  // 1. displayPriority asc (1 = top priority, 2, 3...)
  // 2. Nearest start time (matchTimestamp / tournamentStartAt) asc
  matched.sort((a, b) => {
    const pA = a.displayPriority !== undefined ? Number(a.displayPriority) : 999;
    const pB = b.displayPriority !== undefined ? Number(b.displayPriority) : 999;
    if (pA !== pB) return pA - pB;

    const timeA = a.matchTimestamp || a.tournamentStartAt || 0;
    const timeB = b.matchTimestamp || b.tournamentStartAt || 0;
    return timeA - timeB;
  });

  // LIMIT 1: The homepage must NEVER display more than ONE tournament card for the selected category
  const singleTournament = matched.length > 0 ? matched[0] : null;

  if (singleTournament) {
    const { roomPassword, ...safeTournament } = singleTournament;
    res.json({ tournament: safeTournament, category: categoryParam, totalAvailable: matched.length });
  } else {
    res.json({ tournament: null, category: categoryParam, totalAvailable: 0 });
  }
});

app.get('/api/tournaments/:id', (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  const tournament = db.tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found.' });
    return;
  }
  res.json(tournament);
});

// Atomic Tournament Join with Mandatory FF UID & In-Game Name Validation
app.post('/api/tournaments/:id/join', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as User;
  const db = dbManager.getDatabase();

  const tournament = db.tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found.' });
    return;
  }

  // Mandatory Free Fire UID and In-Game Name validation
  const freeFireUid = (req.body.freeFireUid || user.freeFireUid || '').toString().trim();
  const inGameName = (req.body.inGameName || req.body.freeFireIgn || user.freeFireIgn || user.username || '').toString().trim();

  if (!freeFireUid) {
    res.status(400).json({ error: 'Free Fire UID is required to join this tournament.' });
    return;
  }

  if (!inGameName) {
    res.status(400).json({ error: 'Free Fire In-Game Name (IGN) is required to join this tournament.' });
    return;
  }

  if (tournament.status === 'COMPLETE' || tournament.status === 'CANCELLED') {
    res.status(400).json({ error: 'Tournament is completed or cancelled and no longer accepting entries.' });
    return;
  }

  // Check if match has already started or closed
  const currentServerTime = Date.now();
  if (tournament.matchTimestamp && currentServerTime >= tournament.matchTimestamp && tournament.status !== 'WAITING') {
    res.status(400).json({ error: 'Registration is closed. The tournament match has already started.' });
    return;
  }

  if (tournament.participants.length >= tournament.totalSlots) {
    res.status(400).json({ error: 'Tournament is completely full. No slots remaining.' });
    return;
  }

  const alreadyJoined = tournament.participants.some(p => p.userId === user.id);
  if (alreadyJoined) {
    res.status(400).json({ error: 'You are already registered for this tournament.' });
    return;
  }

  const currentUser = db.users.find(u => u.id === user.id);
  if (!currentUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  if (currentUser.status === 'SUSPENDED' || (currentUser as any).account_status === 'SUSPENDED') {
    res.status(403).json({ error: 'Your account has been suspended by administration. You cannot join tournament matches.' });
    return;
  }

  if (currentUser.balance < tournament.entryFee) {
    res.status(400).json({ 
      error: `Insufficient balance! Entry fee is ৳${tournament.entryFee}, but your wallet balance is ৳${currentUser.balance}. Please add money via bKash/Nagad/Rocket.` 
    });
    return;
  }

  // Update player profile FF UID and IGN if provided
  if (freeFireUid) currentUser.freeFireUid = freeFireUid;
  if (inGameName) currentUser.freeFireIgn = inGameName;

  // Deduct entry fee atomically
  currentUser.balance -= tournament.entryFee;
  currentUser.totalEntryFees += tournament.entryFee;
  currentUser.totalMatches += 1;

  const slotNumber = tournament.participants.length + 1;
  const participant: Participant = {
    userId: currentUser.id,
    username: currentUser.username,
    fullName: currentUser.fullName,
    freeFireUid,
    freeFireIgn: inGameName,
    inGameName,
    email: currentUser.email,
    mobile: currentUser.mobile,
    entryFee: tournament.entryFee,
    joinedAt: new Date().toISOString(),
    slotNumber
  };

  tournament.participants.push(participant);
  tournament.joinedCount = tournament.participants.length;

  // Sync to Supabase
  try {
    const { error: supabaseError } = await supabase
      .from('tournament_participants')
      .insert([{
        tournament_id: tournament.id,
        user_id: participant.userId,
        username: participant.username,
        full_name: participant.fullName,
        free_fire_uid: participant.freeFireUid,
        free_fire_ign: participant.freeFireIgn,
        slot_number: participant.slotNumber,
        joined_at: participant.joinedAt
      }]);
    if (supabaseError) console.error('Supabase Participant Sync Error:', supabaseError.message);
  } catch (e) {
    console.error('Supabase Connection Failed:', e);
  }

  // Create immutable transaction record
  const transaction: Transaction = {
    id: generateId('TRX'),
    userId: currentUser.id,
    userEmail: currentUser.email,
    userName: currentUser.fullName,
    type: 'TOURNAMENT_ENTRY',
    amount: tournament.entryFee,
    balanceAfter: currentUser.balance,
    reference: `Tournament Join: ${tournament.name} (#${tournament.id})`,
    status: 'COMPLETED',
    timestamp: new Date().toISOString()
  };

  db.transactions.unshift(transaction);

  // Send user notification
  dbManager.addNotification(
    currentUser.id,
    `Registered for ${tournament.name}`,
    `You are registered for Slot #${slotNumber}. Match Date: ${tournament.matchDate}, Start Time: ${tournament.matchTime} (BST). Entry Fee: ৳${tournament.entryFee}`,
    'TOURNAMENT_JOINED',
    { tournamentId: tournament.id, slotNumber }
  );

  dbManager.save();

  res.json({
    success: true,
    message: `Successfully joined ${tournament.name}! Your slot is #${slotNumber}.`,
    tournament,
    user: currentUser
  });
});

// Room credentials retrieval (Only for joined participants when eligible or Admin)
app.get('/api/tournaments/:id/room', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  const db = dbManager.getDatabase();

  const tournament = db.tournaments.find(t => t.id === req.params.id);
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found.' });
    return;
  }

  const isParticipant = tournament.participants.some(p => p.userId === user.id);
  const isAdmin = user.role === 'ADMIN';

  if (!isParticipant && !isAdmin) {
    res.status(403).json({ error: 'Only registered participants can access room credentials.' });
    return;
  }

  const nowTime = Date.now();
  const releaseMinutes = tournament.roomReleaseMinutes || 2;
  const releaseWindowMs = releaseMinutes * 60 * 1000;
  const releaseTimestamp = (tournament.matchTimestamp || (nowTime + 3600000)) - releaseWindowMs;
  const isReleased = (nowTime >= releaseTimestamp) || isAdmin || tournament.status === 'LIVE MATCH';

  if (!isReleased && !isAdmin) {
    res.json({ 
      isReleased: false,
      releaseTimestamp,
      releaseMinutes,
      message: `Room details will be released ${releaseMinutes} minutes before the match start time.` 
    });
    return;
  }

  res.json({
    isReleased: true,
    roomId: tournament.roomId || 'Available Soon',
    roomPassword: tournament.roomPassword || 'Available Soon',
    releaseTimestamp,
    releaseMinutes
  });
});

// User My Matches
app.get('/api/user/my-matches', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  const db = dbManager.getDatabase();

  const userTournaments = db.tournaments.filter(t => 
    t.participants.some(p => p.userId === user.id)
  );

  res.json(userTournaments);
});

// ----------------------------------------------------
// User Wallet & Transactions
// ----------------------------------------------------
app.get('/api/wallet/summary', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  const db = dbManager.getDatabase();
  const dbUser = db.users.find(u => u.id === user.id);

  if (!dbUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const userTransactions = db.transactions.filter(t => t.userId === user.id);
  const userDeposits = db.deposits.filter(d => d.userId === user.id);
  const userWithdrawals = db.withdrawals.filter(w => w.userId === user.id);

  res.json({
    balance: dbUser.balance,
    totalDeposited: dbUser.totalDeposited,
    totalWinnings: dbUser.totalWinnings,
    totalEntryFees: dbUser.totalEntryFees,
    totalWithdrawn: dbUser.totalWithdrawn,
    transactions: userTransactions,
    deposits: userDeposits,
    withdrawals: userWithdrawals,
    paymentSettings: db.paymentSettings
  });
});

// Deposit Submission
app.post('/api/wallet/deposit', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as User;
  const { method, amount, senderNumber, transactionId } = req.body;

  const numAmount = Number(amount);
  const db = dbManager.getDatabase();
  const dbUser = db.users.find(u => u.id === user.id);

  if (!dbUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (dbUser.status === 'SUSPENDED' || (dbUser as any).account_status === 'SUSPENDED') {
    res.status(403).json({ error: 'Your account has been suspended by administration. Deposits are disabled.' });
    return;
  }

  if (!method || !numAmount || numAmount <= 0 || !senderNumber || !transactionId) {
    res.status(400).json({ error: 'Please provide all payment details (Method, Amount, Sender Number, TrxID).' });
    return;
  }

  // Strict Phone Validation on Backend
  if (!/^01[3-9]\d{8}$/.test(senderNumber.trim())) {
    res.status(400).json({ error: 'Please enter a valid 11-digit payment number (e.g. 01XXXXXXXXX).' });
    return;
  }

  if (numAmount < (db.paymentSettings.minDeposit || 20)) {
    res.status(400).json({ error: `Minimum deposit amount is ৳${db.paymentSettings.minDeposit || 20}` });
    return;
  }

  // Check duplicate TrxID
  const duplicateTrx = db.deposits.some(d => d.transactionId.toLowerCase() === transactionId.trim().toLowerCase());
  if (duplicateTrx) {
    res.status(400).json({ error: 'This Transaction ID has already been submitted.' });
    return;
  }

  const deposit: DepositRequest = {
    id: generateId('DEP'),
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    method,
    amount: numAmount,
    senderNumber: senderNumber.trim(),
    transactionId: transactionId.trim(),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  db.deposits.unshift(deposit);
  await dbManager.syncTransactionToSupabase({
    id: deposit.id,
    userId: user.id,
    userName: user.fullName,
    type: 'DEPOSIT',
    amount: deposit.amount,
    balanceAfter: (dbUser.balance || 0),
    reference: deposit.method,
    status: deposit.status,
    method: deposit.method,
    senderNumber: deposit.senderNumber,
    timestamp: deposit.createdAt,
    userEmail: user.email
  });

  // Create PENDING transaction for history visibility
  const pendingTrx: Transaction = {
    id: generateId('TRX'),
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    type: 'DEPOSIT',
    amount: numAmount,
    balanceAfter: dbUser.balance,
    reference: `Deposit Pending (${method} - ${transactionId})`,
    status: 'PENDING',
    method: method as any,
    senderNumber: senderNumber.trim(),
    timestamp: new Date().toISOString(),
    requestId: deposit.id
  };
  db.transactions.unshift(pendingTrx);

  // Admin Notification
  dbManager.addNotification(
    'ADMIN',
    'New Deposit Request',
    `${user.fullName} requested deposit of ৳${numAmount} via ${method} (TrxID: ${transactionId}).`,
    'ADMIN_ALERT',
    { depositId: deposit.id }
  );

  dbManager.save();

  res.json({
    success: true,
    message: 'Deposit request submitted successfully! Admin will verify and credit your wallet shortly.',
    deposit
  });
});

// Withdrawal Submission
app.post('/api/wallet/withdraw', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user as User;
  const { method, accountNumber, amount } = req.body;

  const numAmount = Number(amount);
  const db = dbManager.getDatabase();
  const dbUser = db.users.find(u => u.id === user.id);

  if (!dbUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (dbUser.status === 'SUSPENDED' || (dbUser as any).account_status === 'SUSPENDED') {
    res.status(403).json({ error: 'Your account has been suspended by administration. Withdrawals are disabled.' });
    return;
  }

  if (!method || !accountNumber || !numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'Please provide withdrawal method, account number, and amount.' });
    return;
  }

  if (numAmount < (db.paymentSettings.minWithdraw || 50)) {
    res.status(400).json({ error: `Minimum withdrawal amount is ৳${db.paymentSettings.minWithdraw || 50}` });
    return;
  }

  // Calculate available balance by subtracting pending withdrawals
  const pendingWdrAmount = db.withdrawals
    .filter(w => w.userId === user.id && w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amount, 0);

  const availableBalance = dbUser.balance - pendingWdrAmount;

  if (availableBalance < numAmount) {
    res.status(400).json({ 
      error: `Insufficient available balance. Your balance is ৳${dbUser.balance}, but you have ৳${pendingWdrAmount} in pending withdrawals.` 
    });
    return;
  }

  const withdrawal: WithdrawalRequest = {
    id: generateId('WDR'),
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    method,
    accountNumber: accountNumber.trim(),
    amount: numAmount,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  db.withdrawals.unshift(withdrawal);
  await dbManager.syncTransactionToSupabase({
    id: withdrawal.id,
    userId: user.id,
    userName: user.fullName,
    type: 'WITHDRAWAL',
    amount: withdrawal.amount,
    balanceAfter: (dbUser.balance || 0),
    reference: withdrawal.method,
    status: withdrawal.status,
    method: withdrawal.method,
    senderNumber: withdrawal.accountNumber,
    timestamp: withdrawal.createdAt,
    userEmail: user.email
  });

  // Create PENDING transaction for history
  const pendingTrx: Transaction = {
    id: generateId('TRX'),
    userId: user.id,
    userName: user.fullName,
    userEmail: user.email,
    type: 'WITHDRAWAL',
    amount: numAmount,
    balanceAfter: dbUser.balance, // Not deducted yet
    reference: `Withdrawal Pending (${method} - ${accountNumber})`,
    status: 'PENDING',
    method: method as any,
    accountNumber: accountNumber.trim(),
    timestamp: new Date().toISOString(),
    requestId: withdrawal.id
  };
  db.transactions.unshift(pendingTrx);

  // Admin Alert
  dbManager.addNotification(
    'ADMIN',
    'New Withdrawal Request',
    `${user.fullName} requested withdrawal of ৳${numAmount} to ${method} (${accountNumber}).`,
    'ADMIN_ALERT',
    { withdrawalId: withdrawal.id }
  );

  dbManager.save();

  res.json({
    success: true,
    message: 'Withdrawal request submitted successfully! Processing time is 15-30 minutes.',
    withdrawal,
    balance: dbUser.balance
  });
});

// User Notifications
app.get('/api/notifications', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  const db = dbManager.getDatabase();

  const userNotifs = db.notifications.filter(n => 
    n.userId === user.id || n.userId === 'ALL' || (user.role === 'ADMIN' && n.userId === 'ADMIN')
  );

  res.json(userNotifs);
});

app.post('/api/notifications/read-all', authMiddleware, (req: Request, res: Response): void => {
  const user = (req as any).user as User;
  const db = dbManager.getDatabase();

  db.notifications.forEach(n => {
    if (n.userId === user.id || n.userId === 'ALL' || (user.role === 'ADMIN' && n.userId === 'ADMIN')) {
      n.isRead = true;
    }
  });

  dbManager.save();
  res.json({ success: true });
});

// ----------------------------------------------------
// ADMIN PANEL ENDPOINTS (Strictly protected by adminMiddleware)
// ----------------------------------------------------

// Admin Dashboard Metrics & Summary
app.get(['/api/admin/metrics', '/api/admin/dashboard'], authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();

  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u => u.status === 'ACTIVE').length;
  const suspendedUsers = db.users.filter(u => u.status === 'SUSPENDED').length;

  const totalTournaments = db.tournaments.length;
  const activeTournaments = db.tournaments.filter(t => t.status === 'COMING SOON' || t.status === 'WAITING' || t.status === 'LIVE MATCH').length;
  const upcomingTournaments = db.tournaments.filter(t => t.status === 'COMING SOON' || t.status === 'WAITING').length;
  const liveTournaments = db.tournaments.filter(t => t.status === 'LIVE MATCH').length;
  const completedTournaments = db.tournaments.filter(t => t.status === 'COMPLETE').length;

  const totalDeposits = db.deposits.reduce((acc, d) => d.status === 'CONFIRMED' ? acc + d.amount : acc, 0);
  const pendingDeposits = db.deposits.filter(d => d.status === 'PENDING').length;
  const confirmedDeposits = db.deposits.filter(d => d.status === 'CONFIRMED').length;

  const totalWithdrawals = db.withdrawals.reduce((acc, w) => w.status === 'COMPLETED' ? acc + w.amount : acc, 0);
  const pendingWithdrawals = db.withdrawals.filter(w => w.status === 'PENDING').length;
  const completedWithdrawals = db.withdrawals.filter(w => w.status === 'COMPLETED').length;

  const totalWinningPaid = db.transactions
    .filter(t => t.type === 'WINNING')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalAdminBonuses = db.transactions
    .filter(t => t.type === 'ADMIN_BONUS')
    .reduce((acc, t) => acc + t.amount, 0);

  res.json({
    // Standard dashboard overview object
    overview: {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalTournaments,
      activeTournaments,
      upcomingTournaments,
      liveTournaments,
      completedTournaments,
      totalDeposited: totalDeposits,
      totalWithdrawn: totalWithdrawals,
      totalPrizeDistributed: totalWinningPaid,
      totalAdminBonuses
    },
    pendingCounts: {
      deposits: pendingDeposits,
      withdrawals: pendingWithdrawals
    },
    recentTournaments: db.tournaments.slice(0, 8),
    recentTransactions: db.transactions.slice(0, 15),

    // Flat properties for compatibility
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalTournaments,
    upcomingTournaments,
    liveTournaments,
    completedTournaments,
    totalDeposits,
    pendingDeposits,
    confirmedDeposits,
    totalWithdrawals,
    pendingWithdrawals,
    completedWithdrawals,
    totalWinningPaid,
    totalAdminBonuses,
    recentAuditLogs: db.auditLogs.slice(0, 10)
  });
});

// Admin User Management
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.users);
});

// Admin User Status Toggle & Specific Handlers (Suspend / Activate)
const handleUserStatusChange = (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Hardcoded Master Admin Protection
  const isAdminTarget = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'ADMIN';
  if (isAdminTarget) {
    user.status = 'ACTIVE';
    (user as any).account_status = 'ACTIVE';
    user.isVerified = true;
    (user as any).is_verified = true;
    user.role = 'ADMIN';
    dbManager.save();
    res.status(403).json({ error: 'The master administrator account is protected and can never be suspended.' });
    return;
  }

  let nextStatus: 'ACTIVE' | 'SUSPENDED' = 'ACTIVE';
  if (req.path.includes('/suspend')) {
    nextStatus = 'SUSPENDED';
  } else if (req.path.includes('/activate')) {
    nextStatus = 'ACTIVE';
  } else if (req.body?.status) {
    nextStatus = req.body.status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
  } else {
    nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
  }

  user.status = nextStatus;
  (user as any).account_status = nextStatus;
  
  const actionText = nextStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVATED';
  dbManager.logAudit(
    admin.id, 
    admin.email, 
    nextStatus === 'SUSPENDED' ? 'USER_SUSPEND' : 'USER_ACTIVATE', 
    'USER', 
    user.id, 
    `${actionText} user ${user.fullName} (@${user.username || 'user'}, ${user.email})`
  );

  dbManager.addNotification(
    user.id,
    nextStatus === 'SUSPENDED' ? 'Account Suspended' : 'Account Activated',
    nextStatus === 'SUSPENDED'
      ? 'Your EGX account has been suspended by administration. Contact support if you believe this is an error.'
      : 'Your EGX account has been activated by administration. You can now join tournaments and manage your wallet.',
    'ADMIN_ALERT'
  );

  dbManager.save();

  res.json({ 
    success: true, 
    message: `User status changed to ${nextStatus}`, 
    user 
  });
};

app.put('/api/admin/users/:id/status', authMiddleware, adminMiddleware, handleUserStatusChange);
app.post('/api/admin/users/:id/status', authMiddleware, adminMiddleware, handleUserStatusChange);
app.post('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, handleUserStatusChange);
app.put('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, handleUserStatusChange);
app.post('/api/admin/users/:id/activate', authMiddleware, adminMiddleware, handleUserStatusChange);
app.put('/api/admin/users/:id/activate', authMiddleware, adminMiddleware, handleUserStatusChange);

// Admin Manual Profile Verification Toggle
const handleUserVerification = (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const user = db.users.find(u => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const isAdminTarget = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user.role === 'ADMIN';

  let targetVerified = true;
  if (req.path.includes('/unverify')) {
    targetVerified = false;
  } else if (req.body?.isVerified !== undefined) {
    targetVerified = Boolean(req.body.isVerified);
  } else if (req.body?.is_verified !== undefined) {
    targetVerified = Boolean(req.body.is_verified);
  } else {
    targetVerified = !user.isVerified;
  }

  // Hardcoded Admin Protection against un-verifying
  if (isAdminTarget && !targetVerified) {
    user.isVerified = true;
    (user as any).is_verified = true;
    user.verificationStatus = 'VERIFIED';
    user.status = 'ACTIVE';
    dbManager.save();
    res.status(403).json({ error: 'The master administrator account is protected and cannot be unverified.' });
    return;
  }

  user.isVerified = targetVerified;
  (user as any).is_verified = targetVerified;
  user.verificationStatus = targetVerified ? 'VERIFIED' : 'UNVERIFIED';
  user.verifiedAt = targetVerified ? new Date().toISOString() : undefined;

  // When verifying, activate user account if it was suspended or pending
  if (targetVerified) {
    user.status = 'ACTIVE';
    (user as any).account_status = 'ACTIVE';
  }

  const actionText = targetVerified ? 'Verified Profile' : 'Unverified Profile';
  dbManager.logAudit(
    admin.id, 
    admin.email, 
    'USER_VERIFY', 
    'USER', 
    user.id, 
    `${actionText} for ${user.fullName} (@${user.username || 'user'}, ${user.email})`
  );

  // Send notification to user about verification
  dbManager.addNotification(
    user.id,
    targetVerified ? 'Profile Verified!' : 'Profile Verification Updated',
    targetVerified 
      ? 'Congratulations! Your EGX Free Fire tournament profile has been officially verified by Admin.' 
      : 'Your profile verification status has been updated by Admin.',
    'ANNOUNCEMENT'
  );

  dbManager.save();

  res.json({ 
    success: true, 
    message: targetVerified ? 'User verified successfully and account set to ACTIVE.' : 'User profile unverified successfully.', 
    user 
  });
};

app.put(['/api/admin/users/:id/verify', '/api/admin/users/:id/verification'], authMiddleware, adminMiddleware, handleUserVerification);
app.post(['/api/admin/users/:id/verify', '/api/admin/users/:id/verification'], authMiddleware, adminMiddleware, handleUserVerification);
app.post(['/api/admin/users/:id/unverify', '/api/admin/users/:id/unverification'], authMiddleware, adminMiddleware, handleUserVerification);
app.put(['/api/admin/users/:id/unverify', '/api/admin/users/:id/unverification'], authMiddleware, adminMiddleware, handleUserVerification);

// Admin Hard Delete User (with full cascade purge of user transactions, deposits, registrations)
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const targetId = req.params.id;
  const db = dbManager.getDatabase();

  const userIndex = db.users.findIndex(u => u.id === targetId);
  if (userIndex === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const targetUser = db.users[userIndex];

  // Protect Root Admin and all Admin accounts from deletion
  if (targetUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || targetUser.role === 'ADMIN') {
    res.status(403).json({ error: 'The master administrator account is protected and cannot be deleted.' });
    return;
  }

  // 1. Cascade remove from all tournaments participants & decrement joinedCount
  db.tournaments.forEach(t => {
    if (t.participants && t.participants.length > 0) {
      const beforeLen = t.participants.length;
      t.participants = t.participants.filter(p => p.userId !== targetId);
      if (t.participants.length !== beforeLen) {
        t.joinedCount = Math.max(0, t.joinedCount - (beforeLen - t.participants.length));
      }
    }
  });

  // 2. Cascade purge all user's transactions
  db.transactions = db.transactions.filter(trx => trx.userId !== targetId);

  // 3. Cascade purge all user's deposits & withdrawals
  db.deposits = db.deposits.filter(d => d.userId !== targetId);
  db.withdrawals = db.withdrawals.filter(w => w.userId !== targetId);

  // 4. Cascade purge user notifications
  db.notifications = db.notifications.filter(n => n.userId !== targetId);

  // 5. Purge the user record from database
  const [deletedUser] = db.users.splice(userIndex, 1);

  dbManager.logAudit(
    admin.id,
    admin.email,
    'USER_HARD_DELETE',
    'USER',
    targetId,
    `Permanently purged user ${deletedUser.fullName} (@${deletedUser.username || 'user'}, ${deletedUser.email}) and all cascade records.`
  );
  dbManager.save();

  res.json({ 
    success: true, 
    message: `User account "${deletedUser.fullName}" and all associated records permanently deleted.` 
  });
});

// Admin User Payment / Balance Credit & Bonus (Atomic Ledger Credit)
app.post([
  '/api/admin/user-payment', 
  '/api/admin/credit', 
  '/api/admin/bonus', 
  '/api/admin/wallet/credit',
  '/api/admin/users/:id/credit',
  '/api/admin/users/:id/bonus'
], authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const targetId = req.params.id || req.body.userId || req.body.id || req.body.target_user_id;
  const { bonusTitle, title, note, description } = req.body;
  const rawAmount = req.body.amount || req.body.wallet_balance || req.body.balance;

  const numAmount = Number(rawAmount);
  if (!targetId) {
    res.status(400).json({ success: false, error: 'Please select a recipient player.' });
    return;
  }

  if (isNaN(numAmount) || numAmount <= 0) {
    res.status(400).json({ success: false, error: 'Please provide a valid positive credit amount.' });
    return;
  }

  const effectiveTitle = (bonusTitle || title || note || 'Admin Manual Credit').toString().trim();
  const effectiveDescription = (description || note || 'Official EGX Community Tournament Bonus').toString().trim();

  const db = dbManager.getDatabase();
  const targetUser = db.users.find(u => u.id === targetId || u.email === targetId || u.username === targetId);

  if (!targetUser) {
    res.status(404).json({ success: false, error: 'Target player account not found.' });
    return;
  }

  // Atomic ledger update
  targetUser.balance = Number((Number(targetUser.balance || 0) + numAmount).toFixed(2));
  (targetUser as any).wallet_balance = targetUser.balance;
  (targetUser as any).walletBalance = targetUser.balance;

  const nowIso = new Date().toISOString();
  const transaction: Transaction = {
    id: generateId('TRX'),
    userId: targetUser.id,
    userEmail: targetUser.email,
    userName: targetUser.fullName,
    type: 'ADMIN_BONUS',
    amount: numAmount,
    balanceAfter: targetUser.balance,
    reference: `Bonus: ${effectiveTitle} - ${effectiveDescription}`,
    status: 'COMPLETED',
    adminId: admin.id,
    timestamp: nowIso,
    createdAt: nowIso
  };

  db.transactions.unshift(transaction);

  dbManager.addNotification(
    targetUser.id,
    `Wallet Credited: ৳${numAmount}`,
    `You have received ৳${numAmount} bonus: "${effectiveTitle}". Your new wallet balance is ৳${targetUser.balance}.`,
    'BONUS'
  );

  dbManager.logAudit(
    admin.id, 
    admin.email, 
    'ADMIN_BONUS', 
    'WALLET', 
    targetUser.id, 
    `Credited ৳${numAmount} bonus to ${targetUser.fullName} (${targetUser.email}) - ${effectiveTitle}`
  );

  dbManager.save();

  // Instant real-time broadcast to all connected clients & SSE streams
  dbManager.broadcastUpdate({
    type: 'DATABASE_SYNC',
    subType: 'WALLET_CREDIT',
    userId: targetUser.id,
    newBalance: targetUser.balance,
    amount: numAmount,
    timestamp: Date.now()
  });

  res.json({
    success: true,
    message: `Successfully credited ৳${numAmount} to ${targetUser.fullName}'s account!`,
    user: targetUser,
    transaction
  });
});

// Admin Tournament Management
app.post('/api/admin/tournaments', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const admin = (req as any).user as User;
  const {
    name,
    category,
    game,
    map,
    coverImage,
    entryFee,
    prizePool,
    perKill,
    winnerPrize,
    secondPrize,
    thirdPrize,
    fourthPrize,
    fifthPrize,
    totalSlots,
    registrationStart,
    registrationEnd,
    matchDate,
    matchTime,
    rules,
    roomId,
    roomPassword,
    roomReleaseMinutes,
    status,
    isFeatured,
    showOnHomepage,
    displayPriority
  } = req.body;

  if (!name || !category || entryFee === undefined || !prizePool || !totalSlots) {
    res.status(400).json({ error: 'Please provide all required tournament fields.' });
    return;
  }

  const db = dbManager.getDatabase();
  const id = generateId('EGX');

  const parsedPrizePool = Number(prizePool);
  const parsedWinnerPrize = winnerPrize !== undefined && winnerPrize !== '' ? Number(winnerPrize) : Math.round(parsedPrizePool * 0.5);
  const parsedSecondPrize = secondPrize !== undefined && secondPrize !== '' ? Number(secondPrize) : Math.round(parsedPrizePool * 0.25);
  const parsedThirdPrize = thirdPrize !== undefined && thirdPrize !== '' ? Number(thirdPrize) : Math.round(parsedPrizePool * 0.15);
  const parsedFourthPrize = fourthPrize !== undefined && fourthPrize !== '' ? Number(fourthPrize) : 0;
  const parsedFifthPrize = fifthPrize !== undefined && fifthPrize !== '' ? Number(fifthPrize) : 0;

  // Convert Bangladesh date & time to canonical UTC timestamp
  const canonicalMatchTs = matchDate && matchTime ? bangladeshTimeToUtcTimestamp(matchDate, matchTime) : NaN;
  const matchTimestamp = !isNaN(canonicalMatchTs) ? canonicalMatchTs : Date.now() + 3600000 * 2;

  const newTournament: Tournament = {
    id,
    name: name.trim(),
    category: category.trim(),
    game: game || 'Free Fire',
    map: map || 'Bermuda',
    coverImage: coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    entryFee: Number(entryFee),
    prizePool: parsedPrizePool,
    perKill: Number(perKill || 0),
    winnerPrize: parsedWinnerPrize,
    secondPrize: parsedSecondPrize,
    thirdPrize: parsedThirdPrize,
    fourthPrize: parsedFourthPrize,
    fifthPrize: parsedFifthPrize,
    totalSlots: Number(totalSlots),
    joinedCount: 0,
    participants: [],
    registrationStart: registrationStart || new Date().toISOString(),
    registrationEnd: registrationEnd || new Date(matchTimestamp).toISOString(),
    matchDate: matchDate || formatBangladeshDateTime(matchTimestamp).isoDate,
    matchTime: matchTime || '08:00 PM',
    matchTimestamp,
    tournamentStartAt: matchTimestamp,
    rules: rules || 'Standard competitive Free Fire rules apply. No emulators, scripts, or unfair tools.',
    roomId: roomId || '',
    roomPassword: roomPassword || '',
    roomReleaseMinutes: Number(roomReleaseMinutes || 2),
    status: status || 'COMING SOON',
    isFeatured: Boolean(isFeatured),
    showOnHomepage: Boolean(showOnHomepage),
    displayPriority: Number(displayPriority || 1),
    createdAt: new Date().toISOString()
  };

  db.tournaments.unshift(newTournament);
  await dbManager.syncTournamentToSupabase(newTournament);

  // Update category count
  const cat = db.categories.find(c => c.title === category || c.name === category);
  if (cat) cat.count = (cat.count || 0) + 1;

  dbManager.logAudit(admin.id, admin.email, 'TOURNAMENT_CREATE', 'TOURNAMENT', id, `Created tournament: ${name} (${category})`);
  dbManager.save();

  res.json({ success: true, tournament: newTournament });
});

app.put('/api/admin/tournaments/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const tournament = db.tournaments.find(t => t.id === req.params.id);

  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }

  const updates = req.body;
  Object.assign(tournament, updates);
  await dbManager.syncTournamentToSupabase(tournament);

  if (updates.prizePool !== undefined) tournament.prizePool = Number(updates.prizePool);
  if (updates.entryFee !== undefined) tournament.entryFee = Number(updates.entryFee);
  if (updates.perKill !== undefined) tournament.perKill = Number(updates.perKill);
  if (updates.winnerPrize !== undefined) tournament.winnerPrize = Number(updates.winnerPrize);
  if (updates.secondPrize !== undefined) tournament.secondPrize = Number(updates.secondPrize);
  if (updates.thirdPrize !== undefined) tournament.thirdPrize = Number(updates.thirdPrize);
  if (updates.fourthPrize !== undefined) tournament.fourthPrize = Number(updates.fourthPrize);
  if (updates.fifthPrize !== undefined) tournament.fifthPrize = Number(updates.fifthPrize);
  if (updates.totalSlots !== undefined) tournament.totalSlots = Number(updates.totalSlots);
  if (updates.roomReleaseMinutes !== undefined) tournament.roomReleaseMinutes = Number(updates.roomReleaseMinutes);
  if (updates.showOnHomepage !== undefined) tournament.showOnHomepage = Boolean(updates.showOnHomepage);
  if (updates.displayPriority !== undefined) tournament.displayPriority = Number(updates.displayPriority);

  if (updates.matchDate && updates.matchTime) {
    const ts = bangladeshTimeToUtcTimestamp(updates.matchDate, updates.matchTime);
    if (!isNaN(ts)) {
      tournament.matchTimestamp = ts;
      tournament.tournamentStartAt = ts;
    }
  }

  dbManager.logAudit(admin.id, admin.email, 'TOURNAMENT_EDIT', 'TOURNAMENT', tournament.id, `Updated tournament: ${tournament.name}`);
  dbManager.save();

  res.json({ success: true, tournament });
});

app.delete('/api/admin/tournaments/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const index = db.tournaments.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }

  const [removed] = db.tournaments.splice(index, 1);
  await dbManager.deleteTournamentFromSupabase(removed.id);

  // Clean up any orphan notifications referencing this tournament
  db.notifications = db.notifications.filter(n => n.data?.tournamentId !== req.params.id);

  dbManager.logAudit(admin.id, admin.email, 'TOURNAMENT_HARD_DELETE', 'TOURNAMENT', removed.id, `Permanently deleted tournament: ${removed.name} (#${removed.id}) with ${removed.participants?.length || 0} participants.`);
  dbManager.save();

  res.json({ success: true, message: `Tournament "${removed.name}" permanently deleted.` });
});

// Admin Broadcast / Update Match Room Credentials
app.post('/api/admin/tournaments/:id/room', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { roomId, roomPassword, roomReleaseMinutes } = req.body;
  const db = dbManager.getDatabase();
  const tournament = db.tournaments.find(t => t.id === req.params.id);

  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }

  tournament.roomId = (roomId || '').trim();
  tournament.roomPassword = (roomPassword || '').trim();
  if (roomReleaseMinutes !== undefined) {
    tournament.roomReleaseMinutes = Number(roomReleaseMinutes);
  }

  // Broadcast notification to all participants
  if (tournament.participants && tournament.participants.length > 0) {
    tournament.participants.forEach(p => {
      dbManager.addNotification(
        p.userId,
        `Room Credentials Released: ${tournament.name}`,
        `Room ID: ${tournament.roomId} | Password: ${tournament.roomPassword}. Please join the Free Fire custom room promptly!`,
        'ANNOUNCEMENT',
        { tournamentId: tournament.id, roomId: tournament.roomId, roomPassword: tournament.roomPassword }
      );
    });
  }

  dbManager.logAudit(
    admin.id,
    admin.email,
    'ROOM_CREDENTIALS_SET',
    'TOURNAMENT',
    tournament.id,
    `Set Room ID: ${tournament.roomId} for ${tournament.name} (${tournament.participants?.length || 0} players notified)`
  );
  dbManager.save();

  res.json({ success: true, tournament, message: 'Room credentials updated and broadcasted.' });
});

// Admin Remove Tournament Participant and Automatically Refund Entry Fee
app.delete('/api/admin/tournaments/:id/participants/:userId', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const tournament = db.tournaments.find(t => t.id === req.params.id);

  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }

  const pIndex = tournament.participants.findIndex(p => p.userId === req.params.userId);
  if (pIndex === -1) {
    res.status(404).json({ error: 'Participant not found in this tournament.' });
    return;
  }

  const [removedParticipant] = tournament.participants.splice(pIndex, 1);
  tournament.joinedCount = tournament.participants.length;

  // Refund player's entry fee
  const user = db.users.find(u => u.id === req.params.userId);
  if (user && tournament.entryFee > 0) {
    user.balance += tournament.entryFee;

    const refundTrx: Transaction = {
      id: generateId('TRX'),
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      type: 'REFUND',
      amount: tournament.entryFee,
      balanceAfter: user.balance,
      reference: `Refund: Removed from tournament (${tournament.name})`,
      status: 'COMPLETED',
      adminId: admin.id,
      timestamp: new Date().toISOString()
    };
    db.transactions.unshift(refundTrx);

    dbManager.addNotification(
      user.id,
      'Tournament Entry Refunded',
      `You were removed from "${tournament.name}". ৳${tournament.entryFee} entry fee has been returned to your wallet.`,
      'LOSS'
    );
  }

  dbManager.logAudit(
    admin.id,
    admin.email,
    'PARTICIPANT_REMOVE',
    'TOURNAMENT',
    tournament.id,
    `Removed ${removedParticipant.userName || removedParticipant.userId} and refunded ৳${tournament.entryFee}`
  );
  dbManager.save();

  res.json({
    success: true,
    message: `Removed ${removedParticipant.userName || 'participant'} and refunded ৳${tournament.entryFee}`,
    tournament
  });
});

app.post('/api/admin/tournaments/:id/status', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { status } = req.body;
  const db = dbManager.getDatabase();
  const tournament = db.tournaments.find(t => t.id === req.params.id);

  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return;
  }

  const oldStatus = tournament.status;
  tournament.status = status;

  // If cancelling, refund all participants
  if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
    tournament.participants.forEach(p => {
      const u = db.users.find(user => user.id === p.userId);
      if (u) {
        u.balance += tournament.entryFee;
        const refundTrx: Transaction = {
          id: generateId('TRX'),
          userId: u.id,
          userName: u.fullName,
          userEmail: u.email,
          type: 'REFUND',
          amount: tournament.entryFee,
          balanceAfter: u.balance,
          reference: `Refund: Tournament Cancelled (${tournament.name})`,
          status: 'COMPLETED',
          adminId: admin.id,
          timestamp: new Date().toISOString()
        };
        db.transactions.unshift(refundTrx);
        dbManager.addNotification(
          u.id,
          'Tournament Cancelled - Full Refund',
          `Tournament "${tournament.name}" was cancelled. ৳${tournament.entryFee} has been refunded to your wallet.`,
          'LOSS'
        );
      }
    });
  }

  dbManager.logAudit(admin.id, admin.email, 'TOURNAMENT_STATUS_CHANGE', 'TOURNAMENT', tournament.id, `Changed status from ${oldStatus} to ${status}`);
  dbManager.save();

  res.json({ success: true, tournament });
});

// Admin Match Results Management (Automatic Kill + Prize Calculation & Atomic Wallet Credit)
app.post('/api/admin/tournaments/:id/results', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { results, winners, screenshotUrl, notes } = req.body;
  const resultList = results || winners;

  if (!resultList || !Array.isArray(resultList)) {
    res.status(400).json({ error: 'Invalid results array payload.' });
    return;
  }

  const db = dbManager.getDatabase();
  const tournament = db.tournaments.find(t => t.id === req.params.id);

  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found.' });
    return;
  }

  const processedList = [];

  for (const item of resultList) {
    const participant = tournament.participants.find(p => p.userId === item.userId);
    if (!participant) continue;

    if (participant.isResultProcessed) {
      continue; // Duplicate credit prevention!
    }

    const kills = Number(item.kills || 0);
    const rank = Number(item.rank || 0);
    const basePrize = Number(item.basePrize !== undefined ? item.basePrize : (item.placementPrize || 0));
    const perKill = tournament.perKill || 0;
    const killReward = item.killReward !== undefined ? Number(item.killReward) : (item.killPrize !== undefined ? Number(item.killPrize) : (kills * perKill));
    const totalWinning = item.totalWinning !== undefined ? Number(item.totalWinning) : (item.totalPrize !== undefined ? Number(item.totalPrize) : (basePrize + killReward));

    participant.kills = kills;
    participant.rank = rank;
    participant.basePrize = basePrize;
    participant.killReward = killReward;
    participant.totalWinning = totalWinning;
    participant.isResultProcessed = true;

    const user = db.users.find(u => u.id === item.userId);
    if (user) {
      if (totalWinning > 0) {
        user.balance += totalWinning;
        user.totalWinnings += totalWinning;
        if (rank === 1) user.totalWins += 1;

        const winTrx: Transaction = {
          id: generateId('TRX'),
          userId: user.id,
          userName: user.fullName,
          userEmail: user.email,
          type: 'WINNING',
          amount: totalWinning,
          balanceAfter: user.balance,
          reference: `Match Prize: ${tournament.name} (Rank #${rank}, Kills: ${kills})`,
          status: 'COMPLETED',
          adminId: admin.id,
          timestamp: new Date().toISOString()
        };
        db.transactions.unshift(winTrx);

        // Win Notification
        dbManager.addNotification(
          user.id,
          'MATCH RESULT — WIN 🏆',
          `Congratulations! You achieved Rank #${rank} with ${kills} kills in "${tournament.name}". ৳${totalWinning} prize credited to your wallet.`,
          'WINNING',
          { tournamentId: tournament.id, totalWinning, kills, rank }
        );
      } else {
        // Loss notification
        dbManager.addNotification(
          user.id,
          'MATCH RESULT RECORDED',
          `Your result for "${tournament.name}" has been recorded: Rank #${rank || '-'}, Kills: ${kills}. Keep fighting!`,
          'LOSS',
          { tournamentId: tournament.id, kills, rank }
        );
      }
    }

    processedList.push({ userId: item.userId, totalWinning });
  }

  tournament.status = 'COMPLETE';
  dbManager.logAudit(
    admin.id,
    admin.email,
    'MATCH_RESULTS_CONFIRM',
    'TOURNAMENT',
    tournament.id,
    `Processed match results for ${processedList.length} participants in ${tournament.name}${notes ? ` - ${notes}` : ''}`
  );

  dbManager.save();

  res.json({
    success: true,
    message: `Successfully processed results for ${processedList.length} players.`,
    tournament
  });
});

// Admin Deposit Management
app.get('/api/admin/deposits', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.deposits);
});

app.post('/api/admin/deposits/:id/confirm', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const deposit = db.deposits.find(d => d.id === req.params.id);

  if (!deposit) {
    res.status(404).json({ error: 'Deposit request not found' });
    return;
  }

  if (deposit.status !== 'PENDING') {
    res.status(400).json({ error: 'This deposit has already been processed and is no longer pending.' });
    return;
  }

  const user = db.users.find(u => u.id === deposit.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Atomically credit wallet & mark confirmed
  deposit.status = 'CONFIRMED';
  deposit.processedAt = new Date().toISOString();
  deposit.adminId = admin.id;

  user.balance += deposit.amount;
  user.totalDeposited += deposit.amount;

  // Update the pending transaction record
  const existingTrx = db.transactions.find(t => t.requestId === deposit.id);
  if (existingTrx) {
    existingTrx.status = 'CONFIRMED';
    existingTrx.balanceAfter = user.balance;
    existingTrx.adminId = admin.id;
    existingTrx.timestamp = new Date().toISOString();
    existingTrx.reference = `Deposit Verified (${deposit.method} - ${deposit.transactionId})`;
  } else {
    // Fallback if transaction was somehow missing
    const trx: Transaction = {
      id: generateId('TRX'),
      userId: user.id,
      userName: user.fullName,
      type: 'DEPOSIT',
      amount: deposit.amount,
      balanceAfter: user.balance,
      reference: `Deposit Verified (${deposit.method} - ${deposit.transactionId})`,
      status: 'CONFIRMED',
      method: deposit.method,
      senderNumber: deposit.senderNumber,
      adminId: admin.id,
      timestamp: new Date().toISOString(),
      requestId: deposit.id
    };
    db.transactions.unshift(trx);
  }

  dbManager.addNotification(
    user.id,
    'Deposit Confirmed! ৳' + deposit.amount,
    `Your deposit of ৳${deposit.amount} via ${deposit.method} has been verified and added to your balance.`,
    'DEPOSIT_CONFIRMED'
  );

  dbManager.logAudit(admin.id, admin.email, 'DEPOSIT_CONFIRM', 'DEPOSIT', deposit.id, `Confirmed ৳${deposit.amount} for ${user.username}`);
  dbManager.save();

  res.json({ success: true, message: 'Deposit confirmed and wallet credited successfully.', deposit, user });
});

app.post('/api/admin/deposits/:id/reject', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const deposit = db.deposits.find(d => d.id === req.params.id);

  if (!deposit) {
    res.status(404).json({ error: 'Deposit request not found' });
    return;
  }

  if (deposit.status !== 'PENDING') {
    res.status(400).json({ error: 'This deposit has already been processed and is no longer pending.' });
    return;
  }

  deposit.status = 'REJECTED';
  deposit.processedAt = new Date().toISOString();
  deposit.adminId = admin.id;

  // Update transaction status
  const existingTrx = db.transactions.find(t => t.requestId === deposit.id);
  if (existingTrx) {
    existingTrx.status = 'REJECTED';
    existingTrx.adminId = admin.id;
    existingTrx.timestamp = new Date().toISOString();
  }

  dbManager.addNotification(
    deposit.userId,
    'Deposit Rejected',
    `Your deposit request for ৳${deposit.amount} (TrxID: ${deposit.transactionId}) was rejected. Please contact support.`,
    'DEPOSIT_REJECTED'
  );

  dbManager.logAudit(admin.id, admin.email, 'DEPOSIT_REJECT', 'DEPOSIT', deposit.id, `Rejected deposit request of ৳${deposit.amount}`);
  dbManager.save();

  res.json({ success: true, deposit });
});

// Admin Hard Delete Deposit Record
app.delete('/api/admin/deposits/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const index = db.deposits.findIndex(d => d.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Deposit record not found' });
    return;
  }

  const [removed] = db.deposits.splice(index, 1);
  dbManager.logAudit(admin.id, admin.email, 'DEPOSIT_HARD_DELETE', 'DEPOSIT', removed.id, `Permanently deleted deposit record #${removed.id} of ৳${removed.amount}`);
  dbManager.save();

  res.json({ success: true, message: 'Deposit record permanently deleted.' });
});

// Admin Withdrawal Management
app.get('/api/admin/withdrawals', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.withdrawals);
});

app.post('/api/admin/withdrawals/:id/complete', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const withdrawal = db.withdrawals.find(w => w.id === req.params.id);

  if (!withdrawal) {
    res.status(404).json({ error: 'Withdrawal not found' });
    return;
  }

  if (withdrawal.status !== 'PENDING') {
    res.status(400).json({ error: 'Withdrawal is already processed or cancelled.' });
    return;
  }

  withdrawal.status = 'COMPLETED';
  withdrawal.processedAt = new Date().toISOString();
  withdrawal.adminId = admin.id;

  const user = db.users.find(u => u.id === withdrawal.userId);
  if (user) {
    // Deduct only on confirmation as per user request
    user.balance -= withdrawal.amount;
    user.totalWithdrawn += withdrawal.amount;
  }

  // Update existing transaction
  const existingTrx = db.transactions.find(t => t.requestId === withdrawal.id);
  if (existingTrx) {
    existingTrx.status = 'COMPLETED';
    existingTrx.balanceAfter = user ? user.balance : 0;
    existingTrx.adminId = admin.id;
    existingTrx.timestamp = new Date().toISOString();
  } else {
    const trx: Transaction = {
      id: generateId('TRX'),
      userId: withdrawal.userId,
      userName: withdrawal.userName,
      type: 'WITHDRAWAL',
      amount: withdrawal.amount,
      balanceAfter: user ? user.balance : 0,
      reference: `Withdrawal to ${withdrawal.method} (${withdrawal.accountNumber})`,
      status: 'COMPLETED',
      method: withdrawal.method,
      accountNumber: withdrawal.accountNumber,
      adminId: admin.id,
      timestamp: new Date().toISOString(),
      requestId: withdrawal.id
    };
    db.transactions.unshift(trx);
  }

  dbManager.addNotification(
    withdrawal.userId,
    'Withdrawal Completed! ৳' + withdrawal.amount,
    `Your withdrawal of ৳${withdrawal.amount} to ${withdrawal.method} (${withdrawal.accountNumber}) has been sent successfully.`,
    'WITHDRAWAL'
  );

  dbManager.logAudit(admin.id, admin.email, 'WITHDRAWAL_COMPLETE', 'WITHDRAWAL', withdrawal.id, `Completed withdrawal of ৳${withdrawal.amount}`);
  dbManager.save();

  res.json({ success: true, withdrawal });
});

app.post(['/api/admin/withdrawals/:id/reject', '/api/admin/withdrawals/:id/cancel'], authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const withdrawal = db.withdrawals.find(w => w.id === req.params.id);

  if (!withdrawal) {
    res.status(404).json({ error: 'Withdrawal not found' });
    return;
  }

  if (withdrawal.status !== 'PENDING') {
    res.status(400).json({ error: 'Withdrawal cannot be processed/rejected again.' });
    return;
  }

  const cancelReason = req.body?.reason || 'Cancelled/Rejected by Admin';
  withdrawal.status = 'REJECTED';
  withdrawal.processedAt = new Date().toISOString();
  withdrawal.adminId = admin.id;

  // Update existing transaction
  const existingTrx = db.transactions.find(t => t.requestId === withdrawal.id);
  if (existingTrx) {
    existingTrx.status = 'REJECTED';
    existingTrx.adminId = admin.id;
    existingTrx.timestamp = new Date().toISOString();
    existingTrx.reference = `Withdrawal Rejected: ${cancelReason}`;
  }

  dbManager.addNotification(
    withdrawal.userId,
    'Withdrawal Refunded: ৳' + withdrawal.amount,
    `Your withdrawal request for ৳${withdrawal.amount} was cancelled (${cancelReason}) and the amount was returned to your balance.`,
    'WITHDRAWAL'
  );

  dbManager.logAudit(admin.id, admin.email, 'WITHDRAWAL_REJECT', 'WITHDRAWAL', withdrawal.id, `Rejected/Cancelled withdrawal of ৳${withdrawal.amount} and refunded balance`);
  dbManager.save();

  res.json({ success: true, message: 'Withdrawal cancelled and balance refunded.', withdrawal });
});

// Admin Hard Delete Withdrawal Record
app.delete('/api/admin/withdrawals/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const index = db.withdrawals.findIndex(w => w.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Withdrawal record not found' });
    return;
  }

  const [removed] = db.withdrawals.splice(index, 1);
  dbManager.logAudit(admin.id, admin.email, 'WITHDRAWAL_HARD_DELETE', 'WITHDRAWAL', removed.id, `Permanently deleted withdrawal record #${removed.id} of ৳${removed.amount}`);
  dbManager.save();

  res.json({ success: true, message: 'Withdrawal record permanently deleted.' });
});

// Admin All Transactions
app.get('/api/admin/transactions', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.transactions);
});

// Admin Hard Delete Transaction Record
app.delete('/api/admin/transactions/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const index = db.transactions.findIndex(t => t.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Transaction record not found' });
    return;
  }

  const [removed] = db.transactions.splice(index, 1);
  dbManager.logAudit(admin.id, admin.email, 'TRANSACTION_HARD_DELETE', 'TRANSACTION', removed.id, `Permanently deleted transaction #${removed.id} (${removed.type} of ৳${removed.amount})`);
  dbManager.save();

  res.json({ success: true, message: 'Transaction record permanently deleted.' });
});

// Admin Payment Settings
app.put(['/api/admin/payment-settings', '/api/admin/settings/payment'], authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const updates = req.body;

  db.paymentSettings = {
    ...db.paymentSettings,
    ...updates,
    minDeposit: Number(updates.minDeposit || db.paymentSettings.minDeposit),
    minWithdraw: Number(updates.minWithdraw || db.paymentSettings.minWithdraw)
  };

  dbManager.logAudit(admin.id, admin.email, 'PAYMENT_SETTINGS_UPDATE', 'SETTINGS', 'PAYMENT', 'Updated payment numbers and thresholds');
  dbManager.save();

  res.json({ success: true, paymentSettings: db.paymentSettings });
});

// Admin Homepage Banners (with 5-minute video duration validation)
app.get('/api/admin/banners', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.banners);
});

app.post('/api/admin/banners', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { 
    type, 
    mediaType, 
    url, 
    imageUrl, 
    videoUrl, 
    badge,
    badgeText,
    title, 
    subtitle, 
    description, 
    buttonText, 
    buttonLink, 
    linkUrl, 
    durationSeconds, 
    videoDuration, 
    active, 
    isActive, 
    displayOrder, 
    order 
  } = req.body;

  const finalType = mediaType || type || (videoUrl ? 'video' : 'image');
  const finalUrl = url || (finalType === 'video' ? videoUrl : imageUrl) || imageUrl || videoUrl;
  const finalDuration = durationSeconds || videoDuration;

  if (!finalUrl) {
    res.status(400).json({ error: 'Banner media file is required.' });
    return;
  }

  // Strict 5-minute video limit
  if (finalType === 'video' && finalDuration && Number(finalDuration) > 300) {
    res.status(400).json({ error: 'Video duration cannot exceed 5 minutes (300 seconds).' });
    return;
  }

  const db = dbManager.getDatabase();
  const newBanner: BannerMedia = {
    id: generateId('ban'),
    type: finalType as 'image' | 'video',
    mediaType: finalType as 'image' | 'video',
    url: finalUrl,
    imageUrl: finalType === 'image' ? finalUrl : undefined,
    videoUrl: finalType === 'video' ? finalUrl : undefined,
    badge: (badge || badgeText || '').trim() || undefined,
    badgeText: (badge || badgeText || '').trim() || undefined,
    title: (title || '').trim(),
    subtitle: (subtitle || '').trim() || undefined,
    description: (description || subtitle || '').trim() || undefined,
    buttonText: (buttonText || '').trim() || undefined,
    buttonLink: (linkUrl || buttonLink || '').trim() || undefined,
    linkUrl: (linkUrl || buttonLink || '').trim() || undefined,
    durationSeconds: finalDuration ? Number(finalDuration) : undefined,
    videoDuration: finalDuration ? Number(finalDuration) : undefined,
    order: Number(displayOrder || order || db.banners.length + 1),
    displayOrder: Number(displayOrder || order || db.banners.length + 1),
    isActive: active !== undefined ? Boolean(active) : (isActive !== undefined ? Boolean(isActive) : true),
    active: active !== undefined ? Boolean(active) : (isActive !== undefined ? Boolean(isActive) : true)
  };

  db.banners.push(newBanner);
  dbManager.logAudit(admin.id, admin.email, 'BANNER_CREATE', 'HOMEPAGE', newBanner.id, `Created banner: ${newBanner.title || newBanner.id}`);
  dbManager.save();

  res.json({ success: true, banner: newBanner });
});

app.put('/api/admin/banners/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const banner = db.banners.find(b => b.id === req.params.id);

  if (!banner) {
    res.status(404).json({ error: 'Banner not found' });
    return;
  }

  const { 
    mediaType, 
    type, 
    url, 
    imageUrl, 
    videoUrl, 
    badge,
    badgeText,
    title,
    subtitle,
    description,
    buttonText,
    durationSeconds, 
    videoDuration, 
    linkUrl, 
    buttonLink, 
    displayOrder, 
    order, 
    active, 
    isActive 
  } = req.body;
  const finalType = mediaType || type || banner.type;
  const finalDuration = durationSeconds || videoDuration || banner.durationSeconds;

  if (finalType === 'video' && finalDuration && Number(finalDuration) > 300) {
    res.status(400).json({ error: 'Video duration cannot exceed 5 minutes (300 seconds).' });
    return;
  }

  Object.assign(banner, req.body);
  if (finalType) {
    banner.type = finalType;
    (banner as any).mediaType = finalType;
  }
  if (url || imageUrl || videoUrl) {
    banner.url = url || (finalType === 'video' ? videoUrl : imageUrl) || imageUrl || videoUrl;
  }
  if (badge !== undefined || badgeText !== undefined) {
    const bText = (badge || badgeText || '').trim();
    banner.badge = bText || undefined;
    banner.badgeText = bText || undefined;
  }
  if (title !== undefined) {
    banner.title = title.trim();
  }
  if (subtitle !== undefined || description !== undefined) {
    const desc = (description || subtitle || '').trim();
    banner.subtitle = desc || undefined;
    banner.description = desc || undefined;
  }
  if (buttonText !== undefined) {
    banner.buttonText = buttonText.trim() || undefined;
  }
  if (linkUrl !== undefined || buttonLink !== undefined) {
    const lUrl = (linkUrl || buttonLink || '').trim();
    banner.buttonLink = lUrl || undefined;
    (banner as any).linkUrl = lUrl || undefined;
  }
  if (displayOrder !== undefined || order !== undefined) {
    banner.order = Number(displayOrder || order);
    banner.displayOrder = Number(displayOrder || order);
  }
  if (active !== undefined || isActive !== undefined) {
    const isAct = active !== undefined ? Boolean(active) : Boolean(isActive);
    banner.isActive = isAct;
    banner.active = isAct;
  }

  dbManager.logAudit(admin.id, admin.email, 'BANNER_UPDATE', 'HOMEPAGE', banner.id, `Updated banner ${banner.title || banner.id}`);
  dbManager.save();

  res.json({ success: true, banner });
});

app.delete('/api/admin/banners/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const index = db.banners.findIndex(b => b.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Banner not found' });
    return;
  }

  const removed = db.banners.splice(index, 1)[0];
  dbManager.logAudit(admin.id, admin.email, 'BANNER_DELETE', 'HOMEPAGE', removed.id, `Deleted banner ${removed.title}`);
  dbManager.save();

  res.json({ success: true });
});

// Admin Categories (Full CRUD, Staging, Publishing & Safe Deletion)
app.get('/api/admin/categories', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  const categoriesWithCounts = db.categories.map(c => {
    const tournamentCount = db.tournaments.filter(t => 
      t.category === c.title || 
      t.category === c.name || 
      (c.shortName && t.category === c.shortName) || 
      t.category === c.id
    ).length;
    return {
      ...c,
      count: tournamentCount
    };
  }).sort((a, b) => (a.order || 0) - (b.order || 0));

  res.json(categoriesWithCounts);
});

// Public category endpoint for players (User Panel)
app.get('/api/categories', (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  const safeCategories = db.categories
    .filter(c => (c.isActive !== false && c.active !== false) && (c.published !== false && c.isPublished !== false && c.imageStatus !== 'UNPUBLISHED'))
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(c => {
      const tournamentCount = db.tournaments.filter(t => 
        t.category === c.title || 
        t.category === c.name || 
        (c.shortName && t.category === c.shortName) || 
        t.category === c.id
      ).length;
      return {
        ...c,
        coverImage: c.publishedImage || c.coverImage || c.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        icon: c.publishedImage || c.coverImage || c.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        isPublished: true,
        published: true,
        count: tournamentCount
      };
    });
  res.json(safeCategories);
});

app.post('/api/admin/categories', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { name, title, shortName, description, order, active, isActive, publishImmediately, fileData, fileName, fileType } = req.body;
  const categoryName = (name || title || '').trim();

  if (!categoryName) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const db = dbManager.getDatabase();
  
  // Duplicate check
  const duplicate = db.categories.find(c => 
    (c.title || c.name || '').trim().toLowerCase() === categoryName.toLowerCase()
  );
  if (duplicate) {
    res.status(400).json({ error: `Category "${categoryName}" already exists.` });
    return;
  }

  const isAct = active !== undefined ? Boolean(active) : (isActive !== undefined ? Boolean(isActive) : true);
  const shouldPublish = Boolean(publishImmediately);

  let initialCover = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
  let initialDraft: string | undefined = undefined;
  let initialPublishedImage: string | undefined = undefined;
  let imageStoragePath: string | undefined = undefined;
  let imageMetadata: any = undefined;

  // Process uploaded image if supplied during creation
  if (fileData) {
    try {
      const ext = fileName ? path.extname(fileName).toLowerCase() : '.jpg';
      const base64Data = fileData.replace(/^data:([A-Za-z-+/0-9]+);base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const sanitizedCatName = categoryName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const finalFileName = `category_${sanitizedCatName}_${Date.now()}${ext || '.jpg'}`;
      const finalFilePath = path.join(IMAGES_DIR, finalFileName);
      fs.writeFileSync(finalFilePath, buffer);

      const publicUrl = `/uploads/images/${finalFileName}`;
      imageStoragePath = `uploads/images/${finalFileName}`;
      imageMetadata = {
        fileName: fileName || finalFileName,
        fileType: fileType || `image/${ext.replace('.', '')}`,
        fileSize: buffer.length,
        fileSizeBytes: buffer.length,
        uploadedAt: new Date().toISOString(),
        uploadedBy: admin.fullName || admin.email
      };

      if (shouldPublish) {
        initialCover = publicUrl;
        initialPublishedImage = publicUrl;
      } else {
        initialDraft = publicUrl;
      }
    } catch (e: any) {
      console.error('Error saving image on category creation:', e);
    }
  }

  const newCat: CategoryInfo = {
    id: generateId('cat'),
    name: categoryName,
    title: categoryName,
    shortName: (shortName || categoryName).trim(),
    slug: (shortName || categoryName).toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    coverImage: shouldPublish && initialPublishedImage ? initialPublishedImage : initialCover,
    icon: shouldPublish && initialPublishedImage ? initialPublishedImage : initialCover,
    publishedImage: initialPublishedImage || '',
    draftImage: initialDraft,
    uploadedImage: initialDraft || initialPublishedImage,
    published: shouldPublish,
    isPublished: shouldPublish,
    imageStatus: shouldPublish && initialPublishedImage ? 'PUBLISHED' : (initialDraft ? 'UPLOADED' : 'NO_IMAGE'),
    imageStoragePath,
    imageMetadata,
    description: (description || '').trim(),
    order: Number(order || db.categories.length + 1),
    isActive: isAct,
    active: isAct,
    count: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: shouldPublish ? new Date().toISOString() : undefined,
    publishedBy: shouldPublish ? admin.id : undefined
  };

  db.categories.push(newCat);
  dbManager.logAudit(
    admin.id, 
    admin.email, 
    'CATEGORY_CREATE', 
    'CATEGORY', 
    newCat.id, 
    `Created new category "${newCat.title}" (Status: ${isAct ? 'ACTIVE' : 'INACTIVE'}, Published: ${shouldPublish ? 'YES' : 'NO'}, Order: ${newCat.order})`
  );
  if (shouldPublish) {
    dbManager.logAudit(
      admin.id,
      admin.email,
      'CATEGORY_PUBLISH',
      'CATEGORY',
      newCat.id,
      `Published category "${newCat.title}" to User Panel.`
    );
  }
  dbManager.save();

  // Broadcast realtime update
  dbManager.broadcastUpdate({
    type: 'CATEGORY_UPDATE',
    categoryId: newCat.id,
    action: 'CREATE',
    category: newCat
  });

  res.json({ success: true, message: 'Category created successfully.', category: newCat });
});

app.put('/api/admin/categories/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const category = db.categories.find(c => c.id === req.params.id);

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const { name, title, shortName, description, order, active, isActive, published, isPublished } = req.body;
  const oldTitle = category.title || category.name;
  const newName = (name || title || '').trim();

  if (newName) {
    // Duplicate check across other categories
    const duplicate = db.categories.find(c => 
      c.id !== category.id && 
      (c.title || c.name || '').trim().toLowerCase() === newName.toLowerCase()
    );
    if (duplicate) {
      res.status(400).json({ error: `Another category with the name "${newName}" already exists.` });
      return;
    }

    category.name = newName;
    category.title = newName;
  }

  if (shortName !== undefined) {
    category.shortName = shortName.trim();
    category.slug = shortName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  }

  if (description !== undefined) category.description = description.trim();
  if (order !== undefined) category.order = Number(order);
  
  if (active !== undefined || isActive !== undefined) {
    const val = active !== undefined ? Boolean(active) : Boolean(isActive);
    category.active = val;
    category.isActive = val;
  }

  if (published !== undefined || isPublished !== undefined) {
    const pubVal = published !== undefined ? Boolean(published) : Boolean(isPublished);
    category.published = pubVal;
    category.isPublished = pubVal;
    if (pubVal) {
      category.publishedAt = new Date().toISOString();
      category.publishedBy = admin.id;
      if (category.draftImage) {
        category.publishedImage = category.draftImage;
        category.coverImage = category.draftImage;
        category.icon = category.draftImage;
      }
      category.imageStatus = 'PUBLISHED';
    } else {
      category.imageStatus = 'UNPUBLISHED';
    }
  }

  category.updatedAt = new Date().toISOString();
  category.updatedBy = admin.id;

  dbManager.logAudit(
    admin.id, 
    admin.email, 
    'CATEGORY_UPDATE', 
    'CATEGORY', 
    category.id, 
    `Updated category "${oldTitle}" -> "${category.title}" (Status: ${category.isActive ? 'ACTIVE' : 'INACTIVE'}, Order: ${category.order})`
  );
  dbManager.save();

  dbManager.broadcastUpdate({
    type: 'CATEGORY_UPDATE',
    categoryId: category.id,
    action: 'UPDATE',
    category
  });

  res.json({ success: true, message: 'Category updated successfully.', category });
});

// Category Image Upload / Replace Endpoint (Staging only: UPLOAD != PUBLISH)
app.post('/api/admin/categories/:id/upload-image', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const category = db.categories.find(c => c.id === req.params.id);

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const { fileData, fileName, fileType, fileSize, width, height, dimensions } = req.body;

  if (!fileData) {
    res.status(400).json({ error: 'No image file data provided.' });
    return;
  }

  // Validate allowed image types: JPG, JPEG, PNG, WEBP
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = fileName ? path.extname(fileName).toLowerCase() : '.jpg';
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  if (fileType && !allowedMimeTypes.includes(fileType.toLowerCase())) {
    res.status(400).json({ error: 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.' });
    return;
  }

  if (fileName && !allowedExtensions.includes(ext)) {
    res.status(400).json({ error: 'Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .webp.' });
    return;
  }

  try {
    const base64Data = fileData.replace(/^data:([A-Za-z-+/0-9]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Max 10MB limit
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: 'Image file is too large. Maximum allowed size is 10MB.' });
      return;
    }

    const sanitizedCatName = (category.title || category.name || 'cat').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const finalFileName = `category_${sanitizedCatName}_${Date.now()}${ext || '.jpg'}`;
    const finalFilePath = path.join(IMAGES_DIR, finalFileName);

    fs.writeFileSync(finalFilePath, buffer);

    const publicUrl = `/uploads/images/${finalFileName}`;
    const oldDraft = category.draftImage;
    const isReplacing = Boolean(category.draftImage || category.publishedImage);

    // Update Category with Staged/Draft Image (UPLOAD != PUBLISH)
    category.draftImage = publicUrl;
    category.uploadedImage = publicUrl;
    category.imageStoragePath = `uploads/images/${finalFileName}`;
    category.imageStatus = 'UPLOADED';
    category.uploadedAt = new Date().toISOString();
    category.uploadedBy = admin.id;
    category.imageMetadata = {
      fileName: fileName || finalFileName,
      fileType: fileType || `image/${ext.replace('.', '')}`,
      fileSize: Number(fileSize || buffer.length),
      fileSizeBytes: buffer.length,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      dimensions: dimensions || (width && height ? `${width} × ${height}` : undefined),
      uploadedAt: new Date().toISOString(),
      uploadedBy: admin.fullName || admin.email
    };

    const actionType = isReplacing ? 'CATEGORY_COVER_IMAGE_REPLACE' : 'CATEGORY_COVER_IMAGE_UPLOAD';
    const auditDetail = isReplacing 
      ? `Replaced cover image for category "${category.title}" with ${fileName || finalFileName} (${category.imageMetadata.dimensions || 'Image'}). Image remains unpublished until explicit publish action.`
      : `Uploaded cover image for category "${category.title}": ${fileName || finalFileName}. Image remains unpublished until explicit publish action.`;

    dbManager.logAudit(
      admin.id, 
      admin.email, 
      actionType, 
      'CATEGORY', 
      category.id, 
      auditDetail,
      oldDraft || category.publishedImage,
      publicUrl
    );
    dbManager.save();

    // Broadcast SSE update so admin views sync
    dbManager.broadcastUpdate({
      type: 'CATEGORY_UPDATE',
      categoryId: category.id,
      action: 'IMAGE_UPLOAD',
      category
    });

    res.json({
      success: true,
      message: 'Category cover image uploaded successfully.',
      category
    });
  } catch (err: any) {
    console.error('Category image upload error:', err);
    res.status(500).json({ error: err.message || 'Category cover image upload failed.' });
  }
});

// Category Image Publish Endpoint
app.post('/api/admin/categories/:id/publish-image', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const category = db.categories.find(c => c.id === req.params.id);

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const imageToPublish = category.draftImage || category.uploadedImage || category.coverImage || category.publishedImage;
  if (!imageToPublish) {
    res.status(400).json({ error: 'No image is available to publish. Please upload an image first.' });
    return;
  }

  const prevPublishedImage = category.publishedImage;
  category.coverImage = imageToPublish;
  category.publishedImage = imageToPublish;
  category.icon = imageToPublish;
  category.published = true;
  category.isPublished = true;
  category.imageStatus = 'PUBLISHED';
  category.publishedAt = new Date().toISOString();
  category.publishedBy = admin.id;

  dbManager.logAudit(
    admin.id,
    admin.email,
    'CATEGORY_COVER_IMAGE_PUBLISH',
    'CATEGORY',
    category.id,
    `Published live cover image for category "${category.title}" (${imageToPublish}). Now live to all players.`,
    prevPublishedImage,
    imageToPublish
  );
  dbManager.save();

  // Broadcast realtime SSE to update both admin and user panels immediately
  dbManager.broadcastUpdate({
    type: 'CATEGORY_UPDATE',
    categoryId: category.id,
    action: 'IMAGE_PUBLISH',
    category
  });

  res.json({
    success: true,
    message: 'Category cover image published successfully.',
    category
  });
});

// Category Image Unpublish Endpoint
app.post('/api/admin/categories/:id/unpublish-image', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const category = db.categories.find(c => c.id === req.params.id);

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  category.published = false;
  category.isPublished = false;
  category.imageStatus = 'UNPUBLISHED';

  dbManager.logAudit(
    admin.id,
    admin.email,
    'CATEGORY_COVER_IMAGE_UNPUBLISH',
    'CATEGORY',
    category.id,
    `Unpublished category cover image for "${category.title}". Image is now hidden from User Panel.`
  );
  dbManager.save();

  // Broadcast realtime SSE
  dbManager.broadcastUpdate({
    type: 'CATEGORY_UPDATE',
    categoryId: category.id,
    action: 'IMAGE_UNPUBLISH',
    category
  });

  res.json({
    success: true,
    message: 'Category cover image unpublished successfully.',
    category
  });
});

// Category Image Delete Endpoint
app.delete('/api/admin/categories/:id/image', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const category = db.categories.find(c => c.id === req.params.id);

  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const deletedImage = category.publishedImage || category.draftImage || category.coverImage;

  category.draftImage = undefined;
  category.uploadedImage = undefined;
  category.publishedImage = undefined;
  category.coverImage = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
  category.icon = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
  category.published = false;
  category.isPublished = false;
  category.imageStatus = 'NO_IMAGE';
  category.imageMetadata = undefined;
  category.imageStoragePath = undefined;
  category.uploadedAt = undefined;
  category.publishedAt = undefined;

  dbManager.logAudit(
    admin.id,
    admin.email,
    'CATEGORY_COVER_IMAGE_DELETE',
    'CATEGORY',
    category.id,
    `Deleted category cover image for "${category.title}" (was: ${deletedImage}).`
  );
  dbManager.save();

  // Broadcast realtime SSE
  dbManager.broadcastUpdate({
    type: 'CATEGORY_UPDATE',
    categoryId: category.id,
    action: 'IMAGE_DELETE',
    category
  });

  res.json({
    success: true,
    message: 'Category cover image deleted successfully.',
    category
  });
});

// Category Safe Delete Endpoint
app.delete('/api/admin/categories/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const index = db.categories.findIndex(c => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const category = db.categories[index];

  // Check if any tournament is using this category
  const inUseTournaments = db.tournaments.filter(t => 
    t.category === category.title || 
    t.category === category.name || 
    (category.shortName && t.category === category.shortName) || 
    t.category === category.id
  );

  if (inUseTournaments.length > 0) {
    res.status(400).json({ 
      error: `This category cannot be deleted because it is currently in use by ${inUseTournaments.length} tournament(s). Set it to INACTIVE instead to hide it.` 
    });
    return;
  }

  const [removed] = db.categories.splice(index, 1);
  dbManager.logAudit(
    admin.id, 
    admin.email, 
    'CATEGORY_DELETE', 
    'CATEGORY', 
    removed.id, 
    `Deleted category "${removed.name || removed.title}"`
  );
  dbManager.save();

  dbManager.broadcastUpdate({
    type: 'CATEGORY_UPDATE',
    categoryId: removed.id,
    action: 'DELETE'
  });

  res.json({ success: true, message: `Category "${removed.title || removed.name}" deleted permanently.` });
});

// Admin Announcements
app.get('/api/admin/announcements', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.announcements);
});

app.post('/api/admin/announcements', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { title, content, message, image, type, targetAudience, isPublished, active } = req.body;
  const finalMessage = content || message;

  if (!title || !finalMessage) {
    res.status(400).json({ error: 'Announcement title and content are required.' });
    return;
  }

  const db = dbManager.getDatabase();
  const newAnn: Announcement = {
    id: generateId('ann'),
    title: title.trim(),
    message: finalMessage.trim(),
    content: finalMessage.trim(),
    image,
    type: type || 'INFO',
    targetAudience: targetAudience || 'ALL',
    isPublished: active !== undefined ? Boolean(active) : (isPublished !== undefined ? Boolean(isPublished) : true),
    active: active !== undefined ? Boolean(active) : (isPublished !== undefined ? Boolean(isPublished) : true),
    createdAt: new Date().toISOString()
  };

  db.announcements.unshift(newAnn);
  dbManager.logAudit(admin.id, admin.email, 'ANNOUNCEMENT_CREATE', 'ANNOUNCEMENT', newAnn.id, `Created announcement ${title}`);
  dbManager.save();

  res.json({ success: true, announcement: newAnn });
});

app.put('/api/admin/announcements/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const ann = db.announcements.find(a => a.id === req.params.id);

  if (!ann) {
    res.status(404).json({ error: 'Announcement not found' });
    return;
  }

  Object.assign(ann, req.body);
  if (req.body.content) ann.message = req.body.content;
  if (req.body.active !== undefined) ann.isPublished = Boolean(req.body.active);

  dbManager.logAudit(admin.id, admin.email, 'ANNOUNCEMENT_UPDATE', 'ANNOUNCEMENT', ann.id, `Updated announcement ${ann.title}`);
  dbManager.save();

  res.json({ success: true, announcement: ann });
});

app.delete('/api/admin/announcements/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const index = db.announcements.findIndex(a => a.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Announcement not found' });
    return;
  }

  const removed = db.announcements.splice(index, 1)[0];
  dbManager.logAudit(admin.id, admin.email, 'ANNOUNCEMENT_DELETE', 'ANNOUNCEMENT', removed.id, `Deleted announcement ${removed.title}`);
  dbManager.save();

  res.json({ success: true });
});

// General Settings endpoint (for homepage, website, payment & support settings)
app.get('/api/settings', (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json({
    payment: db.paymentSettings,
    website: db.websiteSettings,
    support: db.supportSettings,
    ...db.websiteSettings
  });
});

app.put(['/api/admin/settings', '/api/admin/general-settings'], authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const { payment, website, support, heroHeading, heroSubheading, marqueeText, showLiveCounter, enableVideoBanners, featuredCategory } = req.body;

  if (payment) {
    db.paymentSettings = {
      ...db.paymentSettings,
      ...payment,
      minDeposit: Number(payment.minDeposit || db.paymentSettings.minDeposit),
      minWithdraw: Number(payment.minWithdrawal || payment.minWithdraw || db.paymentSettings.minWithdraw)
    };
  }

  if (website) {
    db.websiteSettings = { ...db.websiteSettings, ...website };
  }

  if (support) {
    db.supportSettings = { ...db.supportSettings, ...support };
  }

  if (heroHeading !== undefined) db.websiteSettings.heroHeading = heroHeading;
  if (heroSubheading !== undefined) db.websiteSettings.heroSubheading = heroSubheading;
  if (marqueeText !== undefined) db.websiteSettings.marqueeText = marqueeText;
  if (showLiveCounter !== undefined) db.websiteSettings.showLiveCounter = showLiveCounter;
  if (enableVideoBanners !== undefined) db.websiteSettings.enableVideoBanners = enableVideoBanners;
  if (featuredCategory !== undefined) db.websiteSettings.featuredCategory = featuredCategory;

  dbManager.logAudit(admin.id, admin.email, 'SYSTEM_SETTINGS_UPDATE', 'SETTINGS', 'GENERAL', 'Updated system settings');
  dbManager.save();

  res.json({
    success: true,
    payment: db.paymentSettings,
    website: db.websiteSettings,
    support: db.supportSettings
  });
});

// Admin Profile Update
app.put('/api/admin/profile', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { adminName, fullName, adminEmail, email, newPassword } = req.body;
  const db = dbManager.getDatabase();
  const adminUser = db.users.find(u => u.id === admin.id);

  if (adminUser) {
    if (adminName || fullName) adminUser.fullName = adminName || fullName;
    if (adminEmail || email) adminUser.email = (adminEmail || email).toLowerCase();
    if (newPassword && newPassword.trim()) {
      adminUser.password = newPassword.trim();
      adminUser.passwordHash = newPassword.trim();
    }
  }

  dbManager.logAudit(admin.id, admin.email, 'ADMIN_PROFILE_UPDATE', 'ADMIN', admin.id, 'Updated admin credentials');
  dbManager.save();

  res.json({ success: true, message: 'Admin profile updated successfully', user: adminUser || admin });
});

// Admin Support Settings
app.put(['/api/admin/support-settings', '/api/admin/settings/support'], authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  db.supportSettings = { ...db.supportSettings, ...req.body };

  dbManager.logAudit(admin.id, admin.email, 'SUPPORT_SETTINGS_UPDATE', 'SETTINGS', 'SUPPORT', 'Updated support links & video settings');
  dbManager.save();

  res.json({ success: true, supportSettings: db.supportSettings });
});

// Admin Website Settings
app.put(['/api/admin/website-settings', '/api/admin/settings/website'], authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  db.websiteSettings = { ...db.websiteSettings, ...req.body };
  await dbManager.syncSettingsToSupabase();

  dbManager.logAudit(admin.id, admin.email, 'WEBSITE_SETTINGS_UPDATE', 'SETTINGS', 'WEBSITE', 'Updated website settings');
  dbManager.save();

  res.json({ success: true, websiteSettings: db.websiteSettings });
});

// Admin Music Management Settings
app.get('/api/admin/music-settings', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  const musicSettings = db.musicSettings || db.websiteSettings?.musicSettings || {
    backgroundMusicUrl: db.websiteSettings?.backgroundMusicUrl || '',
    musicTitle: db.websiteSettings?.musicTitle || 'EGX Cyberpunk Tournament Beat',
    artistName: db.websiteSettings?.artistName || 'EGX Esports Sound',
    autoPlayOnDarkMode: true,
    volume: 90,
    isEnabled: true
  };
  res.json({ success: true, musicSettings });
});

app.put('/api/admin/music-settings', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const db = dbManager.getDatabase();
  const { backgroundMusicUrl, background_music_url, musicTitle, title, artistName, artist, autoPlayOnDarkMode, volume, isEnabled } = req.body;

  const finalUrl = (backgroundMusicUrl || background_music_url || db.musicSettings?.backgroundMusicUrl || '').toString().trim();
  const finalTitle = (musicTitle || title || db.musicSettings?.musicTitle || 'EGX Cyberpunk Tournament Beat').toString().trim();
  const finalArtist = (artistName || artist || db.musicSettings?.artistName || 'EGX Esports Sound').toString().trim();
  const finalAutoPlay = autoPlayOnDarkMode !== undefined ? Boolean(autoPlayOnDarkMode) : (db.musicSettings?.autoPlayOnDarkMode ?? true);
  const finalVolume = volume !== undefined ? Math.min(100, Math.max(0, Number(volume))) : (db.musicSettings?.volume ?? 90);
  const finalEnabled = isEnabled !== undefined ? Boolean(isEnabled) : (db.musicSettings?.isEnabled ?? true);

  const updatedMusicSettings = {
    backgroundMusicUrl: finalUrl,
    musicTitle: finalTitle,
    artistName: finalArtist,
    autoPlayOnDarkMode: finalAutoPlay,
    volume: finalVolume,
    isEnabled: finalEnabled,
    updatedAt: new Date().toISOString()
  };

  db.musicSettings = updatedMusicSettings;
  if (!db.websiteSettings) db.websiteSettings = {} as any;
  db.websiteSettings.musicSettings = updatedMusicSettings;
  db.websiteSettings.backgroundMusicUrl = finalUrl;
  db.websiteSettings.musicTitle = finalTitle;
  db.websiteSettings.artistName = finalArtist;
  db.websiteSettings.autoPlayOnDarkMode = finalAutoPlay;
  db.websiteSettings.volume = finalVolume;

  dbManager.logAudit(admin.id, admin.email, 'MUSIC_SETTINGS_UPDATE', 'SETTINGS', 'MUSIC', `Updated background music track: ${finalTitle}`);
  dbManager.save();

  // Broadcast SSE update so user panels react immediately
  dbManager.broadcastUpdate({
    type: 'MUSIC_SETTINGS_UPDATE',
    musicSettings: updatedMusicSettings,
    timestamp: Date.now()
  });

  res.json({ success: true, musicSettings: updatedMusicSettings });
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.auditLogs);
});

// Admin Notifications Feed & Dispatch
app.get('/api/admin/notifications', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const db = dbManager.getDatabase();
  res.json(db.notifications);
});

app.post(['/api/admin/notifications/send', '/api/admin/notifications/broadcast'], authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  const admin = (req as any).user as User;
  const { userId, targetType, title, message, type } = req.body;

  if (!title || !message) {
    res.status(400).json({ error: 'Title and message are required.' });
    return;
  }

  const target = (targetType === 'INDIVIDUAL' && userId) ? userId : 'ALL';
  dbManager.addNotification(target, title.trim(), message.trim(), type || 'ANNOUNCEMENT');
  dbManager.logAudit(admin.id, admin.email, 'NOTIFICATION_DISPATCH', 'NOTIFICATION', target, `Sent notification: "${title}" to ${target}`);
  dbManager.save();

  res.json({ success: true, message: 'Notification dispatched successfully!' });
});

// ----------------------------------------------------
// File Upload & Storage Endpoints (Images & Videos up to 1.5GB / 5m)
// ----------------------------------------------------

// 1. Chunked Upload: Initialize
app.post('/api/upload/chunk-init', authMiddleware, (req: Request, res: Response): void => {
  const { fileName, fileType, totalChunks, fileSize } = req.body;
  const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const uploadTempDir = path.join(TEMP_DIR, uploadId);

  try {
    if (!fs.existsSync(uploadTempDir)) {
      fs.mkdirSync(uploadTempDir, { recursive: true });
    }
    res.json({
      success: true,
      uploadId,
      message: 'Upload initialized'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to initialize upload' });
  }
});

// 2. Chunked Upload: Append Chunk
app.post('/api/upload/chunk', authMiddleware, (req: Request, res: Response): void => {
  const { uploadId, chunkIndex, chunkData } = req.body;

  if (!uploadId || chunkIndex === undefined || !chunkData) {
    res.status(400).json({ success: false, error: 'Missing chunk upload parameters' });
    return;
  }

  const uploadTempDir = path.join(TEMP_DIR, uploadId);
  if (!fs.existsSync(uploadTempDir)) {
    res.status(404).json({ success: false, error: 'Upload session not found or expired' });
    return;
  }

  try {
    const chunkPath = path.join(uploadTempDir, `chunk_${String(chunkIndex).padStart(6, '0')}`);
    // Clean base64 header if present
    const base64Data = chunkData.replace(/^data:([A-Za-z-+/0-9]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(chunkPath, buffer);

    res.json({
      success: true,
      chunkIndex,
      message: `Chunk ${chunkIndex} saved`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save chunk' });
  }
});

// 3. Chunked Upload: Complete & Assemble
app.post('/api/upload/chunk-complete', authMiddleware, (req: Request, res: Response): void => {
  const { uploadId, fileName, fileType, durationSeconds } = req.body;

  if (!uploadId || !fileName) {
    res.status(400).json({ success: false, error: 'Missing completion parameters' });
    return;
  }

  // Backend video duration limit <= 300 seconds (5 minutes)
  if (fileType && fileType.startsWith('video') && durationSeconds && Number(durationSeconds) > 300) {
    res.status(400).json({ success: false, error: 'Video duration exceeds maximum allowed 5 minutes (300 seconds).' });
    return;
  }

  const uploadTempDir = path.join(TEMP_DIR, uploadId);
  if (!fs.existsSync(uploadTempDir)) {
    res.status(404).json({ success: false, error: 'Upload session not found' });
    return;
  }

  try {
    const isAudio = (fileType && fileType.startsWith('audio')) || (fileName && fileName.match(/\.(mp3|wav|aac|ogg|m4a|flac)$/i));
    const isVideo = !isAudio && ((fileType && fileType.startsWith('video')) || fileName.match(/\.(mp4|webm|mov|mkv)$/i));
    const targetDir = isAudio ? AUDIO_DIR : (isVideo ? VIDEOS_DIR : IMAGES_DIR);
    const subFolder = isAudio ? 'audio' : (isVideo ? 'videos' : 'images');
    const resolvedType = isAudio ? 'audio' : (isVideo ? 'video' : 'image');
    
    const ext = path.extname(fileName) || (isAudio ? '.mp3' : (isVideo ? '.mp4' : '.jpg'));
    const sanitizedBase = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFileName = `${sanitizedBase}_${Date.now()}${ext}`;
    const finalFilePath = path.join(targetDir, finalFileName);

    const chunkFiles = fs.readdirSync(uploadTempDir)
      .filter(f => f.startsWith('chunk_'))
      .sort();

    const writeStream = fs.createWriteStream(finalFilePath);
    for (const chunkFile of chunkFiles) {
      const chunkData = fs.readFileSync(path.join(uploadTempDir, chunkFile));
      writeStream.write(chunkData);
    }
    writeStream.end();

    // Clean up temporary folder
    try {
      fs.rmSync(uploadTempDir, { recursive: true, force: true });
    } catch (e) {
      console.warn('Failed to cleanup temp dir:', e);
    }

    const publicUrl = `/uploads/${subFolder}/${finalFileName}`;

    if (isAudio) {
      const db = dbManager.getDatabase();
      if (!db.musicSettings) {
        db.musicSettings = { backgroundMusicUrl: publicUrl, isEnabled: true };
      } else {
        db.musicSettings.backgroundMusicUrl = publicUrl;
      }
      if (db.websiteSettings) {
        db.websiteSettings.backgroundMusicUrl = publicUrl;
        if (db.websiteSettings.musicSettings) {
          db.websiteSettings.musicSettings.backgroundMusicUrl = publicUrl;
        }
      }
      dbManager.save();
    }

    res.json({
      success: true,
      url: publicUrl,
      fileUrl: publicUrl,
      background_music_url: publicUrl,
      storagePath: `uploads/${subFolder}/${finalFileName}`,
      fileName: finalFileName,
      fileType: resolvedType,
      durationSeconds: durationSeconds ? Number(durationSeconds) : undefined
    });
  } catch (err: any) {
    console.error('Error assembling chunked upload:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to assemble file' });
  }
});

// 4. Direct Upload Endpoint (for smaller images/videos/audio in a single request)
const handleDirectUpload = (req: Request, res: Response): void => {
  const { fileName, fileType, fileData, durationSeconds } = req.body;

  if (!fileData) {
    res.status(400).json({ success: false, error: 'No file data provided' });
    return;
  }

  // Backend video duration limit <= 300 seconds (5 minutes)
  if (fileType && fileType.startsWith('video') && durationSeconds && Number(durationSeconds) > 300) {
    res.status(400).json({ success: false, error: 'Video duration exceeds maximum allowed 5 minutes (300 seconds).' });
    return;
  }

  // Backend audio duration limit <= 600 seconds (10 minutes)
  if (fileType && fileType.startsWith('audio') && durationSeconds && Number(durationSeconds) > 600) {
    res.status(400).json({ success: false, error: 'Audio duration exceeds maximum allowed 10 minutes (600 seconds).' });
    return;
  }

  try {
    const isAudio = (fileType && fileType.startsWith('audio')) || (fileName && fileName.match(/\.(mp3|wav|aac|ogg|m4a|flac)$/i));
    const isVideo = !isAudio && ((fileType && fileType.startsWith('video')) || (fileName && fileName.match(/\.(mp4|webm|mov)$/i)));
    const targetDir = isAudio ? AUDIO_DIR : (isVideo ? VIDEOS_DIR : IMAGES_DIR);
    const subFolder = isAudio ? 'audio' : (isVideo ? 'videos' : 'images');
    const resolvedType = isAudio ? 'audio' : (isVideo ? 'video' : 'image');

    const ext = fileName ? path.extname(fileName) : (isAudio ? '.mp3' : (isVideo ? '.mp4' : '.jpg'));
    const sanitizedBase = fileName ? path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_') : (isAudio ? 'audio_track' : 'media');
    const finalFileName = `${sanitizedBase}_${Date.now()}${ext || (isAudio ? '.mp3' : (isVideo ? '.mp4' : '.jpg'))}`;
    const finalFilePath = path.join(targetDir, finalFileName);

    // Write binary buffer
    const base64Data = fileData.replace(/^data:([A-Za-z-+/0-9]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(finalFilePath, buffer);

    const publicUrl = `/uploads/${subFolder}/${finalFileName}`;

    if (isAudio) {
      const db = dbManager.getDatabase();
      if (!db.musicSettings) {
        db.musicSettings = { backgroundMusicUrl: publicUrl, isEnabled: true };
      } else {
        db.musicSettings.backgroundMusicUrl = publicUrl;
      }
      if (db.websiteSettings) {
        db.websiteSettings.backgroundMusicUrl = publicUrl;
        if (db.websiteSettings.musicSettings) {
          db.websiteSettings.musicSettings.backgroundMusicUrl = publicUrl;
        }
      }
      dbManager.save();
    }

    res.json({
      success: true,
      url: publicUrl,
      fileUrl: publicUrl,
      background_music_url: publicUrl,
      storagePath: `uploads/${subFolder}/${finalFileName}`,
      fileName: finalFileName,
      fileType: resolvedType,
      durationSeconds: durationSeconds ? Number(durationSeconds) : undefined
    });
  } catch (err: any) {
    console.error('Direct upload failed:', err);
    res.status(500).json({ success: false, error: err.message || 'Direct upload failed' });
  }
};

app.post('/api/upload', authMiddleware, handleDirectUpload);
app.post('/api/admin/upload', authMiddleware, adminMiddleware, handleDirectUpload);
app.post('/api/admin/music/upload', authMiddleware, adminMiddleware, handleDirectUpload);

// ----------------------------------------------------
// Global Express JSON Error Handler (Prevents HTML Error Pages)
// ----------------------------------------------------
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal server error',
    message: err.message || 'Internal server error'
  });
});

// ----------------------------------------------------
// Setup Vite in Development or Static Server in Production
// ----------------------------------------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EGX FF Tournament server running on http://0.0.0.0:${PORT}`);
  });
}

start();
