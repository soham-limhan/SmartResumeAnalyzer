import { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from '@/lib/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestAnalyses, setGuestAnalyses] = useState([]);
  const [batchResults, setBatchResults] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || '',
          picture: firebaseUser.photoURL || '',
        });
        // Clear guest data when user signs in
        setGuestAnalyses([]);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Get Firebase ID token for API calls
  const getToken = async () => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch {
      return null;
    }
  };

  // Email/password sign in
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // Email/password registration
  const register = async (name, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    // Refresh user state with the display name
    setUser({
      uid: result.user.uid,
      email: result.user.email,
      name: name,
      picture: '',
    });
    return result.user;
  };

  // Google OAuth sign in
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  // Sign out
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setGuestAnalyses([]);
    setBatchResults(null);
  };

  // Guest analysis management (in-memory only)
  const addGuestAnalysis = (analysis) => {
    setGuestAnalyses((prev) => [analysis, ...prev]);
  };

  const clearGuestAnalyses = () => {
    setGuestAnalyses([]);
  };

  // Batch results management
  const saveBatchResults = (results) => {
    setBatchResults(results);
  };

  const clearBatchResults = () => {
    setBatchResults(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginWithGoogle,
    logout,
    getToken,
    guestAnalyses,
    addGuestAnalysis,
    clearGuestAnalyses,
    batchResults,
    saveBatchResults,
    clearBatchResults,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
