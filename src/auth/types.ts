export interface JwtAccessPayload {
  sub: string; // userId
  email: string;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string; // userId
  jti: string; // refresh token id, matches RefreshToken.id in DB
  type: 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
