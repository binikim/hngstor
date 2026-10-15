import React from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAdultConfirmation } from '../context/AdultConfirmationContext';

export default function AdultImageGate({ className = '' }: { className?: string }) {
  const { accessState, confirmAdult } = useAdultConfirmation();

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <Lock className="text-on-surface-variant/50 mb-3" size={36} aria-hidden="true" />
      <p className="text-sm font-semibold leading-relaxed text-on-surface-variant">
        {accessState === 'loading' && '로그인 상태를 확인하고 있습니다.'}
        {accessState === 'login' && '로그인 후 제품 이미지를 볼 수 있습니다.'}
        {accessState === 'confirmation' && '만 19세 이상 회원만 제품 이미지를 볼 수 있습니다.'}
        {accessState === 'confirming' && '성인 확인을 저장하고 있습니다.'}
        {accessState === 'error' && '회원 정보를 확인하지 못했습니다. 다시 로그인해 주세요.'}
      </p>
      {accessState === 'login' && (
        <Link
          to="/login"
          className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-container transition-colors"
        >
          로그인하기
        </Link>
      )}
      {accessState === 'confirmation' && (
        <button
          type="button"
          onClick={confirmAdult}
          className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-container transition-colors"
        >
          만 19세 이상 확인
        </button>
      )}
    </div>
  );
}
