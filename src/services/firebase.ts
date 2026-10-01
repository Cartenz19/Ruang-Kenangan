import {
  auth,
  signInWithGoogle,
  logoutUser,
  onAuthChange,
} from './firestore';
import type { User } from 'firebase/auth';

export { auth };

export const initAuth = (
  onAuthSuccess?: (user: User) => void,
  onAuthFailure?: () => void
) => {
  return onAuthChange((user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async () => {
  return await signInWithGoogle();
};

export const logout = async () => {
  await logoutUser();
};
