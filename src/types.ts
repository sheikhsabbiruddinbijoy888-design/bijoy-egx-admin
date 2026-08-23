export type Role = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string; // e.g. "EGX343157"
  fullName: string;
  username?: string;
  email: string;
  password?: string;
  passwordHash?: string;
  mobile?: string;
  mobileNumber?: string;
  freeFireUid: string;
  freeFireIgn?: string;
  whatsapp?: string;
  whatsappNumber?: string;
  messenger?: string;
  balance: number;
  winningBalance?: number;
  totalDeposited?: number;
  totalWinnings?: number;
  totalEntryFees?: number;
  totalWithdrawn?: number;
  totalMatches?: number;
  totalMatchesPlayed?: number;
  totalWins?: number;
  totalKills?: number;
  role: Role;
  status: UserStatus;
  isVerified?: boolean;
  profileImage?: string;
  avatar_url?: string;
  verificationStatus?: 'VERIFIED' | 'UNVERIFIED';
  verifiedAt?: string;
  createdAt: string;
}

export type TournamentCategory = 
  | 'Solo' 
  | 'Duo' 
  | 'Classic Squad' 
  | '2v2 Lone Wolf' 
  | 'BR Match';

export type TournamentStatus = 
  | 'COMING SOON' 
  | 'WAITING' 
  | 'LIVE'
  | 'LIVE MATCH' 
  | 'COMPLETE' 
  | 'CLOSED'
  | 'CANCELLED';

export interface Participant {
  userId: string;
  username?: string;
  userName?: string;
  fullName?: string;
  freeFireUid?: string;
  userUid?: string;
  freeFireIgn?: string;
  inGameName?: string;
  email?: string;
  mobile?: string;
  entryFee?: number;
  joinedAt: string;
  slotNumber: number;
  // Match results fields
  kills?: number;
  rank?: number;
  basePrize?: number;
  killReward?: number;
  totalWinning?: number;
  isResultProcessed?: boolean;
}

export interface MatchResultEntry {
  userId: string;
  userName?: string;
  userUid?: string;
  kills: number;
  rank: number;
  basePrize: number;
  killReward: number;
  totalWinning: number;
}

export interface ParticipantResult extends MatchResultEntry {}

export interface Tournament {
  id: string; // e.g. "EGX2608195736"
  name: string;
  category: TournamentCategory;
  game: string; // 'Free Fire'
  map: string; // 'Bermuda', 'Purgatory', 'Kalahari', 'Alpine', 'NexTerra'
  coverImage: string;
  entryFee: number;
  prizePool: number;
  perKill: number;
  winnerPrize?: number;
  secondPrize?: number;
  thirdPrize?: number;
  fourthPrize?: number;
  fifthPrize?: number;
  totalSlots: number;
  joinedCount: number;
  participants: Participant[];
  matchResults?: MatchResultEntry[];
  isResultProcessed?: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  registrationStartAt?: number;
  registrationEndAt?: number;
  matchDate: string; // e.g. "2026-08-22"
  matchTime: string; // e.g. "08:00 PM"
  matchTimestamp: number;
  tournamentStartAt?: number;
  rules?: string;
  roomId?: string;
  roomPassword?: string;
  roomReleaseMinutes?: number; // e.g. 2, 5, 0 (minutes before start time)
  roomReleaseTimestamp?: number;
  status: TournamentStatus;
  isFeatured?: boolean;
  showOnHomepage?: boolean; // Admin explicit toggle to show on homepage filter
  displayPriority?: number; // 1 = top priority, 2, 3, etc.
  createdAt: string;
}

export type TransactionType = 
  | 'DEPOSIT' 
  | 'TOURNAMENT_ENTRY' 
  | 'WINNING' 
  | 'WITHDRAWAL' 
  | 'REFUND' 
  | 'ADMIN_BONUS' 
  | 'ADMIN_ADJUSTMENT';

export type TransactionStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'REJECTED' 
  | 'CANCELLED'
  | 'PROCESSING';

export interface Transaction {
  id: string; // e.g. "TRX893241"
  userId: string;
  userEmail?: string;
  userName?: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  reference: string;
  status: TransactionStatus;
  method?: 'bKash' | 'Nagad' | 'Rocket';
  senderNumber?: string;
  accountNumber?: string;
  adminId?: string;
  requestId?: string; // Links to DEP or WDR request ID
  createdAt?: string;
  timestamp?: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  method: 'bKash' | 'Nagad' | 'Rocket';
  amount: number;
  senderNumber: string;
  trxId?: string;
  transactionId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  processedAt?: string;
  adminId?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  method: 'bKash' | 'Nagad' | 'Rocket';
  accountNumber: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  processedAt?: string;
  adminId?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  content?: string;
  type?: 'INFO' | 'WARNING' | 'ALERT' | 'EVENT' | string;
  image?: string;
  targetAudience?: 'ALL' | 'USERS' | 'SELECTED' | 'PARTICIPANTS';
  isPublished?: boolean;
  active?: boolean;
  createdAt: string;
}

