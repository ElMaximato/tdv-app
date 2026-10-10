import type { Address } from '../api/shop';

export type RootStackParamList = {
  Tabs: undefined;
  GameDetail: { slug: string; title?: string };
  Login: undefined;
  Register: undefined;
  Product: { slug: string; name?: string };
  Cart: undefined;
  Checkout: undefined;
  AddressForm: { address?: Address } | undefined;
  Addresses: undefined;
  Favorites: undefined;
  Top5: undefined;
  EditProfile: undefined;
  Orders: undefined;
  Notifications: undefined;
  OrderDetail: { id: number; justPaid?: boolean };
};

export type TabParamList = {
  Ranking: undefined;
  Merch: undefined;
  Perfil: undefined;
};
