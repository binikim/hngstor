/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Settings, Mail, Lock, ShieldAlert, CheckCircle2, Eye, EyeOff, Info, Download, Database, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminSettings() {
  const [newEmail, setNewEmail] = useState(auth.currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // 제품 엑셀 다운로드 (.xlsx)
  const downloadProductsExcel = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          '제품 ID': doc.id,
          '제품명': data.name || '',
          '가격': data.price || 0,
          '카테고리': data.category || '',
          '재고': data.stock || 0,
          '설명': data.description || '',
          '등록일': data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '',
        };
      });

      if (productsData.length === 0) {
        alert('내보낼 제품 데이터가 없습니다.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(productsData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, '제품정보.xlsx');
    } catch (error) {
      console.error('Products Excel Download Error:', error);
      alert('제품 데이터를 엑셀로 저장하는 동안 오류가 발생했습니다.');
    }
  };

  // 회원 엑셀 다운로드 (.xlsx)
  const downloadUsersExcel = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          '회원 UID': doc.id,
          '이메일': data.email || '',
          '이름': data.displayName || '',
          '전화번호': data.phoneNumber || '',
          '역할': data.role || 'user',
          '가입일': data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : '',
        };
      });

      if (usersData.length === 0) {
        alert('내보낼 회원 데이터가 없습니다.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(usersData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, '회원정보.xlsx');
    } catch (error) {
      console.error('Users Excel Download Error:', error);
      alert('회원 데이터를 엑셀로 저장하는 동안 오류가 발생했습니다.');
    }
  };

  // 관리자 제외 전체 데이터베이스 초기화
  const handleInitializeDatabase = async () => {
    if (resetConfirmInput !== '초기화') {
      alert("안전을 위해 입력창에 '초기화'를 정확히 입력해 주세요.");
      return;
    }

    const doubleConfirm = window.confirm("정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 복구할 수 없으며 관리자를 제외한 모든 회원, 주문, 제품 정보가 영구히 소실됩니다.");
    if (!doubleConfirm) return;

    setIsResetting(true);
    setMessage(null);

    try {
      // 1. orders 삭제
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orderDeletePromises = ordersSnapshot.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
      await Promise.all(orderDeletePromises);

      // 2. products 삭제
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productDeletePromises = productsSnapshot.docs.map(d => deleteDoc(doc(db, 'products', d.id)));
      await Promise.all(productDeletePromises);

      // 3. content 삭제
      const contentSnapshot = await getDocs(collection(db, 'content'));
      const contentDeletePromises = contentSnapshot.docs.map(d => deleteDoc(doc(db, 'content', d.id)));
      await Promise.all(contentDeletePromises);

      // 4. users 삭제 (관리자 제외)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userDeletePromises = usersSnapshot.docs
        .filter(d => {
          const userData = d.data();
          const isCurrentAdmin = d.id === auth.currentUser?.uid;
          const isAdminRole = userData.role === 'admin';
          const defaultAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
          const isProtectedEmail = userData.email?.toLowerCase() === defaultAdminEmail;
          
          return !(isCurrentAdmin || isAdminRole || isProtectedEmail);
        })
        .map(d => deleteDoc(doc(db, 'users', d.id)));
        
      await Promise.all(userDeletePromises);

      setMessage({
        type: 'success',
        text: '데이터베이스 초기화가 성공적으로 완료되었습니다. (관리자 정보 유지됨)'
      });
      setResetConfirmInput('');
    } catch (error: any) {
      console.error("Database Reset Error:", error);
      setMessage({
        type: 'error',
        text: `초기화 작업 중 오류가 발생했습니다: ${error.message || error}`
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) return;

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Check if user is logged in with Google
      const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
      
      if (isGoogleUser) {
        // Limited updates for Google users
        if (newEmail !== user.email) {
          throw new Error('Google 계정으로 로그인한 경우 이메일 직접 변경은 불가능합니다. Google 계정 설정에서 변경하시거나, 새로운 계정으로 회원가입 후 관리자 권한을 부여받으세요.');
        }
        if (newPassword) {
          throw new Error('Google 계정으로 로그인한 경우 이곳에서는 비밀번호를 변경할 수 없습니다. Google 보안 설정에서 진행해 주세요.');
        }
        
        setMessage({ type: 'info', text: 'Google 계정 사용자는 관리자 설정에서 이메일/비밀번호를 직접 수정할 수 없습니다. 회원 관리 탭을 이용해 주세요.' });
        setLoading(false);
        return;
      }

      // Re-authenticate user first (required for sensitive operations)
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      let emailUpdateStarted = false;

      // Update Email if changed
      if (newEmail !== user.email) {
        try {
          await verifyBeforeUpdateEmail(user, newEmail);
          emailUpdateStarted = true;
        } catch (emailError: any) {
          console.error("Email Update Error:", emailError);
          if (emailError.code === 'auth/operation-not-allowed') {
            throw new Error('이메일 변경 기능이 비활성화되어 있습니다. 관리자 계정을 변경하려면 [회원 관리] 탭에서 다른 사용자의 역할을 ADMIN으로 변경하는 방법을 권장합니다.');
          }
          throw emailError;
        }
      }

      // Update Password if provided
      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      if (emailUpdateStarted) {
        setMessage({ 
          type: 'success', 
          text: '비밀번호가 변경되었으며, 새 이메일로 인증 링크가 발송되었습니다. 이메일함의 링크를 클릭해야 최종적으로 이메일 주소가 변경됩니다.' 
        });
      } else {
        setMessage({ type: 'success', text: '계정 정보가 성공적으로 변경되었습니다.' });
      }
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Update Error:", error);
      if (error.code === 'auth/wrong-password') {
        setMessage({ type: 'error', text: '현재 비밀번호가 올바르지 않습니다.' });
      } else if (error.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: '보안을 위해 다시 로그인 후 시도해주세요.' });
      } else {
        setMessage({ type: 'error', text: error.message || '정보 변경 중 오류가 발생했습니다.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
          <Settings size={24} /> 관리자 계정 설정
        </h2>
      </div>

      <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-sm">
        <div className="mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
          <Info className="text-primary shrink-0" size={20} />
          <div className="text-xs text-on-surface-variant leading-relaxed">
            <p className="font-bold text-primary mb-1">관리자 계정을 다른 사람으로 바꾸고 싶으신가요?</p>
            현재 계정의 이메일을 바꾸는 대신, **[회원 관리]** 탭에서 새로운 관리자가 될 분의 역할을 **ADMIN**으로 변경해 주세요. 그 후 현재 계정의 역할을 USER로 바꾸거나 삭제하는 것이 더 안전하고 확실한 방법입니다.
          </div>
        </div>

        <form onSubmit={handleUpdateAccount} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success' ? 'bg-success/10 text-success' : 
              message.type === 'info' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">관리자 이메일 (ID)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type="email" 
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/5">
            <p className="text-xs text-on-surface-variant mb-4 font-medium uppercase tracking-widest">보안 확인</p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-on-surface-variant ml-1">현재 비밀번호 (필수)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="현재 비밀번호를 입력하세요"
                  className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/5 space-y-4">
            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">비밀번호 변경 (선택)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1">새 비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="변경할 경우에만 입력"
                    minLength={6}
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface-variant ml-1">새 비밀번호 확인</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all transform active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? '변경 사항 저장 중...' : '계정 정보 업데이트'}
          </button>
        </form>
      </div>

      {/* 데이터 관리 및 백업 섹션 */}
      <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-sm space-y-6">
        <h3 className="text-xl font-headline font-bold flex items-center gap-2 text-on-surface">
          <Database size={22} className="text-primary" /> 데이터 관리 및 백업
        </h3>
        
        <p className="text-xs text-on-surface-variant/80 leading-relaxed">
          제품 정보 및 회원 가입 정보를 엑셀(*.xlsx) 파일로 백업받거나, 테스트 후 데이터베이스를 청소하기 위한 초기화 작업을 수행할 수 있습니다.
        </p>

        {/* 엑셀 다운로드 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={downloadProductsExcel}
            className="flex items-center justify-center gap-3 p-4 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 rounded-2xl font-bold transition-all transform active:scale-[0.98] text-sm text-on-surface cursor-pointer"
          >
            <Download size={18} className="text-primary" />
            제품 정보 엑셀 다운로드 (.xlsx)
          </button>
          
          <button
            type="button"
            onClick={downloadUsersExcel}
            className="flex items-center justify-center gap-3 p-4 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 rounded-2xl font-bold transition-all transform active:scale-[0.98] text-sm text-on-surface cursor-pointer"
          >
            <Download size={18} className="text-primary" />
            회원 정보 엑셀 다운로드 (.xlsx)
          </button>
        </div>

        {/* 데이터베이스 초기화 영역 */}
        <div className="pt-6 border-t border-outline-variant/10 space-y-4">
          <div className="p-4 bg-error/5 rounded-2xl border border-error/20 flex gap-3">
            <ShieldAlert className="text-error shrink-0" size={20} />
            <div className="text-xs text-error font-medium leading-relaxed">
              <p className="font-extrabold mb-1">⚠️ 위험: 데이터베이스 초기화</p>
              이 작업은 되돌릴 수 없습니다. 클릭 시 등록된 모든 제품, 주문 정보, 일반 회원 데이터가 완전히 삭제됩니다. 단, 사이트 접속 및 관리를 위한 **관리자(ADMIN) 정보는 유지**됩니다.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">초기화 진행을 확인하기 위해 '초기화'를 입력하세요.</label>
              <input
                type="text"
                placeholder="초기화"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-xl py-3 px-4 focus:ring-1 focus:ring-error text-sm font-bold text-error placeholder:text-on-surface-variant/20"
              />
            </div>
            
            <button
              type="button"
              disabled={isResetting || resetConfirmInput !== '초기화'}
              onClick={handleInitializeDatabase}
              className="px-6 py-3 bg-error text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-error/90 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all text-sm shrink-0 cursor-pointer"
            >
              <Trash2 size={18} />
              {isResetting ? '초기화 중...' : '모든 데이터 초기화'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
