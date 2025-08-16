export type JwtPayload = {
  sub: number; // user id
  email: string;
  roles: string[];
  jti?: string; // ใช้เฉพาะ refresh token
};
