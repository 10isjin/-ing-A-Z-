import { Timestamp } from 'firebase/firestore';

export interface Post {
  id?: string;
  title: string;
  content: string;
  category: 'class' | 'lunch' | 'sports_club' | 'festival' | 'project' | 'health_fitness' | 'oasis' | 'paps' | 'character';
  type: 'gallery' | 'news' | 'notice';
  imageUrl?: string;
  authorId: string;
  authorName?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likesCount?: number;
  viewCount?: number;
}

export interface SiteSettings {
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  aboutImage1: string;
  aboutImage2: string;
  aboutImage3: string;
  aboutImage4: string;
  stat1Label: string;
  stat1Value: string;
  stat2Label: string;
  stat2Value: string;
  stat3Label: string;
  stat3Value: string;
  stat4Label: string;
  stat4Value: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoImage?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
}

export interface Highlight {
  id?: string;
  imageUrl: string;
  title: string;
  createdAt: Timestamp;
}

export interface AppEntry {
  id?: string;
  name: string;
  description: string;
  category: string;
  link: string;
  color: string;
  iconName: string;
  isRecommended?: boolean;
  createdAt: Timestamp;
  likesCount?: number;
}
