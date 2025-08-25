import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  bio: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
}

export interface Reaction {
  id: string;
  postId: string;
  userId: string;
  type: 'like' | 'comment';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  actorId: string;
  text: string;
  read: boolean;
  createdAt: string;
  objectType?: string;
  objectId?: string;
}

interface DB {
  users: User[];
  posts: Post[];
  follows: Follow[];
  reactions: Reaction[];
  notifications: Notification[];
}

const STORAGE_KEY = 'insyd_db';

// Initialize storage with empty arrays
const initializeDB = (): void => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      users: [],
      posts: [],
      follows: [],
      reactions: [],
      notifications: []
    }));
  }
};

// Get the entire database
const getDB = (): DB => {
  initializeDB();
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
};

// Save the entire database
const saveDB = (db: DB): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

// Clear all data
export const clearDB = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  initializeDB();
};

// Users
export const getUsers = (): User[] => {
  return getDB().users;
};

export const createUser = (data: Omit<User, 'id'>): User => {
  const db = getDB();
  const user = { ...data, id: uuidv4() };
  db.users.push(user);
  saveDB(db);
  return user;
};

// Posts
export const getPosts = (): Post[] => {
  return getDB().posts;
};

export const createPost = (data: Omit<Post, 'id' | 'createdAt'>): Post => {
  const db = getDB();
  const post = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
  db.posts.push(post);
  saveDB(db);
  return post;
};

// Follows
export const getFollows = (): Follow[] => {
  return getDB().follows;
};

export const createFollow = (followerId: string, followeeId: string): Follow => {
  const db = getDB();
  const follow = { 
    id: uuidv4(), 
    followerId, 
    followeeId,
    createdAt: new Date().toISOString()
  };
  db.follows.push(follow);
  saveDB(db);
  return follow;
};

// Reactions
export const getReactions = (): Reaction[] => {
  return getDB().reactions;
};

export const createReaction = (data: Omit<Reaction, 'id' | 'createdAt'>): Reaction => {
  const db = getDB();
  const reaction = { 
    ...data, 
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  db.reactions.push(reaction);
  saveDB(db);
  return reaction;
};

// Notifications
export const getNotifications = (userId: string, options: { unreadOnly?: boolean; sort?: 'chrono' | 'ai' } = {}): Notification[] => {
  const db = getDB();
  let notifications = db.notifications.filter(n => n.userId === userId);
  
  if (options.unreadOnly) {
    notifications = notifications.filter(n => !n.read);
  }
  
  return notifications.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const createNotification = (data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification => {
  const db = getDB();
  const notification = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    read: false
  };
  db.notifications.push(notification);
  saveDB(db);
  return notification;
};

export const markNotificationAsRead = (id: string): Notification | null => {
  const db = getDB();
  const notification = db.notifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
    saveDB(db);
    return notification;
  }
  return null;
};
