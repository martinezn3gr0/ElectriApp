import { UserProfile, PublicProfile } from '../types';

/** Strip PII / private fields before writing the public marketplace card. */
export function toPublicProfile(profile: UserProfile): PublicProfile {
  return {
    uid: profile.uid,
    displayName: profile.displayName,
    photoURL: profile.photoURL || '',
    role: profile.role,
    bio: profile.bio,
    skills: profile.skills,
    certifications: profile.certifications,
    availability: profile.availability,
    yearsOfExperience: profile.yearsOfExperience,
    location: profile.location,
    rating: profile.rating ?? 0,
    reviewCount: profile.reviewCount ?? 0,
    createdAt: profile.createdAt,
  };
}
