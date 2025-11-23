import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from './firebaseConfig';
import { UserProfile } from '../types';

/**
 * Create a new user account with email and password
 */
export const registerUser = async (email: string, password: string, codename: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName: codename });

  // Create user profile in database
  const userProfile: UserProfile = {
    codename,
    handlerId: '1', // Default handler
    lifeGoal: ''
  };

  await set(ref(database, `users/${user.uid}/profile`), userProfile);

  return user;
};

/**
 * Sign in with email and password
 */
export const loginUser = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * Sign out current user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

/**
 * Get current user profile from database
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snapshot = await get(ref(database, `users/${uid}/profile`));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
};

/**
 * Update user profile in database
 */
export const updateUserProfile = async (uid: string, profile: UserProfile): Promise<void> => {
  await set(ref(database, `users/${uid}/profile`), profile);
};

/**
 * Subscribe to authentication state changes
 */
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
