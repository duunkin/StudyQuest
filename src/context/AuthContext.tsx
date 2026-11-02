import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from '../lib/firebase';
import { getTodayDateVN } from '../lib/dateUtils';
import type { UserProfile, UserStats } from '../lib/schemas';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('studyquest_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('studyquest_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('studyquest_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Initialize profile if needed
          const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'info');
          const profileSnap = await getDoc(profileRef).catch((e) =>
            handleFirestoreError(e, OperationType.GET, `users/${currentUser.uid}/profile/info`)
          );

          if (!profileSnap.exists()) {
            const initialProfile: UserProfile = {
              displayName: currentUser.displayName || 'Học sinh',
              createdAt: new Date().toISOString(),
            };
            await setDoc(profileRef, initialProfile).catch((e) =>
              handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/profile/info`)
            );
          }

          // Initialize stats if needed
          const statsRef = doc(db, 'users', currentUser.uid, 'stats', 'main');
          const statsSnap = await getDoc(statsRef).catch((e) =>
            handleFirestoreError(e, OperationType.GET, `users/${currentUser.uid}/stats/main`)
          );

          if (!statsSnap.exists()) {
            const initialStats: UserStats = {
              totalExp: 0,
              level: 1,
              streakDays: 0,
              lastActiveDate: getTodayDateVN(),
            };
            await setDoc(statsRef, initialStats).catch((e) =>
              handleFirestoreError(e, OperationType.WRITE, `users/${currentUser.uid}/stats/main`)
            );
          }
        } catch (err) {
          console.error('Error initializing user profile/stats:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOut,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
