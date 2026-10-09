export interface PostComment {
  id: string;
  userName: string;
  avatar: string;
  text: string;
  timeAgo: string;
}

export interface Cafe {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  king?: string;
  currentKing?: string;
  rei?: string;
  kingCheckins?: number;
  kingVisits?: number;
  visitsCount?: number;
  activePerk?: string;
  perkDurationSeconds?: number;
  perkEligibleMinVisits?: number;
  rating?: number;
  photoUrl?: string;
  tags?: string[];
  [key: string]: any;
}

export interface Circuit {
  id: string;
  title?: string;
  name?: string;
  description: string;
  totalDistanceKm?: number;
  distanceKm?: number;
  distance?: string;
  rewardPoints?: number;
  points?: number;
  badgeIcon?: string;
  badge?: string;
  region?: string;
  cafes: any[];
  completed?: boolean;
  [key: string]: any;
}

export interface CommunityPost {
  id: string;
  userName: string;
  userHandle?: string;
  avatar: string;
  timeAgo: string;
  cafeName: string;
  text: string;
  likes: number;
  hasLiked?: boolean;
  pace?: string;
  distance?: string;
  elevation?: string;
  image?: string;
  comments?: PostComment[];
  [key: string]: any;
}

export type ClubPost = CommunityPost;
export type ClubePost = CommunityPost;