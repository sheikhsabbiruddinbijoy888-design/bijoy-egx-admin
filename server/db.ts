import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';
import { 
  AppDatabase, 
  User, 
  Tournament, 
  Transaction, 
  DepositRequest, 
  WithdrawalRequest, 
  Announcement, 
  Notification, 
  CategoryInfo, 
  BannerMedia, 
  PaymentSettings, 
  SupportSettings, 
  WebsiteSettings, 
  MusicSettings,
  AuditLog,
  UserLoginEvent,
  Participant
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial high-quality seed data
const initialCategories: CategoryInfo[] = [
  {
    id: 'cat-solo',
    title: 'Solo',
    name: 'Solo',
    description: '1v1 Battle Royale showdown. Show individual mastery and aim.',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    publishedImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    published: true,
    isPublished: true,
    imageStatus: 'PUBLISHED',
    count: 3,
    isActive: true,
    active: true,
    order: 1
  },
  {
    id: 'cat-duo',
    title: 'Duo',
    name: 'Duo',
    description: 'Pair up with your teammate to conquer Bermuda and Kalahari.',
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    publishedImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    icon: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    published: true,
    isPublished: true,
    imageStatus: 'PUBLISHED',
    count: 2,
    isActive: true,
    active: true,
    order: 2
  },
  {
    id: 'cat-squad',
    title: 'Classic Squad',
    name: 'Classic Squad',
    description: '4v4 Full squad competitive tournament. Dominate the battleground.',
    coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    publishedImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    icon: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    published: true,
    isPublished: true,
    imageStatus: 'PUBLISHED',
    count: 4,
    isActive: true,
    active: true,
    order: 3
  },
  {
    id: 'cat-lonewolf',
    title: '2v2 Lone Wolf',
    name: '2v2 Lone Wolf',
    description: 'Fast-paced Iron Cage 2v2 tactical rounds. Best of 9 rounds.',
    coverImage: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80',
    publishedImage: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80',
    icon: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80',
    published: true,
    isPublished: true,
    imageStatus: 'PUBLISHED',
    count: 2,
    isActive: true,
    active: true,
    order: 4
  },
  {
    id: 'cat-br',
    title: 'BR Match',
    name: 'BR Match',
    description: 'Massive 48-player Battle Royale with huge prize pools and kill bounties.',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    publishedImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    icon: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    published: true,
    isPublished: true,
    imageStatus: 'PUBLISHED',
    count: 3,
    isActive: true,
    active: true,
    order: 5
  }
];

const now = Date.now();

const initialTournaments: Tournament[] = [
  {
    id: 'EGX2608195736',
    name: 'Solo Prime Clash | Mobile',
    category: 'Solo',
    game: 'Free Fire',
    map: 'Bermuda',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    entryFee: 20,
    prizePool: 500,
    perKill: 10,
    winnerPrize: 250,
    secondPrize: 150,
    thirdPrize: 100,
    fourthPrize: 0,
    fifthPrize: 0,
    totalSlots: 48,
    joinedCount: 14,
    participants: [
      {
        userId: 'EGX10001',
        username: 'shakib_ff',
        fullName: 'Shakib Khan',
        freeFireUid: '189283749',
        freeFireIgn: '⚡SHAKIB_OP⚡',
        inGameName: '⚡SHAKIB_OP⚡',
        email: 'shakib@test.com',
        mobile: '01812345678',
        entryFee: 20,
        joinedAt: new Date(now - 3600000).toISOString(),
        slotNumber: 1
      },
      {
        userId: 'EGX10002',
        username: 'tariq_sniper',
        fullName: 'Tariq Islam',
        freeFireUid: '298374615',
        freeFireIgn: 'TARIQ_AWM',
        inGameName: 'TARIQ_AWM',
        email: 'tariq@test.com',
        mobile: '01712345678',
        entryFee: 20,
        joinedAt: new Date(now - 3200000).toISOString(),
        slotNumber: 2
      }
    ],
    registrationStart: new Date(now - 86400000).toISOString(),
    registrationEnd: new Date(now + 7200000).toISOString(),
    matchDate: '2026-08-22',
    matchTime: '08:30 PM',
    matchTimestamp: now + 3600000 * 2, // 2 hours in future
    tournamentStartAt: now + 3600000 * 2,
    rules: '1. Emulators strictly forbidden (Mobile only).\n2. No hacking, scripts, or config files.\n3. Gun skin attributes are OFF.\n4. Character skills are allowed.\n5. Screenshot required at end of match for verification.',
    roomId: '7829104',
    roomPassword: 'EGX99',
    roomReleaseMinutes: 2,
    status: 'COMING SOON',
    isFeatured: true,
    showOnHomepage: true,
    displayPriority: 1,
    createdAt: new Date(now - 86400000).toISOString()
  },
  {
    id: 'EGX2608159814',
    name: 'Duo Prime Clash | Duo Masters',
    category: 'Duo',
    game: 'Free Fire',
    map: 'Purgatory',
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    entryFee: 30,
    prizePool: 800,
    perKill: 12,
    winnerPrize: 450,
    secondPrize: 230,
    thirdPrize: 120,
    fourthPrize: 0,
    fifthPrize: 0,
    totalSlots: 24,
    joinedCount: 8,
    participants: [],
    registrationStart: new Date(now - 86400000).toISOString(),
    registrationEnd: new Date(now + 14400000).toISOString(),
    matchDate: '2026-08-22',
    matchTime: '09:45 PM',
    matchTimestamp: now + 3600000 * 4,
    tournamentStartAt: now + 3600000 * 4,
    rules: '1. Both duo partners must register.\n2. Flare guns & UAV allowed.\n3. Gun skins off.',
    roomId: '8392101',
    roomPassword: 'DUO55',
    roomReleaseMinutes: 5,
    status: 'COMING SOON',
    isFeatured: true,
    showOnHomepage: false,
    displayPriority: 1,
    createdAt: new Date(now - 86400000).toISOString()
  },
  {
    id: 'EGX2608195251',
    name: 'Classic Squad Championship #42',
    category: 'Classic Squad',
    game: 'Free Fire',
    map: 'Kalahari',
    coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80',
    entryFee: 40,
    prizePool: 1200,
    perKill: 15,
    winnerPrize: 650,
    secondPrize: 350,
    thirdPrize: 200,
    fourthPrize: 0,
    fifthPrize: 0,
    totalSlots: 12,
    joinedCount: 5,
    participants: [],
    registrationStart: new Date(now - 86400000).toISOString(),
    registrationEnd: new Date(now + 21600000).toISOString(),
    matchDate: '2026-08-22',
    matchTime: '10:30 PM',
    matchTimestamp: now + 3600000 * 6,
    tournamentStartAt: now + 3600000 * 6,
    rules: '1. 4 Players per squad.\n2. No grenadier spam.\n3. Character skill allowed.',
    roomId: '9920194',
    roomPassword: 'SQUAD1',
    roomReleaseMinutes: 5,
    status: 'COMING SOON',
    isFeatured: false,
    showOnHomepage: true,
    displayPriority: 1,
    createdAt: new Date(now - 86400000).toISOString()
  },
  {
    id: 'EGX2608195111',
    name: '2v2 Lone Wolf Blitz',
    category: '2v2 Lone Wolf',
    game: 'Free Fire',
    map: 'Iron Cage',
    coverImage: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=800&q=80',
    entryFee: 25,
    prizePool: 600,
    perKill: 10,
    winnerPrize: 350,
    secondPrize: 180,
    thirdPrize: 70,
    fourthPrize: 0,
    fifthPrize: 0,
    totalSlots: 8,
    joinedCount: 4,
    participants: [],
    registrationStart: new Date(now - 43200000).toISOString(),
    registrationEnd: new Date(now + 10800000).toISOString(),
    matchDate: '2026-08-22',
    matchTime: '07:15 PM',
    matchTimestamp: now + 3600000 * 1.5,
    tournamentStartAt: now + 3600000 * 1.5,
    rules: '1. First to 9 rounds.\n2. Weapon round picking alternating.\n3. Mobile only.',
    roomId: '6620188',
    roomPassword: 'LONE22',
    roomReleaseMinutes: 2,
    status: 'COMING SOON',
    isFeatured: false,
    showOnHomepage: false,
    displayPriority: 1,
    createdAt: new Date(now - 43200000).toISOString()
  },
  {
    id: 'EGX2608195999',
    name: 'Mega BR Bermuda 48 Grand Match',
    category: 'BR Match',
    game: 'Free Fire',
    map: 'Bermuda Remastered',
    coverImage: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    entryFee: 50,
    prizePool: 2000,
    perKill: 25,
    winnerPrize: 1000,
    secondPrize: 500,
    thirdPrize: 300,
    fourthPrize: 100,
    fifthPrize: 100,
    totalSlots: 48,
    joinedCount: 22,
    participants: [],
    registrationStart: new Date(now - 86400000).toISOString(),
    registrationEnd: new Date(now + 28800000).toISOString(),
    matchDate: '2026-08-23',
    matchTime: '09:00 PM',
    matchTimestamp: now + 3600000 * 12,
    tournamentStartAt: now + 3600000 * 12,
    rules: '1. Standard eSports competitive rules.\n2. Highest kill bonus awarded directly to winner.\n3. Live streamed on YouTube.',
    roomId: '1102934',
    roomPassword: 'BR999',
    roomReleaseMinutes: 5,
    status: 'COMING SOON',
    isFeatured: true,
    showOnHomepage: true,
    displayPriority: 1,
    createdAt: new Date(now - 86400000).toISOString()
  }
];

const initialUsers: User[] = [
  {
    id: 'EGX343157',
    fullName: 'EGX Master Admin',
    username: 'egxadmin',
    email: 'joyshakib689@gmail.com',
    password: '##sheikh##bijoy##',
    passwordHash: '##sheikh##bijoy##',
    mobile: '01778999965',
    freeFireUid: '109837465',
    freeFireIgn: 'EGX_MASTER',
    whatsapp: '880177899965',
    messenger: 'https://m.me/egxfftournament',
    balance: 1000,
    totalDeposited: 1000,
    totalWinnings: 1200,
    totalEntryFees: 200,
    totalWithdrawn: 1500,
    totalMatches: 8,
    totalWins: 4,
    role: 'ADMIN',
    status: 'ACTIVE',
    isVerified: true,
    verificationStatus: 'VERIFIED',
    verifiedAt: new Date(now - 86400000 * 30).toISOString(),
    createdAt: new Date(now - 86400000 * 30).toISOString()
  },
  {
    id: 'EGX892011',
    fullName: 'Rakib Hassan',
    username: 'rakib_gamer',
    email: 'player@test.com',
    mobile: '01912345678',
    freeFireUid: '984729183',
    freeFireIgn: 'RAKIB_VIP',
    whatsapp: '8801912345678',
    balance: 100,
    totalDeposited: 200,
    totalWinnings: 150,
    totalEntryFees: 60,
    totalWithdrawn: 190,
    totalMatches: 3,
    totalWins: 1,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(now - 86400000 * 5).toISOString()
  }
];

const initialBanners: BannerMedia[] = [
  {
    id: 'banner-1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80',
    title: 'Free Fire Tournament',
    description: 'Play · Join · Win — new matches every day',
    buttonText: 'Tournaments',
    buttonLink: '/tournaments',
    order: 1,
    isActive: true
  },
  {
    id: 'banner-2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1400&q=80',
    title: 'Duo Masters Championship',
    description: 'Win up to ৳2000 daily with per-kill bounties',
    buttonText: 'Join Duo',
    buttonLink: '/tournaments?category=Duo',
    order: 2,
    isActive: true
  }
];

const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'WELCOME TO EGX FF TOURNAMENT',
    message: 'Welcome all Free Fire players of Bangladesh! Instant bKash/Nagad deposit & withdrawal with automated match prize distribution.',
    targetAudience: 'ALL',
    isPublished: true,
    createdAt: new Date(now - 86400000).toISOString()
  }
];

