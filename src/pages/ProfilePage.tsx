/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  ShieldCheck, 
  LogOut, 
  Trash2,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, updateProfile, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const fetchUserData = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setDisplayName(data.displayName || '');
        setPhoneNumber(data.phoneNumber || '');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length <= 3) {
      setPhoneNumber(value);
    } else if (value.length <= 7) {
      setPhoneNumber(`${value.slice(0, 3)}-${value.slice(3)}`);
    } else if (value.length <= 11) {
      setPhoneNumber(`${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`);
    } else {
      setPhoneNumber(`${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(user, { displayName });

      // 2. Update Firestore Document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        phoneNumber,
        updatedAt: new Date()
      });

      alert('프로필 정보가 성공적으로 수정되었습니다.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (user.email === 'kimsabin71@gmail.com' || user.email === 'admin@hng.com') {
      alert('관리자 계정은 탈퇴할 수 없습니다.');
      return;
    }

    const confirm1 = window.confirm('정말 탈퇴하시겠습니까? 모든 주문 내역과 개인정보가 삭제되며 복구할 수 없습니다.');
    if (!confirm1) return;

    setSaving(true);
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      // Delete from Auth
      await deleteUser(user);
      
      alert('회원 탈퇴가 완료되었습니다.');
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert('보안을 위해 다시 로그인한 후 탈퇴를 진행해 주세요.');
        await signOut(auth);
        navigate('/login');
      } else {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <Link to="/my-orders" className="p-2 bg-surface-container-low rounded-full hover:bg-surface-container-high transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold">회원 정보 수정</h1>
            <p className="text-on-surface-variant font-light text-sm">기본 프로필 정보를 관리할 수 있습니다.</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Profile Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 shadow-sm"
          >
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">이메일 계정</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" size={18} />
                  <input 
                    type="email" 
                    readOnly
                    value={user?.email || ''}
                    className="w-full bg-surface-container-highest/50 border-none rounded-xl py-4 pl-12 pr-4 text-on-surface-variant/60 cursor-not-allowed text-sm"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant/40 ml-1">이메일 주소는 변경할 수 없습니다.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">이름</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                  <input 
                    type="text" 
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant ml-1">연락처</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                  <input 
                    type="tel" 
                    required
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/5 flex gap-4">
                <button 
                  type="submit"
                  disabled={saving}
                  className="flex-grow flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-xl font-bold hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  {saving ? '저장 중...' : <><Save size={18} /> 정보 수정하기</>}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Account Status & Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Link 
              to="/my-orders"
              className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-high transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant/60">활동 내역</p>
                  <p className="font-bold text-sm">주문 내역 보기</p>
                </div>
              </div>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex items-center justify-between hover:bg-surface-container-high transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-on-surface/5 text-on-surface/40 group-hover:bg-on-surface/10 group-hover:text-on-surface rounded-full flex items-center justify-center transition-colors">
                  <LogOut size={20} />
                </div>
                <div className="text-left">
                  <p className="text-xs text-on-surface-variant/60">계정 관리</p>
                  <p className="font-bold text-sm">로그아웃</p>
                </div>
              </div>
            </button>
          </motion.div>

          {/* Danger Zone */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-error/5 rounded-3xl p-8 border border-error/10"
          >
            <div className="flex items-start gap-4 mb-6">
              <AlertTriangle className="text-error shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-bold text-error mb-1">회원 탈퇴</h3>
                <p className="text-sm text-on-surface-variant/70 leading-relaxed">
                  탈퇴 시 고객님의 모든 주문 내역, 적립금, 개인정보가 즉시 삭제되며 복구할 수 없습니다. 신중하게 결정해 주세요.
                </p>
              </div>
            </div>
            <button 
              onClick={handleDeleteAccount}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-error text-on-error rounded-xl text-sm font-bold hover:bg-error/90 transition-all active:scale-95 disabled:opacity-50"
            >
              <Trash2 size={18} /> 회원 탈퇴하기
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
