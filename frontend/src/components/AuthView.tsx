import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
import { LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, loginWithGoogle, sendPasswordResetOtp, verifyOtpAndResetPassword, activeGeneratedOtp, isLoading } = useAuth();

  // Mode: 'split' (shows side-by-side or tabbed based on screen size), or 'forgot-password'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Login form state
  const [loginId, setLoginId] = useState('aman.shaikh');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');

  // Signup form state
  const [signupLoginId, setSignupLoginId] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRePassword, setSignupRePassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [mockSentOtp, setMockSentOtp] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await login(loginId, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (signupPassword !== signupRePassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters long.');
      return;
    }

    const res = await signup(signupLoginId, signupEmail, signupPassword);
    if (!res.success) {
      setSignupError(res.error || 'Failed to create account.');
    } else {
      setSignupSuccess('Account created successfully!');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail) {
      setForgotError('Please enter your registered email ID.');
      return;
    }
    const res = await sendPasswordResetOtp(forgotEmail);
    if (res.success && res.otp) {
      setMockSentOtp(res.otp);
      setForgotStep(2);
    } else {
      setForgotError(res.error || 'Could not send OTP.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (newPassword !== confirmPassword) {
      setForgotError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }

    const res = await verifyOtpAndResetPassword(forgotEmail, otpCode, newPassword);
    if (res.success) {
      setForgotSuccess('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotSuccess('');
        setMockSentOtp(null);
        setActiveTab('login');
      }, 1500);
    } else {
      setForgotError(res.error || 'OTP verification failed.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Title as in Image 3 mockup */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          Login / Signup
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          VHAT StockSense &bull; Real-time Stock Tracking & Warehouse Inventory
        </p>
      </div>

      {/* Wireframe Container with responsive side-by-side layout matching Image 3 */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* ================= LEFT CARD: LOGIN PAGE ================= */}
        <div className={`bg-white rounded-3xl p-8 border-2 ${activeTab === 'login' ? 'border-rose-900 shadow-xl ring-2 ring-rose-900/10' : 'border-rose-300/80 shadow-md opacity-90 md:opacity-100'} transition-all`}>
          
          {/* Mockup Title */}
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Login Page
            </span>
          </div>

          {/* App Logo box at top as indicated by arrow in Image 3 */}
          <div className="flex justify-center mb-8">
            <div className="border border-rose-300 p-3 rounded-2xl bg-neutral-50/70 hover:bg-neutral-50 transition-colors">
              <AppLogo size="md" />
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Login Id / Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter Login Id or Email"
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter Password"
                  required
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-rose-900 hover:bg-rose-950 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </div>
          </form>

          {/* Bottom links from Image 3: "Forgot Password ? | Sign Up" */}
          <div className="mt-6 flex items-center justify-between text-xs text-neutral-600 border-t border-neutral-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotStep(1);
                setForgotError('');
                setForgotSuccess('');
              }}
              className="text-rose-900 hover:underline font-semibold cursor-pointer"
            >
              Forgot Password ?
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className="text-neutral-700 hover:text-rose-900 font-semibold cursor-pointer"
            >
              Sign Up
            </button>
          </div>

          {/* Social Sign In (Firebase Google Auth requirement) */}
          <div className="mt-6 pt-4 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full py-2.5 px-4 bg-white border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Sign in with Google (Firebase)</span>
            </button>
            <div className="mt-3 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginId('aman.shaikh');
                  setLoginPassword('password123');
                }}
                className="text-[11px] text-neutral-500 hover:text-rose-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded"
              >
                Demo: Aman (Mgr)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginId('sashank');
                  setLoginPassword('password123');
                }}
                className="text-[11px] text-neutral-500 hover:text-rose-900 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded"
              >
                Demo: Sashank (Staff)
              </button>
            </div>
          </div>
        </div>


        {/* ================= RIGHT CARD: SIGN UP PAGE ================= */}
        <div className={`bg-white rounded-3xl p-8 border-2 ${activeTab === 'signup' ? 'border-rose-900 shadow-xl ring-2 ring-rose-900/10' : 'border-rose-300/80 shadow-md opacity-90 md:opacity-100'} transition-all`}>
          
          {/* Mockup Title */}
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest font-bold text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              Sign up Page
            </span>
          </div>

          {/* App Logo box at top as indicated by arrow in Image 3 */}
          <div className="flex justify-center mb-8">
            <div className="border border-rose-300 p-3 rounded-2xl bg-neutral-50/70 hover:bg-neutral-50 transition-colors">
              <AppLogo size="md" />
            </div>
          </div>

          {signupError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{signupError}</span>
            </div>
          )}

          {signupSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{signupSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Enter Login Id
              </label>
              <input
                type="text"
                value={signupLoginId}
                onChange={(e) => setSignupLoginId(e.target.value)}
                placeholder="e.g. rahul.sharma"
                required
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Enter Email Id
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="rahul@example.com"
                required
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Enter Password
              </label>
              <input
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Re-Enter Password
              </label>
              <input
                type="password"
                value={signupRePassword}
                onChange={(e) => setSignupRePassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-800 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-rose-900 hover:bg-rose-950 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isLoading ? 'Creating Account...' : 'Sign Up'}</span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-neutral-600 border-t border-neutral-100 pt-4">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className="text-rose-900 font-bold hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>

      </div>

      {/* ================= FORGOT PASSWORD / OTP MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-rose-900 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 font-bold text-lg"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 text-rose-900 mb-2">
              <KeyRound className="w-6 h-6" />
              <h3 className="text-lg font-black tracking-tight">Forgot Password &bull; OTP Verification</h3>
            </div>
            <p className="text-xs text-neutral-600 mb-6">
              Enter your email to receive a 6-digit OTP verification code to reset your password.
            </p>

            {mockSentOtp && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs">
                <span className="font-bold">Demo Verification OTP:</span>{' '}
                <span className="font-mono text-base font-black tracking-wider text-rose-900 bg-white px-2 py-0.5 rounded border border-amber-300">
                  {mockSentOtp}
                </span>
                <p className="text-[11px] text-amber-700 mt-1">Copy and enter this 6-digit code below to set your new password.</p>
              </div>
            )}

            {forgotError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    Registered Email ID
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. aman.shaikh@stocksense.in"
                    required
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-900 hover:bg-rose-950 text-white font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    required
                    className="w-full px-4 py-2.5 font-mono text-center tracking-widest text-lg bg-neutral-50 border border-neutral-300 rounded-xl text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    required
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full px-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-rose-800"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-1/3 py-2 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Reset & Login
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
