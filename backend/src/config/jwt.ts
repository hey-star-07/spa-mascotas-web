export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'pet-spa-default-secret-change-in-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'pet-spa-refresh-secret-change-in-production',
  expiration: process.env.JWT_EXPIRATION || '1h',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  issuer: 'pet-spa-api',
  audience: 'pet-spa-client',
};