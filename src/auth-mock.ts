// Mock of firebase/auth connecting to SQLite backend via REST
const API_BASE = `http://${window.location.hostname}:3001/api`;

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  tenantId: string | null;
  providerData: any[];
  providerId: string;
}

class MockAuth {
  currentUser: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    const saved = localStorage.getItem('firebase_mock_user');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('firebase_mock_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('firebase_mock_user');
      localStorage.removeItem('isAdmin');
    }
    this.triggerListeners();
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    this.listeners.push(callback);
    // Call immediately and asynchronously to simulate Firebase Auth behavior
    setTimeout(() => {
      callback(this.currentUser);
    }, 0);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private triggerListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (e) {
        console.error("onAuthStateChanged callback error:", e);
      }
    });
  }
}

function formatFirebaseUser(userData: any): User {
  if (!userData) throw new Error("Invalid user data");
  return {
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName || userData.email.split('@')[0],
    phoneNumber: userData.phoneNumber || '',
    photoURL: userData.photoURL || null,
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: [
      {
        providerId: 'password',
        uid: userData.uid,
        displayName: userData.displayName || userData.email.split('@')[0],
        email: userData.email,
        phoneNumber: userData.phoneNumber || '',
        photoURL: userData.photoURL || null,
      }
    ],
    providerId: 'firebase'
  };
}

export const authInstance = new MockAuth();
export const getAuth = () => authInstance;

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
}

export class EmailAuthProvider {
  static PROVIDER_ID = 'password';
  static credential(email: string, password: string) {
    return { email, password, providerId: 'password' };
  }
}

export class RecaptchaVerifier {
  constructor() {}
  clear() {}
}

export const signInWithPhoneNumber = async () => {
  alert('휴대폰 인증은 데모 모드에서 지원되지 않습니다. 바로 가입하실 수 있습니다.');
  return {
    confirm: async (code: string) => {
      return { user: authInstance.currentUser };
    }
  };
};

export const signInWithPopup = async () => {
  throw new Error('Google 로그인도 SQLite 모드에서는 지원되지 않습니다. 이메일 로그인을 사용해 주세요.');
};

export const signInWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) {
    const errData = await res.json();
    const error: any = new Error(errData.error || 'Login failed');
    error.code = 'auth/invalid-credential';
    throw error;
  }
  
  const userData = await res.json();
  const firebaseUser = formatFirebaseUser(userData);
  authInstance.setCurrentUser(firebaseUser);
  return { user: firebaseUser };
};

export const createUserWithEmailAndPassword = async (auth: any, email: string, password: string) => {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: 'Signup failed' }));
    const error: any = new Error(errData.error || 'Signup failed');
    if (errData.error === 'Email already in use') {
      error.code = 'auth/email-already-in-use';
    } else {
      error.code = 'auth/signup-failed';
    }
    throw error;
  }

  const userData = await res.json();
  const firebaseUser = formatFirebaseUser(userData);
  authInstance.setCurrentUser(firebaseUser);
  return { user: firebaseUser };
};

export const signOut = async (auth: any) => {
  authInstance.setCurrentUser(null);
};

export const onAuthStateChanged = (auth: any, callback: (user: User | null) => void) => {
  return authInstance.onAuthStateChanged(callback);
};

export const updateProfile = async (user: any, profile: { displayName?: string; photoURL?: string }) => {
  const updates: any = {};
  if (profile.displayName !== undefined) updates.displayName = profile.displayName;
  if (profile.photoURL !== undefined) updates.photoURL = profile.photoURL;

  const res = await fetch(`${API_BASE}/users/${user.uid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!res.ok) {
    throw new Error('Failed to update profile');
  }

  if (authInstance.currentUser) {
    const updatedUser = {
      ...authInstance.currentUser,
      displayName: profile.displayName || authInstance.currentUser.displayName,
      photoURL: profile.photoURL || authInstance.currentUser.photoURL
    };
    authInstance.setCurrentUser(updatedUser);
  }
};

export const sendPasswordResetEmail = async (auth: any, email: string) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!res.ok) {
    throw new Error('Failed to send reset email');
  }
};

export const updatePassword = async (user: any, newPassword: string) => {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: user.uid, newPassword })
  });
  if (!res.ok) {
    throw new Error('Failed to update password');
  }
};

export const deleteUser = async (user: any) => {
  const res = await fetch(`${API_BASE}/auth/delete-account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: user.uid })
  });
  if (!res.ok) {
    throw new Error('Failed to delete account');
  }
  authInstance.setCurrentUser(null);
};

export const reauthenticateWithCredential = async (user: any, credential: any) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credential.email, password: credential.password })
  });
  if (!res.ok) {
    const errData = await res.json();
    const error: any = new Error(errData.error || 'Re-authentication failed');
    error.code = 'auth/invalid-credential';
    throw error;
  }
};

export const verifyBeforeUpdateEmail = async (user: any, newEmail: string) => {
  const res = await fetch(`${API_BASE}/users/${user.uid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: newEmail })
  });
  if (!res.ok) {
    throw new Error('Failed to update email');
  }
  if (authInstance.currentUser) {
    const updatedUser = {
      ...authInstance.currentUser,
      email: newEmail
    };
    authInstance.setCurrentUser(updatedUser);
  }
};

