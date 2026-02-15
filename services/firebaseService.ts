import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { Resume } from '../types';

export const firebaseService = {
  // --- Auth Functions ---

  async signUp(email: string, password: string, fullName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName
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

  getCurrentUser(): User | null {
    return auth.currentUser;
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