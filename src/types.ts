export enum UserRole {
  CLIENT = 'client',
  CHEF = 'chef'
}

export interface Location {
  lat: number;
  lng: number;
}

export interface User {
  uid: string;
  displayName: string;
  email?: string;
  isDemo: boolean;
  photoURL?: string;
  emailVerified: boolean;
  phone?: string;
  name?: string;
  address?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  location: Location;
  menu: MenuItem[];
  menuImage?: string; // Image originale du menu scanné
  rating?: number;
  ratingCount?: number;
  category?: string;
  coverImage?: string;
  profileImage?: string;
  phone?: string;
  openingHours?: string;
  delivery?: boolean;
  type?: string;
  source?: 'firebase' | 'osm';
}

export interface OrderItem extends MenuItem {
  count: number;
}

export interface ChatMessage {
  id: string;
  sender: 'client' | 'chef';
  text: string;
  timestamp: number;
  read?: boolean;
}

export interface Review {
  id: string;
  restaurantId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment?: string;
  timestamp: number;
}

export interface Order {
  id: string;
  restaurantId: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  timestamp: number;
  deliveryLocation?: Location | null;
  chat: ChatMessage[];
  paymentMethod?: 'cash' | 'card';
  isPaid?: boolean;
  rated?: boolean;
  estimatedDeliveryMinutes?: number;
  estimatedArrivalTime?: number;
  deliveryDistance?: number;
}

export interface Cart {
  [itemId: string]: OrderItem;
}