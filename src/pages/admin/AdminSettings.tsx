/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { auth } from '../../firebase';
import { verifyBeforeUpdateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Settings, Mail, Lock, ShieldAlert, CheckCircle2, Eye, EyeOff, Info } from 'lucide-react';

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
    </div>
  );
}