const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'ALL',
    title: 'New Daily Solo Tournament Added',
    message: 'Solo Prime Clash starting tonight at 08:30 PM with ৳500 prize pool.',
    type: 'ANNOUNCEMENT',
    isRead: false,
    createdAt: new Date(now - 3600000).toISOString()
  }
];

const initialPaymentSettings: PaymentSettings = {
  bkashNumber: '01778999965',
  nagadNumber: '01778999965',
  rocketNumber: '01778999965',
  minDeposit: 20,
  minWithdraw: 50
};

const initialSupportSettings: SupportSettings = {
  supportVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  supportVideoType: 'embed',
  whatsappNumber: '880177899965',
  whatsappLink: 'https://wa.me/880177899965',
  telegramUsername: 'egxffofficial',
  telegramLink: 'https://t.me/egxffofficial',
  isEnabled: true
};

const initialWebsiteSettings: WebsiteSettings = {
  websiteName: 'EGX FF Tournament',
  logo: '/logo.png',
  favicon: '/favicon.ico',
  supportEmail: 'joyshakib689@gmail.com',
  contactInfo: '+880177899965',
  terms: '1. All matches must be played on mobile devices.\n2. Hacks, scripts, or macro users will be permanently banned with wallet forfeiture.\n3. Tournament results are verified before winning disbursement.',
  privacyPolicy: 'We protect user data and process deposits/withdrawals securely.',
  refundPolicy: 'If a match is cancelled by EGX FF administration, full entry fees are automatically refunded to your wallet balance.'
};

