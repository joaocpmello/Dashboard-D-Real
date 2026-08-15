// Resposta do endpoint OAuth do iFood (POST /authentication/v1.0/oauth/token).
// Formato confirmado na doc oficial: https://developer.ifood.com.br/pt-BR/docs/guides/modules/authentication/intro
export type IfoodTokenResponse = {
  accessToken: string;
  type: 'bearer';
  expiresIn: number; // segundos (≈ 21600 = 6h)
};

export type IfoodToken = {
  token: string;
  expiresAt: Date; // computed localmente
};
