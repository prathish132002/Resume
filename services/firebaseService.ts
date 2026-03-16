import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyBeforeUpdateEmail
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { Resume, UserProfile } from '../types';

export const firebaseService = {
  // --- Auth Functions ---

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      // Create or update user profile in Firestore
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          fullName: user.displayName || 'Google User',
          createdAt: Date.now()
        });
      }
      
      return user;
    } catch (error) {
      throw error;
    }
  },

  async signUp(email: string, password: string, fullName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
        
        // Send email verification
        await sendEmailVerification(userCredential.user);
        
        // Create user profile in Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          id: userCredential.user.uid,
          email: email,
          fullName: fullName,
          createdAt: Date.now()
        });
      }
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  async resendVerificationEmail() {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  },

  async updateEmailAddress(newEmail: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    try {
      await verifyBeforeUpdateEmail(user, newEmail);
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  async getUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      } else {
        // Fallback if document doesn't exist
        return {
          id: user.uid,
          email: user.email || '',
          fullName: user.displayName || '',
          createdAt: Date.now()
        };
      }
    } catch (error) {
      console.error("Error fetching user profile: ", error);
      return null;
    }
  },

  async updateUserProfile(profile: UserProfile) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, profile, { merge: true });
      
      // Update auth profile if name changed
      if (user.displayName !== profile.fullName) {
        await updateProfile(user, {
          displayName: profile.fullName
        });
      }
    } catch (error) {
      console.error("Error updating user profile: ", error);
      throw error;
    }
  },

  // --- Database Functions ---

  async saveResume(resume: Resume) {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      // Use a subcollection 'resumes' under the top-level collection or a root collection
      // Here we use a root collection 'resumes' and store userId in the document for query
      const resumeRef = doc(db, 'resumes', resume.id);
      
      await setDoc(resumeRef, {
        ...resume,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      return resume;
    } catch (error) {
      console.error("Error saving resume: ", error);
      throw error;
    }
  },

  async fetchResumes(): Promise<Resume[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    try {
      const resumesRef = collection(db, 'resumes');
      const q = query(
        resumesRef, 
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const resumes: Resume[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Exclude internal fields if necessary, ensuring type safety
        const { userId, updatedAt, ...resumeData } = data as any;
        resumes.push(resumeData as Resume);
      });
      
      // Sort in memory or add composite index for orderBy("updatedAt", "desc")
      return resumes.sort((a: any, b: any) => 
        (b.updatedAt || 0) > (a.updatedAt || 0) ? 1 : -1
      );
    } catch (error) {
      console.error("Error fetching resumes: ", error);
      throw error;
    }
  },

  async deleteResume(resumeId: string) {
    try {
      await deleteDoc(doc(db, 'resumes', resumeId));
    } catch (error) {
      console.error("Error deleting resume: ", error);
      throw error;
    }
  }
};