export type NotificationType = 
  | 'DEPOSIT_CONFIRMED' 
  | 'DEPOSIT_REJECTED' 
  | 'WITHDRAWAL' 
  | 'TOURNAMENT_JOINED' 
  | 'MATCH_STARTING' 
  | 'ROOM_AVAILABLE' 
  | 'WINNING' 
  | 'LOSS' 
  | 'BONUS' 
  | 'ANNOUNCEMENT' 
  | 'ADMIN_ALERT';

export interface Notification {
  id: string;
  userId: string; // Specific userId or 'ALL' or 'ADMIN'
  title: string;
  message: string;
  type?: NotificationType;
  isRead?: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export type CategoryImageStatus = 'PUBLISHED' | 'UNPUBLISHED' | 'UPLOADED' | 'NO_IMAGE';

export interface CategoryImageMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  dimensions?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface CategoryInfo {
  id: string;
  title: string;
  name?: string;
  shortName?: string;
  slug?: string;
  description: string;
  image?: string;
  coverImage?: string;
  icon?: string;
  publishedImage?: string;
  draftImage?: string;
  uploadedImage?: string;
  published?: boolean;
  isPublished?: boolean;
  imageStatus?: CategoryImageStatus;
  imageStoragePath?: string;
  imageMetadata?: CategoryImageMetadata;
  uploadedAt?: string;
  publishedAt?: string;
  uploadedBy?: string;
  publishedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  count?: number;
  isActive: boolean;
  active?: boolean;
  order: number;
}

export interface Category extends CategoryInfo {
  // Alias for backward compatibility
}

export interface Banner {
  id: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  mediaType?: 'image' | 'video';
  imageUrl?: string;
  videoUrl?: string;
  videoDuration?: number;
  linkUrl?: string;
  buttonText?: string;
  active?: boolean;
  displayOrder?: number;
}

export interface PaymentSettings {
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  minDeposit: number;
  minWithdrawal?: number;
  minWithdraw?: number;
}

export interface SupportSettings {
  supportTutorialVideo?: string;
  supportVideoUrl?: string;
  supportVideoType?: 'embed' | 'video';
  supportWhatsApp?: string;
  whatsappNumber?: string;
  whatsappLink?: string;
  supportTelegram?: string;
  telegramUsername?: string;
  telegramLink?: string;
  isEnabled?: boolean;
}

export interface MusicSettings {
  backgroundMusicUrl: string;
  musicTitle?: string;
  artistName?: string;
  autoPlayOnDarkMode?: boolean;
  volume?: number; // 0 - 100
  isEnabled?: boolean;
  updatedAt?: string;
}

export interface WebsiteSettings {
  siteName?: string;
  siteLogo?: string;
  websiteName?: string;
  logo?: string;
  favicon?: string;
  supportEmail?: string;
  contactInfo?: string;
  terms?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
  heroHeading?: string;
  heroSubheading?: string;
  marqueeText?: string;
  showLiveCounter?: boolean;
  enableVideoBanners?: boolean;
  featuredCategory?: string;
  backgroundMusicUrl?: string;
  musicTitle?: string;
  artistName?: string;
  autoPlayOnDarkMode?: boolean;
  volume?: number;
  musicSettings?: MusicSettings;
}

export interface BannerMedia {
  id: string;
  badge?: string;
  badgeText?: string;
  type: 'image' | 'video';
  mediaType?: 'image' | 'video';
  url: string;
  imageUrl?: string;
  videoUrl?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  linkUrl?: string;
  durationSeconds?: number;
  videoDuration?: number;
  order: number;
  displayOrder?: number;
  isActive: boolean;
  active?: boolean;
}

export interface AuditLog {
  id: string;
  adminId?: string;
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  oldValue?: string;
  newValue?: string;
  details?: any;
  createdAt?: string;
  timestamp?: string;
  ip?: string;
}

export interface UserSession {
  token: string;
  userId: string;
  role: Role;
  createdAt: string;
}

export interface UserLoginEvent {
  id: string;
  userId: string;
  fullName: string;
  username: string;
  email: string;
  mobile: string;
  freeFireUid: string;
  freeFireIgn: string;
  timestamp: number;
}

export interface AppDatabase {
  users: User[];
  tournaments: Tournament[];
  transactions: Transaction[];
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
  announcements: Announcement[];
  notifications: Notification[];
  categories: CategoryInfo[];
  banners: BannerMedia[];
  sessions?: UserSession[];
  userLogins?: UserLoginEvent[];
  settings?: {
    siteName: string;
    siteLogo: string;
    supportWhatsApp: string;
    supportTelegram: string;
    supportTutorialVideo: string;
    paymentMethods: {
      bkashNumber: string;
      nagadNumber: string;
      rocketNumber: string;
      minDeposit: number;
      minWithdrawal: number;
    };
  };
  paymentSettings?: PaymentSettings;
  supportSettings?: SupportSettings;
  websiteSettings?: WebsiteSettings;
  musicSettings?: MusicSettings;
  auditLogs: AuditLog[];
}
