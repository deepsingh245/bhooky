export interface NormalizedRestaurant {
  id: string;
  name: string;
  rating: number;
  priceRange: { min: number; max: number };
  distanceKm: number;
  deliveryTimeMinutes: number;
  isOpen: boolean;
  cuisines: string[];
}

export interface NormalizedMenuItem {
  id: string;
  restaurantId: string;
  name: string;
  price: number;
  veg: boolean;
  tags: string[];
  available: boolean;
}
