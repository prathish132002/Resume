import { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

const RATE_LIMIT_SECONDS = 3;
const FREE_DAILY_LIMIT = 20;
const PRO_DAILY_LIMIT = 200;

export const GEMINI_FLASH_LITE_COST_PER_1M_TOKENS = 0.075;
export const GEMINI_FLASH_COST_PER_1M_TOKENS = 0.35;

export interface AIUsageData {
  totalRequests: number;
  totalTokensEstimated: number;
  lastRequestAt: number;
  dailyUsage: Record<string, number>;
  monthlyUsage: Record<string, number>;
}

export const checkRateLimitAndUsage = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return; // If not logged in, we might skip tracking, or block. Let's skip for guest users.

  const userId = user.uid;
  const usageRef = doc(db, 'ai_usage', userId);
  const usageSnap = await getDoc(usageRef);

  const now = Date.now();
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (usageSnap.exists()) {
    const data = usageSnap.data() as AIUsageData;
    
    // Check rapid abuse (Cooldown)
    const lastRequestAt = data.lastRequestAt || 0;
    if (now - lastRequestAt < RATE_LIMIT_SECONDS * 1000) {
      throw new Error("Please wait before making another request.");
    }

    // Check daily limit
    const userProfileSnap = await getDoc(doc(db, 'users', userId));
    const isPro = userProfileSnap.exists() && userProfileSnap.data()?.plan === 'pro';
    const limitAmount = isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT;

    const todayUsage = data.dailyUsage?.[todayStr] || 0;
    if (todayUsage >= limitAmount) {
      throw new Error("Daily AI usage limit reached. Please upgrade or try again tomorrow.");
    }
  }
};

export const trackAIUsage = async (
  functionName: string,
  model: string,
  promptText: string,
  responseText: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const userId = user.uid;
  const estimatedTokens = Math.ceil((promptText.length + responseText.length) / 4);
  const now = Date.now();
  const todayStr = new Date(now).toISOString().split('T')[0]; // YYYY-MM-DD
  const monthStr = todayStr.substring(0, 7); // YYYY-MM

  const usageRef = doc(db, 'ai_usage', userId);
  const usageSnap = await getDoc(usageRef);

  if (!usageSnap.exists()) {
    // Create new record
    await setDoc(usageRef, {
      totalRequests: 1,
      totalTokensEstimated: estimatedTokens,
      lastRequestAt: now,
      dailyUsage: { [todayStr]: 1 },
      monthlyUsage: { [monthStr]: 1 }
    });
  } else {
    // Update existing record
    await updateDoc(usageRef, {
      totalRequests: increment(1),
      totalTokensEstimated: increment(estimatedTokens),
      lastRequestAt: now,
      [`dailyUsage.${todayStr}`]: increment(1),
      [`monthlyUsage.${monthStr}`]: increment(1)
    });
  }

  // Log the request
  await addDoc(collection(db, 'ai_usage_logs'), {
    userId,
    functionName,
    model,
    estimatedTokens,
    createdAt: serverTimestamp()
  });
};
