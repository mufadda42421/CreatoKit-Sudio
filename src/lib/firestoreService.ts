import {
  db,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from './firebase';
import { UserProfile, SocialAccount, Project, PublishingJob } from '../types';

export const firestoreService = {
  // -------------------------------------------------------------
  // User Profile
  // -------------------------------------------------------------
  async saveUserProfile(user: UserProfile): Promise<void> {
    if (!user.id) return;
    const userRef = doc(db, 'users', user.id);
    await setDoc(userRef, {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      handle: user.handle || `@${user.email.split('@')[0]}`,
      channelName: user.channelName || `${user.name} Studio`,
      joinedAt: user.joinedAt || new Date().toISOString(),
    }, { merge: true });
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Error fetching user profile from Firestore:', e);
    }
    return null;
  },

  // -------------------------------------------------------------
  // Real Social Accounts
  // -------------------------------------------------------------
  async saveSocialAccount(userId: string, account: SocialAccount): Promise<void> {
    if (!userId || !account.id) return;
    const accountRef = doc(db, 'users', userId, 'socialAccounts', account.id);
    const data: Record<string, any> = {
      id: account.id,
      userId,
      platform: account.platform,
      username: account.username,
      displayName: account.displayName,
      status: account.status,
      permissions: account.permissions || [],
      connectedAt: account.connectedAt || new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
    };
    if (account.avatarUrl) data.avatarUrl = account.avatarUrl;
    if (account.channelSubscribers) data.channelSubscribers = account.channelSubscribers;

    await setDoc(accountRef, data, { merge: true });
  },

  async deleteSocialAccount(userId: string, accountId: string): Promise<void> {
    if (!userId || !accountId) return;
    const accountRef = doc(db, 'users', userId, 'socialAccounts', accountId);
    await deleteDoc(accountRef);
  },

  subscribeSocialAccounts(userId: string, callback: (accounts: SocialAccount[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, 'users', userId, 'socialAccounts');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const accounts: SocialAccount[] = [];
        snapshot.forEach((docSnap) => {
          accounts.push(docSnap.data() as SocialAccount);
        });
        callback(accounts);
      },
      (error) => {
        console.warn('Error listening to social accounts:', error);
      }
    );
  },

  async getSocialAccounts(userId: string): Promise<SocialAccount[]> {
    if (!userId) return [];
    try {
      const colRef = collection(db, 'users', userId, 'socialAccounts');
      const snap = await getDocs(colRef);
      const accounts: SocialAccount[] = [];
      snap.forEach((d) => accounts.push(d.data() as SocialAccount));
      return accounts;
    } catch (e) {
      console.warn('Error fetching social accounts:', e);
      return [];
    }
  },

  // -------------------------------------------------------------
  // Real Projects
  // -------------------------------------------------------------
  async saveProject(userId: string, project: Project): Promise<void> {
    if (!userId || !project.id) return;
    const projRef = doc(db, 'users', userId, 'projects', project.id);
    const data: Record<string, any> = {
      id: project.id,
      userId,
      name: project.name,
      platform: project.platform,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: new Date().toISOString(),
    };
    if (project.description) data.description = project.description;
    if (project.aspectRatio) data.aspectRatio = project.aspectRatio;
    if (project.thumbnailUrl) data.thumbnailUrl = project.thumbnailUrl;
    if (project.script) data.script = project.script;
    if (project.targetDurationSec !== undefined) data.targetDurationSec = project.targetDurationSec;

    await setDoc(projRef, data, { merge: true });
  },

  async deleteProject(userId: string, projectId: string): Promise<void> {
    if (!userId || !projectId) return;
    const projRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(projRef);
  },

  subscribeProjects(userId: string, callback: (projects: Project[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, 'users', userId, 'projects');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const projects: Project[] = [];
        snapshot.forEach((d) => projects.push(d.data() as Project));
        callback(projects);
      },
      (error) => {
        console.warn('Error listening to projects:', error);
      }
    );
  },

  // -------------------------------------------------------------
  // Real Publishing Jobs
  // -------------------------------------------------------------
  async savePublishingJob(userId: string, job: PublishingJob): Promise<void> {
    if (!userId || !job.id) return;
    const jobRef = doc(db, 'users', userId, 'publishingJobs', job.id);
    const data: Record<string, any> = {
      id: job.id,
      userId,
      platform: job.platform,
      caption: job.caption,
      status: job.status,
      createdAt: job.createdAt,
    };
    if (job.title) data.title = job.title;
    if (job.mediaUrl) data.mediaUrl = job.mediaUrl;
    if (job.scheduledAt) data.scheduledAt = job.scheduledAt;
    if (job.error) data.error = job.error;
    if (job.platformPostUrl) data.platformPostUrl = job.platformPostUrl;
    if (job.retryCount !== undefined) data.retryCount = job.retryCount;

    await setDoc(jobRef, data, { merge: true });
  },

  subscribePublishingJobs(userId: string, callback: (jobs: PublishingJob[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const colRef = collection(db, 'users', userId, 'publishingJobs');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const jobs: PublishingJob[] = [];
        snapshot.forEach((d) => jobs.push(d.data() as PublishingJob));
        callback(jobs);
      },
      (error) => {
        console.warn('Error listening to publishing jobs:', error);
      }
    );
  },
};
