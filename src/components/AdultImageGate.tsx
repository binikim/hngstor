import React from 'react';
import { Lock } from 'lucide-react';
import { useAdultConfirmation } from '../context/AdultConfirmationContext';

export default function AdultImageGate({ className = '' }: { className?: string }) {
  const { confirmAdult } = useAdultConfirmation();

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <Lock className="text-on-surface-variant/50 mb-3" size={36} aria-hidden="true" />
      <p className="text-sm font-semibold leading-relaxed text-on-surface-variant">
        만 19세 이상만 제품 이미지를 볼 수 있습니다.
      </p>
      <button
        type="button"
        onClick={confirmAdult}
        className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-primary-container transition-colors"
      >
        만 19세 이상입니다
      </button>
    </div>
  );
}
