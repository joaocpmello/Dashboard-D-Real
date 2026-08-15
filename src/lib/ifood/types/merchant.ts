// Tipos do módulo Merchant — refletem o que a doc oficial publica.
// Ver: https://developer.ifood.com.br/pt-BR/docs/guides/modules/merchant/endpoints

export type IfoodMerchantSummary = {
  id: string;
  name: string;
  corporateName: string;
};

export type IfoodMerchantAddress = {
  street: string;
  number: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  district: string;
  latitude: number;
  longitude: number;
};

export type IfoodMerchantOperation = {
  name: string;
  salesChannels: { name: string; enabled: boolean }[];
};

export type IfoodMerchantDetails = {
  id: string;
  name: string;
  corporateName: string;
  description?: string;
  averageTicket?: number;
  exclusive?: boolean;
  type?: string;
  status?: string;
  createdAt?: string;
  address?: IfoodMerchantAddress;
  operations?: IfoodMerchantOperation[];
};

export type IfoodMerchantStatusValidation = {
  id: string;
  code: string;
  state: string;
  message: { title: string; subtitle?: string; description?: string };
};

export type IfoodMerchantStatusItem = {
  operation?: string;
  salesChannel?: string;
  available?: boolean;
  state?: string;
  validations?: IfoodMerchantStatusValidation[];
};

export type IfoodMerchantStatusResponse = {
  merchantId?: string;
  state?: string;
  message?: string;
  items?: IfoodMerchantStatusItem[];
  // A doc mostra um array de status; aceitamos ambos os formatos.
  operation?: string;
  salesChannel?: string;
  available?: boolean;
  validations?: IfoodMerchantStatusValidation[];
};

export type IfoodEnvironment = 'sandbox' | 'production';
