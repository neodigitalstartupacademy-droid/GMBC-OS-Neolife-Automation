import { User } from '../types';
import { FOUNDER_CONFIG } from '../constants';

export function isSubscriptionActive(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Founder always active
  if (user.email === FOUNDER_CONFIG.email || user.role === 'admin') return true;
  
  if (user.subscriptionStatus === 'active') {
    if (!user.subscriptionEndDate) return true; // Lifetime or not set
    return new Date(user.subscriptionEndDate) > new Date();
  }
  
  if (user.subscriptionStatus === 'trial') {
      // Trial logic could go here
      return true;
  }

  return false;
}
