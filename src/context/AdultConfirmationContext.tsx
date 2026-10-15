import React, { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'hngstor_adult_confirmed';

interface AdultConfirmationValue {
  isAdultConfirmed: boolean;
  confirmAdult: () => void;
}

const AdultConfirmationContext = createContext<AdultConfirmationValue>({
  isAdultConfirmed: false,
  confirmAdult: () => undefined,
});

export function AdultConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [isAdultConfirmed, setIsAdultConfirmed] = useState(() =>
    typeof window !== 'undefined' && window.sessionStorage.getItem(STORAGE_KEY) === 'true'
  );

  const confirmAdult = () => {
    window.sessionStorage.setItem(STORAGE_KEY, 'true');
    setIsAdultConfirmed(true);
  };

  return (
    <AdultConfirmationContext.Provider value={{ isAdultConfirmed, confirmAdult }}>
      {children}
    </AdultConfirmationContext.Provider>
  );
}

export function useAdultConfirmation() {
  return useContext(AdultConfirmationContext);
}
