/**
 * ID for uniquely identifying elements.
 */
export type ElementId = string;

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  country?: string;
  language?: string;
  referralCode: string; // Used for SmartLink
  role: 'distributor' | 'admin' | 'user';
  subscriptionStatus: 'active' | 'expired' | 'trial';
  subscriptionEndDate?: string;
  whatsapp?: string;
  neoLifeShopUrl?: string; // Personal shop link
  isAmbassador: boolean;
  referredBy?: string; // Who referred this distributor
  commissionBalance: number;
  totalEarnings: number;
  createdAt: string;
}

export interface Lead {
  id: string;
  distributorId: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  country?: string;
  intent: 'health' | 'income' | 'agriculture' | 'products' | 'unknown';
  message: string;
  notes?: string;
  status: 'new' | 'contacted' | 'converted';
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'health' | 'agriculture' | 'income';
  countries: string[];
  shopUrl: string;
  imageUrl?: string;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  expiresAt: string;
  active: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface Stats {
  clicks: number;
  leads: number;
  conversions: number;
}
