import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

type AccessState = 'loading' | 'login' | 'confirmation' | 'confirming' | 'allowed' | 'error';

interface AdultConfirmationValue {
  accessState: AccessState;
  isAdultConfirmed: boolean;
  confirmAdult: () => Promise<void>;
}

const AdultConfirmationContext = createContext<AdultConfirmationValue>({
  accessState: 'loading',
  isAdultConfirmed: false,
  confirmAdult: async () => undefined,
});

export function AdultConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [accessState, setAccessState] = useState<AccessState>('loading');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    let latestCheck = 0;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const checkId = ++latestCheck;
      setCurrentUser(user);

      if (!user) {
        setAccessState('login');
        return;
      }

      setAccessState('loading');
      try {
        const emailLower = user.email?.toLowerCase();
        const defaultAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@hng.com').toLowerCase();
        const isDefaultAdmin = emailLower === defaultAdminEmail;
        const userSnapshot = await getDoc(doc(db, 'users', user.uid));
        const userData = userSnapshot.data();

        if (checkId !== latestCheck) return;

        if (isDefaultAdmin || userData?.role === 'admin') {
          setAccessState('allowed');
        } else {
          setAccessState(userData?.adultConfirmedAt ? 'allowed' : 'confirmation');
        }
      } catch (error) {
        console.error('Adult access check failed:', error);
        if (checkId === latestCheck) setAccessState('error');
      }
    });

    return unsubscribe;
  }, []);

  const confirmAdult = async () => {
    if (!currentUser || accessState !== 'confirmation') return;

    setAccessState('confirming');
    try {
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        isAdult: true,
        adultConfirmedAt: serverTimestamp(),
      }, { merge: true });
      setAccessState('allowed');
    } catch (error) {
      console.error('Adult confirmation could not be saved:', error);
      setAccessState('error');
    }
  };

  return (
    <AdultConfirmationContext.Provider
      value={{ accessState, isAdultConfirmed: accessState === 'allowed', confirmAdult }}
    >
      {children}
    </AdultConfirmationContext.Provider>
  );
}

export function useAdultConfirmation() {
  return useContext(AdultConfirmationContext);
}
