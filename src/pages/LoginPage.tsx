/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, ShieldCheck, Chrome, Eye, EyeOff } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if we are on the admin login page
  const isAdminPath = window.location.pathname === '/admin/login';

  // Auto-redirect if already logged in
  React.useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && isMounted) {
        try {
          const emailLower = user.email?.toLowerCase();
          const isDefaultAdmin = emailLower === 'kimsabin71@gmail.com' || emailLower === 'admin@hng.com';
          
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          const userRole = userData?.role || (isDefaultAdmin ? 'admin' : 'user');

          if (isAdminPath && (userRole === 'admin' || isDefaultAdmin)) {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
          } else {
            // Preserve admin flag; redirect if on login pages
            if (window.location.pathname === '/login' || window.location.pathname === '/admin/login') {
              navigate('/');
            }
          }
        } catch (error) {
          console.error("Auto-redirect error:", error);
          // If Firestore fails, we still might want to navigate if it's just a permission issue on the user doc
          if (window.location.pathname === '/login' || window.location.pathname === '/admin/login') {
            navigate('/');
          }
        }
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleLoginSuccess = async (user: any) => {
    try {
      const emailLower = user.email?.toLowerCase();
      const isDefaultAdmin = emailLower === 'kimsabin71@gmail.com' || emailLower === 'admin@hng.com';
      
      const userRef = doc(db, 'users', user.uid);
      let userSnap;
      
      try {
        userSnap = await getDoc(userRef);
      } catch (e) {
        console.error("Error fetching user doc:", e);
        // Fallback if doc read fails
      }
      
      // If user doesn't exist in DB, create profile
      if (!userSnap || !userSnap.exists()) {
        try {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || (isDefaultAdmin ? 'Admin' : 'User'),
            photoURL: user.photoURL || null,
            role: isDefaultAdmin ? 'admin' : 'user',
            createdAt: serverTimestamp()
          });
        } catch (e) {
          console.error("Error creating user doc:", e);
        }
      }

      // Re-fetch or use existing data to determine role
      let userData;
      try {
        const finalSnap = await getDoc(userRef);
        userData = finalSnap.data();
      } catch (e) {
        console.error("Error re-fetching user doc:", e);
      }
      
      const userRole = userData?.role || (isDefaultAdmin ? 'admin' : 'user');

      if (isAdminPath) {
        if (userRole === 'admin' || isDefaultAdmin) {
          localStorage.setItem('isAdmin', 'true');
          navigate('/admin');
        } else {
          alert('관리자 권한이 없습니다. 일반 로그인을 이용해 주세요.');
          await auth.signOut();
          // Do not set admin flag
        }
      } else {
        // regular user login - preserve admin flag for concurrent sessions
        navigate('/');
      }
    } catch (error) {
      console.error("handleLoginSuccess error:", error);
      navigate('/');
    }
  };



  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      alert('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      await handleLoginSuccess(result.user);
    } catch (error: any) {
      console.error("Login Error Details:", {
        code: error.code,
        message: error.message,
        email: trimmedEmail
      });
      
      let message = '로그인 중 오류가 발생했습니다.';
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = '이메일 또는 비밀번호가 일치하지 않습니다.\n\n1. 가입한 적이 없다면 [회원가입]을 먼저 해주세요.\n2. Google로 가입하셨다면 Google 로그인을 이용해주세요.\n3. 비밀번호가 기억나지 않으면 [비밀번호 재설정]을 이용해주세요.';
      } else if (error.code === 'auth/too-many-requests') {
        message = '너무 많은 로그인 시도가 있었습니다. 보안을 위해 잠시 차단되었으니 5분 후 다시 시도하거나 비밀번호를 재설정해 주세요.';
      } else if (error.code === 'auth/invalid-email') {
        message = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/user-disabled') {
        message = '관리자에 의해 정지된 계정입니다.';
      }
      
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      alert('비밀번호 재설정 링크를 받을 이메일을 먼저 입력해주세요.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      alert('비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해 주세요.');
    } catch (error: any) {
      console.error("Reset Error:", error);
      alert('이메일 발송 실패: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-headline font-bold mb-2">반갑습니다</h1>
          <p className="text-on-surface-variant font-light">
            {isAdminPath ? '관리자 모드로 로그인합니다' : 'H&G스토아에 오신 것을 환영합니다'}
          </p>
        </div>

        <div className="mb-8">
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">이메일 (ID)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label className="text-sm font-medium text-on-surface-variant">비밀번호</label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary font-medium hover:underline"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : <><LogIn size={20} /> 로그인</>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-outline-variant/10 flex flex-col gap-4">
          <p className="text-center text-sm text-on-surface-variant">
            계정이 없으신가요? <Link to="/signup" className="text-primary font-bold">회원가입</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
