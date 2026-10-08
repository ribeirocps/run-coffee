export interface Cafe {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  neighborhood: string;
  currentKing: string;
  kingVisits: number;
  kingAvatar?: string;
  perk: string;
  distanceKm: number;
  isPartner: boolean;
}

export interface Circuit {
  id: string;
  title: string;
  distance: string;
  description: string;
  cafes: string[];
  visitedCafes: string[];
  badgeAwarded: string;
  completed: boolean;
}

export interface CommunityPost {
  id: string;
  userName: string;
  avatar: string;
  avatarUrl?: string;
  timeAgo: string;
  cafeName: string;
  text: string;
  photo: string | null;
  cheers: number;
  hasCheered: boolean;
}