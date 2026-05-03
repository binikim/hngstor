/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Phone, 
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Phone Verification States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Setup reCAPTCHA
  // Phone number formatter
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

  const setupRecaptcha = () => {
    try {
      // 1. 기존에 이미 생성된 verifier가 있다면 명시적으로 제거
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn("reCAPTCHA clear ignored:", e);
        }
        (window as any).recaptchaVerifier = null;
      }
      
      // 2. DOM 요소 강제 비우기 (중복 렌더링 에러 방지 핵심)
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.innerHTML = '';
      }

      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          if ((window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier.clear();
            (window as any).recaptchaVerifier = null;
          }
        }
      });
      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (err) {
      console.error("reCAPTCHA Init Error:", err);
      return null;
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      alert('핸드폰 번호를 입력해 주세요.');
      return;
    }

    setIsSendingCode(true);
    try {
      const verifier = setupRecaptcha();
      if (!verifier) {
        throw new Error('reCAPTCHA 초기화 실패');
      }

      // Format phone number to E.164
      // Strip hyphens for Firebase
      let rawPhone = phoneNumber.replace(/[^0-9]/g, '');
      let formattedPhone = rawPhone;
      
      if (formattedPhone.startsWith('010')) {
        formattedPhone = '+82' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
         alert('올바른 핸드폰 번호 형식이 아닙니다. (예: 010-0000-0000)');
         setIsSendingCode(false);
         return;
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      alert('인증번호가 발송되었습니다.');
    } catch (error: any) {
      console.error("SMS Send Error:", error);
      
      if (error.code === 'auth/operation-not-allowed') {
        alert('Firebase Console에서 [Phone] 인증 제공업체가 활성화되어 있지 않습니다. 관리자 설정이 필요합니다.');
      } else if (error.message?.includes('rendered')) {
        // Handle the re-render error by clearing and asking to try again
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        }
        alert('인증 시스템을 초기화했습니다. 다시 한번 시도해 주세요.');
      } else {
        alert('인증번호 발송에 실패했습니다. 번호를 확인해 주세요.');
      }

      // Reset recaptcha on error to allow retry
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult || !verificationCode) return;

    setIsVerifyingCode(true);
    try {
      await confirmationResult.confirm(verificationCode);
      setIsPhoneVerified(true);
      alert('성인 인증(휴대폰 인증)이 완료되었습니다.');
    } catch (error) {
      console.error("Code Verify Error:", error);
      alert('인증번호가 올바르지 않습니다.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPhoneVerified) {
      alert('핸드폰을 통한 성인 인증이 필요합니다.');
      return;
    }

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    const trimmedEmail = email.trim();
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = result.user;

      // Update profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const emailLower = user.email?.toLowerCase();
      const isDefaultAdmin = emailLower === 'admin@hng.com' || emailLower === 'kimsabin71@gmail.com';
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        phoneNumber: phoneNumber, // Save verified phone number
        photoURL: null,
        role: isDefaultAdmin ? 'admin' : 'user',
        isAdult: true, // Verification completed via phone
        createdAt: serverTimestamp()
      });

      alert('회원가입이 완료되었습니다!');
      navigate('/');
    } catch (error: any) {
      console.error("Signup Error:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert('이미 사용 중인 이메일입니다.');
      } else {
        alert('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-6 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-headline font-bold mb-2">회원가입</h1>
          <p className="text-on-surface-variant font-light">
            H&G스토아의 멤버가 되어 프리미엄 혜택을 누리세요
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">이름</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type="text" 
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="홍길동"
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">이메일</label>
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
            <label className="text-sm font-medium text-on-surface-variant ml-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자리 이상 입력"
                minLength={6}
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-on-surface-variant ml-1">비밀번호 확인</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-12 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/20"
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

          <div className="space-y-4 pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-primary" size={18} />
              <h3 className="text-sm font-bold">성인 인증 (휴대폰 번호 인증)</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                  <input 
                    type="tel" 
                    disabled={isPhoneVerified}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="010-0000-0000"
                    className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/20 text-sm"
                  />
                </div>
                <button 
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || isPhoneVerified}
                  className="bg-surface-container-highest px-4 rounded-xl text-xs font-bold hover:bg-outline-variant/10 transition-all disabled:opacity-50"
                >
                  {isSendingCode ? '발송 중...' : confirmationResult ? '재전송' : '번호인증'}
                </button>
              </div>

              {confirmationResult && !isPhoneVerified && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex gap-2"
                >
                  <div className="relative flex-grow">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
                    <input 
                      type="text" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="인증번호 6자리"
                      maxLength={6}
                      className="w-full bg-surface-container-lowest border-none rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/20 text-sm"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isVerifyingCode}
                    className="bg-primary text-on-primary px-6 rounded-xl text-xs font-bold hover:bg-primary-container transition-all"
                  >
                    {isVerifyingCode ? '확인중' : '확인'}
                  </button>
                </motion.div>
              )}

              {isPhoneVerified && (
                <div className="flex items-center gap-2 text-success bg-success/10 p-4 rounded-xl">
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-bold">휴대폰 성인 인증이 완료되었습니다.</span>
                </div>
              )}

              {!isPhoneVerified && (
                <div className="flex items-start gap-2 text-on-surface-variant/60 bg-surface-container-lowest px-4 py-3 rounded-xl">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] leading-snug">
                    본 사이트는 성인 전용 상품을 취급하며 미성년자의 이용을 엄격히 금지합니다. 가입을 위해 실명 및 연령 확인을 위한 휴대폰 인증이 필수입니다.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div id="recaptcha-container" className="hidden"></div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all transform active:scale-95 disabled:opacity-50 mt-4"
          >
            {loading ? '가입 중...' : <><UserPlus size={20} /> 가입하기</>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-outline-variant/10 text-center">
          <p className="text-sm text-on-surface-variant">
            이미 계정이 있으신가요? <Link to="/login" className="text-primary font-bold">로그인</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
