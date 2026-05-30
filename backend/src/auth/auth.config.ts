const DEVELOPMENT_JWT_SECRET = 'development-only-secret-change-me';
const DEVELOPMENT_ADMIN_REGISTRATION_CODE = 'RIADH-CHEF-2026';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }

  return DEVELOPMENT_JWT_SECRET;
}

export function getAdminRegistrationCode(): string | undefined {
  const code = process.env.ADMIN_REGISTRATION_CODE;
  if (code) {
    return code;
  }

  return process.env.NODE_ENV === 'production'
    ? undefined
    : DEVELOPMENT_ADMIN_REGISTRATION_CODE;
}
