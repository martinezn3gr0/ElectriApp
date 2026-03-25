export type UserRole = 'electrician' | 'client';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: UserRole;
  bio?: string;
  skills?: string[];
  certifications?: string[];
  location?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  acceptedTerms: boolean;
  acceptedAt: string;
}

export type ProjectStatus = 'open' | 'in-progress' | 'completed' | 'cancelled';
export type ProjectCategory = 'residential' | 'commercial' | 'industrial' | 'emergency';

export interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: ProjectStatus;
  clientId: string;
  electricianId?: string;
  category: ProjectCategory;
  createdAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  clientId: string;
  electricianId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}
