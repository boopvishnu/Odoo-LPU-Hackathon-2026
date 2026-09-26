import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { auth, googleProvider, db } from '../services/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginIdOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (loginId: string, email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  sendPasswordResetOtp: (email: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOtpAndResetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  activeGeneratedOtp: string | null;
}

// Helpers for Web Crypto API PBKDF2 password hashing and OTP SHA-256 hashing
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<{ passwordSalt: string; passwordHash: string }> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return {
    passwordSalt: bufferToHex(salt),
    passwordHash: bufferToHex(derivedBits)
  };
}

async function verifyPassword(password: string, passwordSalt: string, passwordHash: string): Promise<boolean> {
  const salt = hexToBytes(passwordSalt);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return bufferToHex(derivedBits) === passwordHash;
}

async function hashOtp(otp: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(otp));
  return bufferToHex(digest);
}

const DEFAULT_USER: User = {
  id: 'usr_default_01',
  loginId: 'aman.shaikh',
  name: 'Aman Shaikh',
  email: 'aman.shaikh@stocksense.in',
  role: 'Inventory Manager',
  avatarLetter: 'A'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vhat_stocksense_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_USER;
      }
    }
    // Default logged in user so user can immediately test all dashboard/operations if desired,
    // or log out to see the login/signup wireframes!
    return DEFAULT_USER;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeGeneratedOtp, setActiveGeneratedOtp] = useState<string | null>(null);

  // Sync state with local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('vhat_stocksense_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vhat_stocksense_user');
    }
  }, [user]);

  // Listen to Firebase auth changes if available
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const email = fbUser.email || '';
        const name = fbUser.displayName || email.split('@')[0] || 'User';
        const loginId = email.split('@')[0] || 'user';
        const userObj: User = {
          id: fbUser.uid,
          loginId: loginId,
          name: name,
          email: email,
          role: 'Inventory Manager',
          avatarLetter: (name[0] || 'A').toUpperCase()
        };

        // Try getting role / user data from firestore
        if (db) {
          try {
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              userObj.name = data.name || userObj.name;
              userObj.role = (data.role as UserRole) || userObj.role;
              userObj.loginId = data.loginId || userObj.loginId;
            } else {
              await setDoc(userDocRef, {
                loginId: userObj.loginId,
                name: userObj.name,
                email: userObj.email,
                role: userObj.role,
                createdAt: new Date().toISOString()
              }, { merge: true });
            }
          } catch (e) {
            console.warn('Firestore user fetch note:', e);
          }
        }

        setUser(userObj);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (loginIdOrEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!loginIdOrEmail || !password) {
        setIsLoading(false);
        return { success: false, error: 'Please enter both Login ID/Email and Password.' };
      }

      // Check if email format
      const isEmail = loginIdOrEmail.includes('@');
      const emailToUse = isEmail ? loginIdOrEmail : `${loginIdOrEmail.toLowerCase().replace(/\s+/g, '')}@stocksense.in`;

      // Try Firebase auth if online
      if (auth) {
        try {
          const res = await signInWithEmailAndPassword(auth, emailToUse, password);
          if (res.user) {
            const name = res.user.displayName || loginIdOrEmail;
            const loggedIn: User = {
              id: res.user.uid,
              loginId: loginIdOrEmail,
              name: name,
              email: res.user.email || emailToUse,
              role: 'Inventory Manager',
              avatarLetter: (name[0] || 'A').toUpperCase()
            };
            setUser(loggedIn);
            setIsLoading(false);
            return { success: true };
          }
        } catch (firebaseErr: any) {
          // If user not in Firebase or network issue, fallback to mock/local DB for instant testing
          console.log('Firebase signIn fallback:', firebaseErr.message);
        }
      }

      // Local mock login validation
      const storedUsersRaw = localStorage.getItem('vhat_registered_users');
      const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const found = storedUsers.find((u: any) => 
        (u.loginId.toLowerCase() === loginIdOrEmail.toLowerCase() || u.email.toLowerCase() === loginIdOrEmail.toLowerCase())
      );

      if (found) {
        if (found.passwordHash) {
          const isValid = await verifyPassword(password, found.passwordSalt || '', found.passwordHash);
          if (!isValid) {
            setIsLoading(false);
            return { success: false, error: 'Invalid password. Please check your credentials.' };
          }
        } else if (found.password) {
          if (found.password !== password) {
            setIsLoading(false);
            return { success: false, error: 'Invalid password. Please check your credentials.' };
          }
          const { passwordSalt, passwordHash } = await hashPassword(password);
          const updatedUsers = storedUsers.map((u: any) => {
            if (u.id === found.id || (u.loginId && u.loginId.toLowerCase() === found.loginId?.toLowerCase())) {
              const { password: _oldPwd, ...rest } = u;
              return { ...rest, passwordSalt, passwordHash };
            }
            return u;
          });
          localStorage.setItem('vhat_registered_users', JSON.stringify(updatedUsers));
        }
        const loggedIn: User = {
          id: found.id || `usr_${Date.now()}`,
          loginId: found.loginId,
          name: found.name || found.loginId,
          email: found.email,
          role: found.role || 'Inventory Manager',
          avatarLetter: (found.name?.[0] || found.loginId[0] || 'A').toUpperCase()
        };
        setUser(loggedIn);
        setIsLoading(false);
        return { success: true };
      }

      // Allow demo login with any credentials or standard demo
      const displayName = loginIdOrEmail.split('@')[0];
      const newUser: User = {
        id: `usr_${Date.now()}`,
        loginId: loginIdOrEmail,
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        email: emailToUse,
        role: 'Inventory Manager',
        avatarLetter: displayName[0].toUpperCase()
      };
      setUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const signup = async (loginId: string, email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!loginId || !email || !password) {
        setIsLoading(false);
        return { success: false, error: 'All fields are required.' };
      }

      const assignedName = name || loginId;
      const newUser: User = {
        id: `usr_${Date.now()}`,
        loginId: loginId.trim(),
        name: assignedName,
        email: email.trim(),
        role: 'Inventory Manager',
        avatarLetter: (assignedName[0] || 'A').toUpperCase()
      };

      // Try Firebase
      if (auth) {
        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          newUser.id = res.user.uid;
          if (db) {
            await setDoc(doc(db, 'users', res.user.uid), {
              loginId: newUser.loginId,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              createdAt: new Date().toISOString()
            });
          }
        } catch (fbErr: any) {
          console.warn('Firebase signup note:', fbErr.message);
        }
      }

      // Save to local registered users with salted password hash
      const { passwordSalt, passwordHash } = await hashPassword(password);
      const storedUsersRaw = localStorage.getItem('vhat_registered_users');
      const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      storedUsers.push({ ...newUser, passwordSalt, passwordHash });
      localStorage.setItem('vhat_registered_users', JSON.stringify(storedUsers));

      setUser(newUser);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Signup failed.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase Auth is not initialized');
      }
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const email = fbUser.email || '';
      const name = fbUser.displayName || 'Google User';
      const userObj: User = {
        id: fbUser.uid,
        loginId: email.split('@')[0] || 'user',
        name: name,
        email: email,
        role: 'Inventory Manager',
        avatarLetter: (name[0] || 'A').toUpperCase()
      };
      setUser(userObj);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      console.warn('Google sign in error:', err);
      return { success: false, error: err.message || 'Google sign in failed' };
    }
  };

  const logout = async () => {
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem('vhat_stocksense_user');
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedData };
    setUser(updated);
    if (db && user.id && !user.id.startsWith('usr_default')) {
      try {
        await setDoc(doc(db, 'users', user.id), updatedData, { merge: true });
      } catch (e) {
        console.warn('Firestore profile update warning:', e);
      }
    }
  };

  // OTP flow for Forgot Password
  const sendPasswordResetOtp = async (email: string) => {
    if (!email) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    // Generate a secure 6-digit OTP
    const randArray = new Uint32Array(1);
    crypto.getRandomValues(randArray);
    const otp = ((randArray[0] % 900000) + 100000).toString();
    setActiveGeneratedOtp(otp);
    
    const otpHash = await hashOtp(otp);

    // Store temporarily in localStorage with 10-minute expiry
    localStorage.setItem(`vhat_reset_otp_${email.toLowerCase().trim()}`, JSON.stringify({
      otpHash,
      expiresAt: Date.now() + 10 * 60 * 1000
    }));

    return { success: true, otp };
  };

  const verifyOtpAndResetPassword = async (email: string, otp: string, newPassword: string) => {
    const raw = localStorage.getItem(`vhat_reset_otp_${email.toLowerCase().trim()}`);
    if (!raw) {
      return { success: false, error: 'No active OTP request found for this email. Please request a new code.' };
    }
    const data = JSON.parse(raw);
    if (Date.now() > data.expiresAt) {
      return { success: false, error: 'OTP has expired. Please request a new one.' };
    }
    const enteredOtpHash = await hashOtp(otp.trim());
    if (data.otpHash) {
      if (data.otpHash !== enteredOtpHash) {
        return { success: false, error: 'Invalid 6-digit OTP code entered.' };
      }
    } else if (data.otp !== otp.trim()) {
      return { success: false, error: 'Invalid 6-digit OTP code entered.' };
    }

    // Update password in local registered users
    const { passwordSalt, passwordHash } = await hashPassword(newPassword);
    const storedUsersRaw = localStorage.getItem('vhat_registered_users');
    if (storedUsersRaw) {
      const storedUsers = JSON.parse(storedUsersRaw);
      const updated = storedUsers.map((u: any) => {
        if (u.email.toLowerCase() === email.toLowerCase().trim()) {
          const { password: _removed, ...rest } = u;
          return { ...rest, passwordSalt, passwordHash };
        }
        return u;
      });
      localStorage.setItem('vhat_registered_users', JSON.stringify(updated));
    }

    // Clear OTP
    localStorage.removeItem(`vhat_reset_otp_${email.toLowerCase().trim()}`);
    setActiveGeneratedOtp(null);

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateProfile,
        sendPasswordResetOtp,
        verifyOtpAndResetPassword,
        activeGeneratedOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