const initialMusicSettings: MusicSettings = {
  backgroundMusicUrl: '/uploads/audio/default_tournament_beat.mp3',
  musicTitle: 'EGX Cyberpunk Tournament Beat',
  artistName: 'EGX Esports Sound',
  autoPlayOnDarkMode: true,
  volume: 90,
  isEnabled: true,
  updatedAt: new Date(now - 86400000).toISOString()
};

const initialTransactions: Transaction[] = [
  {
    id: 'TRX100918',
    userId: 'EGX343157',
    userName: 'EGX Admin',
    type: 'DEPOSIT',
    amount: 500,
    balanceAfter: 500,
    reference: 'Admin Initial Balance',
    status: 'CONFIRMED',
    method: 'bKash',
    senderNumber: '01778999965',
    timestamp: new Date(now - 86400000 * 2).toISOString()
  }
];

function getInitialDatabase(): AppDatabase {
  return {
    users: initialUsers,
    tournaments: initialTournaments,
    transactions: initialTransactions,
    deposits: [],
    withdrawals: [],
    announcements: initialAnnouncements,
    notifications: initialNotifications,
    categories: initialCategories,
    banners: initialBanners,
    paymentSettings: initialPaymentSettings,
    supportSettings: initialSupportSettings,
    websiteSettings: initialWebsiteSettings,
    musicSettings: initialMusicSettings,
    userLogins: [],
    auditLogs: [
      {
        id: 'audit-1',
        adminId: 'EGX343157',
        adminEmail: 'joyshakib689@gmail.com',
        action: 'SYSTEM_BOOTSTRAP',
        targetType: 'SYSTEM',
        targetId: 'ALL',
        details: 'EGX FF Tournament platform initialized successfully.',
        timestamp: new Date(now - 86400000).toISOString()
      }
    ]
  };
}

