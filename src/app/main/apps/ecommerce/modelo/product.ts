export type EComProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  image?: string;
  hasFreeShipping?: boolean;
  rating: number;
  description?: string;
  isInCart?: boolean;
};