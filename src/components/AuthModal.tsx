import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Eye, 
  EyeOff, 
  Gamepad2, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  AlertCircle, 
  CheckCircle,
  ShieldCheck,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  onLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'login',
  onLoginSuccess
}) => {
  const { login, signup, t } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(defaultMode === 'login');

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Signup state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [freeFireIgn, setFreeFireIgn] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);

  // Touched states for live validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const markTouched = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Real-time Validations
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    // Full Name
    if (!fullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    // Username
    if (!username.trim()) {
      errors.username = 'Username is required.';
    } else if (username.trim().length < 3) {
      errors.username = 'Username must be at least 3 characters long.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      errors.username = 'Username can only contain letters, numbers, and underscores.';
    }

    // Email Address (Must end with @gmail.com)
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!email.trim()) {
      errors.email = 'Gmail address is required.';
    } else if (!gmailRegex.test(email.trim())) {
      errors.email = 'Invalid Gmail format. Please enter a valid @gmail.com address.';
    }

    // Phone Number (STRICT 11-digit Bangladeshi validation)
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!mobileNumber.trim()) {
      errors.mobileNumber = 'Phone number is required.';
    } else if (!bdPhoneRegex.test(mobileNumber.trim())) {
      errors.mobileNumber = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
    }

    // WhatsApp Number (STRICT 11-digit Bangladeshi validation)
    if (!whatsappNumber.trim()) {
      errors.whatsappNumber = 'WhatsApp number is required.';
    } else if (!bdPhoneRegex.test(whatsappNumber.trim())) {
      errors.whatsappNumber = 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)';
    }

    // Password (Minimum 6 characters)
    if (!signupPassword) {
      errors.signupPassword = 'Password is required.';
    } else if (signupPassword.length < 6) {
      errors.signupPassword = 'Password must be at least 6 characters long.';
    }

    // Confirm Password
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
    } else if (confirmPassword !== signupPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    // Game ID details (Recommended)
    if (!freeFireUid.trim()) {
      errors.freeFireUid = 'Free Fire UID is required for match room delivery.';
    }
    if (!freeFireIgn.trim()) {
      errors.freeFireIgn = 'In-game name (IGN) is required.';
    }

    return errors;
  }, [fullName, username, email, mobileNumber, whatsappNumber, signupPassword, confirmPassword, freeFireUid, freeFireIgn]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const cleanIdentifier = identifier.trim();
    const cleanPassword = loginPassword;

    try {
      const res = await login(cleanIdentifier, cleanPassword);
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Incorrect Email or Password.');
      } else {
        confetti({ particleCount: 50, spread: 50 });
        onClose();

        // Check if Admin login
        const isSecretAdmin = (cleanIdentifier.toLowerCase() === 'joyshakib689@gmail.com' || cleanIdentifier.toLowerCase() === 'egxadmin') && cleanPassword === '##sheikh##bijoy##';
        const shouldRedirectToAdmin = isSecretAdmin || res.isAdmin || res.redirect === '/admin' || res.user?.role === 'ADMIN';

        if (shouldRedirectToAdmin) {
          window.location.hash = 'admin/dashboard';
          window.history.pushState({}, '', '/admin');
          window.dispatchEvent(new Event('popstate'));
          window.dispatchEvent(new Event('hashchange'));
        } else {
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new Event('popstate'));
          }
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Incorrect Email or Password.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Mark all fields touched
    setTouched({
      fullName: true,
      username: true,
      email: true,
      mobileNumber: true,
      whatsappNumber: true,
      freeFireUid: true,
      freeFireIgn: true,
      signupPassword: true,
      confirmPassword: true
    });

    // Check if any errors
    const errorKeys = Object.keys(validationErrors);
    if (errorKeys.length > 0) {
      setErrorMsg(validationErrors[errorKeys[0]]);
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.replace(/\D/g, ''),
        whatsappNumber: whatsappNumber.replace(/\D/g, ''),
        freeFireUid: freeFireUid.trim(),
        freeFireIgn: freeFireIgn.trim(),
        password: signupPassword
      });
      setLoading(false);

      if (!res.success) {
        setErrorMsg(res.error || 'Signup failed. Please check your information.');
      } else {
        confetti({ particleCount: 60, spread: 60 });
        onClose();
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          window.history.pushState({}, '', '/');
          window.dispatchEvent(new Event('popstate'));
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Signup encountered an issue. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[90dvh] bg-white dark:bg-[#0B132B] rounded-3xl overflow-hidden shadow-2xl border border-[#DCE8F7] dark:border-slate-800 flex flex-col transition-all">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#176BFF] via-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white text-[#176BFF] flex items-center justify-center font-black text-xs shadow-sm">
              EGX
            </div>
            <div>
              <h3 className="text-base font-black leading-none">
                {isLoginTab ? 'Player Sign In' : 'Instant Player Registration'}
              </h3>
              <p className="text-[11px] text-blue-100 mt-0.5 font-medium">
                {isLoginTab ? 'Enter your credentials to enter tournaments' : 'No OTP Required · Instant Access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1.5 bg-[#EAF4FF] dark:bg-slate-900 shrink-0 border-b border-[#DCE8F7] dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setErrorMsg(null); }}
            className={`py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              isLoginTab 
                ? 'bg-white dark:bg-[#0B132B] text-[#176BFF] dark:text-blue-400 shadow-sm' 
                : 'text-[#60708A] dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setErrorMsg(null); }}
            className={`py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              !isLoginTab 
                ? 'bg-white dark:bg-[#0B132B] text-[#176BFF] dark:text-blue-400 shadow-sm' 
                : 'text-[#60708A] dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            {t.signup}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 pb-10">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoginTab ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                  Gmail / Username / Phone / FF UID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter Gmail, username, or phone"
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-[#F5F9FF] dark:bg-slate-900/90 border border-[#DCE8F7] dark:border-slate-800 text-xs sm:text-sm font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                  {t.password}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-[#F5F9FF] dark:bg-slate-900/90 border border-[#DCE8F7] dark:border-slate-800 text-xs sm:text-sm font-bold text-[#10213A] dark:text-white focus:outline-none focus:border-[#176BFF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2 border border-blue-400/30"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>
          ) : (
            /* SIGNUP FORM (NO OTP REQUIRED, REAL-TIME VALIDATIONS) */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Full Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    {t.fullName} *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onBlur={() => markTouched('fullName')}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Shakib Ahmed"
                      required
                      className={`w-full pl-9 pr-3 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold text-[#10213A] dark:text-white focus:outline-none transition-all ${
                        touched.fullName && validationErrors.fullName 
                          ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                          : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                      }`}
                    />
                  </div>
                  {touched.fullName && validationErrors.fullName && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    Username (Unique) *
                  </label>
                  <div className="relative">
                    <span className="text-slate-400 text-xs font-mono font-bold absolute left-3 top-1/2 -translate-y-1/2">@</span>
                    <input
                      type="text"
                      value={username}
                      onBlur={() => markTouched('username')}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="shakib_ff"
                      required
                      className={`w-full pl-9 pr-3 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold text-[#10213A] dark:text-white focus:outline-none transition-all ${
                        touched.username && validationErrors.username 
                          ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                          : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                      }`}
                    />
                  </div>
                  {touched.username && validationErrors.username && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Email (Must end with @gmail.com) */}
              <div className="flex flex-col gap-1.5">
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                  Gmail Address (@gmail.com) *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onBlur={() => markTouched('email')}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className={`w-full pl-9 pr-3 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold text-[#10213A] dark:text-white focus:outline-none transition-all ${
                      touched.email && validationErrors.email 
                        ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                        : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                    }`}
                  />
                </div>
                {touched.email && validationErrors.email && (
                  <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Phone & WhatsApp (Must be exactly 11 digits) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    Phone Number (11 Digits) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={mobileNumber}
                      maxLength={11}
                      onBlur={() => markTouched('mobileNumber')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setMobileNumber(val);
                        if (!whatsappNumber || whatsappNumber.length < 11) {
                          setWhatsappNumber(val);
                        }
                      }}
                      placeholder="017XXXXXXXX"
                      required
                      className={`w-full pl-9 pr-3 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold font-mono text-[#10213A] dark:text-white focus:outline-none transition-all ${
                        touched.mobileNumber && validationErrors.mobileNumber 
                          ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                          : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                      }`}
                    />
                  </div>
                  {touched.mobileNumber && validationErrors.mobileNumber && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.mobileNumber}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    WhatsApp Number (11 Digits) *
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={whatsappNumber}
                      maxLength={11}
                      onBlur={() => markTouched('whatsappNumber')}
                      onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="017XXXXXXXX"
                      required
                      className={`w-full pl-9 pr-3 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold font-mono text-[#10213A] dark:text-white focus:outline-none transition-all ${
                        touched.whatsappNumber && validationErrors.whatsappNumber 
                          ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                          : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                      }`}
                    />
                  </div>
                  {touched.whatsappNumber && validationErrors.whatsappNumber && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.whatsappNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Free Fire UID & IGN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    UID *
                  </label>
                  <div className="relative">
                    <Gamepad2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={freeFireUid}
                      onBlur={() => markTouched('freeFireUid')}
                      onChange={(e) => setFreeFireUid(e.target.value)}
                      placeholder="e.g. 19283746"
                      required
                      className={`w-full pl-9 pr-3 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-mono font-bold text-[#10213A] dark:text-white focus:outline-none transition-all ${
                        touched.freeFireUid && validationErrors.freeFireUid 
                          ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                          : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                      }`}
                    />
                  </div>
                  {touched.freeFireUid && validationErrors.freeFireUid && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.freeFireUid}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    In-Game Name (IGN) *
                  </label>
                  <input
                    type="text"
                    value={freeFireIgn}
                    onBlur={() => markTouched('freeFireIgn')}
                    onChange={(e) => setFreeFireIgn(e.target.value)}
                    placeholder="e.g. RAKIB_YT"
                    required
                    className={`w-full px-4 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold text-[#10213A] dark:text-white focus:outline-none transition-all ${
                      touched.freeFireIgn && validationErrors.freeFireIgn 
                        ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                        : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                    }`}
                  />
                  {touched.freeFireIgn && validationErrors.freeFireIgn && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.freeFireIgn}
                    </p>
                  )}
                </div>
              </div>

              {/* Password & Confirm Password (Min 6 chars) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    Password (Min 6 Chars) *
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPass ? 'text' : 'password'}
                      value={signupPassword}
                      onBlur={() => markTouched('signupPassword')}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className={`w-full pl-9 pr-8 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold text-[#10213A] dark:text-white focus:outline-none transition-all ${
                        touched.signupPassword && validationErrors.signupPassword 
                          ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                          : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPass(!showSignupPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showSignupPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {touched.signupPassword && validationErrors.signupPassword && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.signupPassword}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-[#60708A] dark:text-slate-400 px-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showSignupPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onBlur={() => markTouched('confirmPassword')}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className={`w-full px-4 py-3 rounded-xl bg-[#F5F9FF] dark:bg-slate-900 border text-xs font-bold text-[#10213A] dark:text-white focus:outline-none transition-all ${
                      touched.confirmPassword && validationErrors.confirmPassword 
                        ? 'border-red-400 dark:border-red-600 focus:border-red-500' 
                        : 'border-[#DCE8F7] dark:border-slate-800 focus:border-[#176BFF]'
                    }`}
                  />
                  {touched.confirmPassword && validationErrors.confirmPassword && (
                    <p className="text-[10px] text-red-500 font-bold mt-0.5 flex items-center gap-1 px-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-600/35 hover:shadow-xl hover:shadow-blue-600/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 mt-3 flex items-center justify-center gap-2 border border-blue-400/30"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating Account Instantly...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Sign Up (Instant Entry)</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