class DatabaseManager {
  private db: AppDatabase;
  private sseClients: any[] = [];

  constructor() {
    this.db = this.load();
  }

  private load(): AppDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const initial = getInitialDatabase();
        const merged = {
          ...initial,
          ...parsed,
          sessions: parsed.sessions || [],
          userLogins: parsed.userLogins || []
        };
        this.ensureMasterAdmin(merged);
        return merged;
      }
    } catch (e) {
      console.error('Error reading database file:', e);
    }
    const initial = getInitialDatabase();
    this.ensureMasterAdmin(initial);
    this.saveDirect(initial);
    return initial;
  }

  public ensureMasterAdmin(db: AppDatabase): void {
    if (!db || !Array.isArray(db.users)) return;
    const adminEmail = 'joyshakib689@gmail.com';
    const adminPass = '##sheikh##bijoy##';

    let admin = db.users.find(u => u.email && u.email.toLowerCase() === adminEmail.toLowerCase());
    if (!admin) {
      admin = {
        id: 'EGX343157',
        fullName: 'EGX Master Admin',
        username: 'egxadmin',
        email: adminEmail,
        password: adminPass,
        passwordHash: adminPass,
        mobile: '01778999965',
        freeFireUid: '109837465',
        freeFireIgn: 'EGX_MASTER',
        balance: 1000,
        totalDeposited: 1000,
        totalWinnings: 1200,
        totalEntryFees: 200,
        totalWithdrawn: 1500,
        totalMatches: 8,
        totalWins: 4,
        role: 'ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        verificationStatus: 'VERIFIED',
        createdAt: new Date().toISOString()
      };
      db.users.unshift(admin);
    }
  }

  private saveDirect(data: AppDatabase) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  public save() {
    this.saveDirect(this.db);
    this.broadcastUpdate({ type: 'DATABASE_SYNC', timestamp: Date.now() });
  }

  public getDatabase(): AppDatabase {
    return this.db;
  }

  public addSseClient(res: any) {
    this.sseClients.push(res);
  }

  public removeSseClient(res: any) {
    this.sseClients = this.sseClients.filter(client => client !== res);
  }

  public broadcastUpdate(payload: any) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    this.sseClients.forEach(client => {
      try { client.write(data); } catch (err) {}
    });
  }

  public logAudit(adminId: string, adminEmail: string, action: string, targetType: string, targetId: string, details: string, oldValue?: string, newValue?: string) {
    const log: AuditLog = {
      id: 'audit-' + Date.now(),
      adminId, adminEmail, action, targetType, targetId, details,
      oldValue,
      newValue,
      timestamp: new Date().toISOString()
    };
    this.db.auditLogs.unshift(log);
    this.save();
  }

  public addNotification(userId: string, title: string, message: string, type: Notification['type'] = 'ANNOUNCEMENT', data?: any) {
    const notification: Notification = {
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId,
      title,
      message,
      type,
      data,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.db.notifications.unshift(notification);
    this.save();
    this.broadcastUpdate({ type: 'NEW_NOTIFICATION', notification });
    return notification;
  }

  public async syncUserToSupabase(user: User) {
    try {
      await supabase
        .from('profiles')
        .upsert([{
          id: user.id.length === 36 ? user.id : undefined, // Only use if it's a valid UUID
          email: user.email,
          username: user.username,
          full_name: user.fullName,
          phone_number: user.mobile || user.mobileNumber,
          gaming_name: user.freeFireIgn,
          free_fire_uid: user.freeFireUid,
          wallet_balance: user.balance || 0,
          total_deposit: user.totalDeposited || 0,
          total_withdraw: user.totalWithdrawn || 0,
          total_matches: user.totalMatches || 0,
          total_kills: user.totalKills || 0,
          total_winnings: user.totalWinnings || 0,
          role: user.role?.toLowerCase() || 'user',
          created_at: user.createdAt
        }], { onConflict: 'email' });
    } catch (e) {
      console.error('Supabase Profile Sync Error:', e);
    }
  }

  public async syncTournamentToSupabase(tournament: Tournament) {
    try {
      await supabase
        .from('tournaments')
        .upsert([{
          id: tournament.id.length === 36 ? tournament.id : undefined, // Map if it's a UUID
          title: tournament.name,
          subtitle: `${tournament.game} | ${tournament.map}`,
          category: tournament.category,
          entry_fee: tournament.entryFee,
          per_kill_reward: tournament.perKill,
          total_prize_pool: tournament.prizePool,
          banner_url: tournament.coverImage,
          match_time: new Date(tournament.matchTimestamp).toISOString(),
          room_code: tournament.roomId,
          room_password: tournament.roomPassword,
          status: tournament.status?.toLowerCase() || 'upcoming',
          is_featured: tournament.isFeatured
        }]);
    } catch (e) {
      console.error('Supabase Tournament Sync Error:', e);
    }
  }

  public async deleteTournamentFromSupabase(tournamentId: string) {
    try {
      // If tournament ID is not a UUID, we need to match by other fields or use a custom ID column
      // For now we try to match by title if ID is not a UUID
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .or(`id.eq.${tournamentId},title.eq.${tournamentId}`); 
      
      if (error) console.error('Supabase Tournament Delete Error:', error.message);
    } catch (e) {
      console.error('Supabase Tournament Delete Failed:', e);
    }
  }

  public async syncTransactionToSupabase(tx: Transaction) {
    try {
      await supabase
        .from('transactions')
        .insert([{
          type: tx.type.toLowerCase(),
          amount: tx.amount,
          payment_method: tx.method,
          transaction_id: tx.id,
          sender_phone: tx.senderNumber,
          status: tx.status.toLowerCase(),
          created_at: tx.timestamp
        }]);
    } catch (e) {
      console.error('Supabase Transaction Sync Error:', e);
    }
  }

  public async syncSettingsToSupabase() {
    try {
      const settings = [
        { key: 'payment_settings', value: this.db.paymentSettings },
        { key: 'website_settings', value: this.db.websiteSettings },
        { key: 'support_settings', value: this.db.supportSettings },
        { key: 'music_settings', value: this.db.musicSettings }
      ];

      for (const setting of settings) {
        await supabase
          .from('system_settings')
          .upsert([setting]);
      }
    } catch (e) {
      console.error('Supabase Settings Sync Error:', e);
    }
  }

  public async addUserLogin(event: Omit<UserLoginEvent, 'id'>) {
    const newEvent: UserLoginEvent = {
      ...event,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    };
    this.db.userLogins.unshift(newEvent);
    if (this.db.userLogins.length > 1000) this.db.userLogins = this.db.userLogins.slice(0, 1000);
    this.save();

    // Sync to Supabase
    try {
      await supabase
        .from('user_logins')
        .insert([{
          user_id: event.userId,
          full_name: event.fullName,
          username: event.username,
          email: event.email,
          mobile: event.mobile,
          free_fire_uid: event.freeFireUid,
          free_fire_ign: event.freeFireIgn,
          login_at: new Date(event.timestamp).toISOString()
        }]);
    } catch (e) {
      console.error('Supabase Sync Error:', e);
    }
  }

  public saveSession(token: string, userId: string, role: any) {
    if (!this.db.sessions) this.db.sessions = [];
    this.db.sessions.push({ token, userId, role, createdAt: new Date().toISOString() });
    this.save();
  }

  public getSession(token: string) {
    return this.db.sessions?.find(s => s.token === token);
  }
}

export const dbManager = new DatabaseManager();
