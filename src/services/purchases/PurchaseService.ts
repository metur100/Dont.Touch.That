/**
 * In-app purchase abstraction. A RevenueCat (or StoreKit/Play Billing) implementation can replace the
 * mock later. Entitlements are stored in player progress so features can check them offline.
 */

export type ProductId = 'remove_ads' | 'theme_medieval' | 'theme_pack_all';

export interface Product {
  id: ProductId;
  title: string;
  description: string;
  /** Display price (from the store in a real implementation). */
  price: string;
  /** Entitlements granted by the product. */
  grants: string[];
}

export interface PurchaseService {
  readonly available: boolean;
  getProducts(): Promise<Product[]>;
  purchase(id: ProductId): Promise<{ success: boolean; grants: string[] }>;
  restore(): Promise<string[]>;
}

export const PRODUCTS: Product[] = [
  { id: 'remove_ads', title: 'Remove Ads', description: 'No interstitial ads. Ever.', price: '€2.99', grants: ['remove_ads'] },
  { id: 'theme_medieval', title: 'Medieval Theme', description: 'Knights. Castles. Buttons.', price: '€0.99', grants: ['theme:medieval'] },
  { id: 'theme_pack_all', title: 'All Themes', description: 'Every current and future theme.', price: '€3.99', grants: ['theme:*'] },
];

/** Purchases are disabled until a real provider is configured. */
class UnavailablePurchaseService implements PurchaseService {
  readonly available = false;

  async getProducts(): Promise<Product[]> {
    return PRODUCTS;
  }

  async purchase(): Promise<{ success: boolean; grants: string[] }> {
    return { success: false, grants: [] };
  }

  async restore(): Promise<string[]> {
    return [];
  }
}

export const purchases: PurchaseService = new UnavailablePurchaseService();

export function hasEntitlement(entitlements: string[], id: string): boolean {
  if (entitlements.includes(id)) return true;
  return id.startsWith('theme:') && entitlements.includes('theme:*');
}
