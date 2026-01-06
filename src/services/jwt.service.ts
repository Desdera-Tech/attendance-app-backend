import jwt, { SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env.ts";
import { Role } from "../generated/prisma/enums.ts";
import { redis } from "../config/redis.ts";
import { adminRoles } from "../core/utils/permissions.ts";

export interface TokenPayload {
  userId: string;
  type: "access" | "refresh";
  role: Role;
}

export class JwtService {
  private jwtSecret = ENV.JWT_SECRET!;

  private accessOptions: SignOptions = { expiresIn: "15m" };
  private refreshOptions: SignOptions = { expiresIn: "7d" };

  generateAccessToken(payload: Omit<TokenPayload, "type">) {
    return jwt.sign(
      { ...payload, type: "access" },
      this.jwtSecret,
      this.accessOptions
    );
  }

  generateRefreshToken(payload: Omit<TokenPayload, "type">) {
    return jwt.sign(
      { ...payload, type: "refresh" },
      this.jwtSecret,
      this.refreshOptions
    );
  }

  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtSecret) as TokenPayload;
  }

  getClaims(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload | null;
    } catch {
      return null;
    }
  }

  getVerifiedClaims(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }

  getTokenClaims(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload | null;
      if (!decoded) return null;

      return jwt.verify(token, this.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }

  async storeRefreshToken(
    identifier: string,
    token: string,
    expiresInSeconds: number
  ) {
    const claims = this.getVerifiedClaims(token);
    if (!claims) return;

    const isAdmin = adminRoles.includes(claims.role);

    // Add token to a Redis set for the user
    await redis.sadd(
      `refresh_tokens:${isAdmin ? "admin" : "user"}:${identifier}`,
      token
    );

    // Set expiry for the token individually (optional, helps auto-cleanup)
    await redis.set(`refresh_token:${token}`, "1", "EX", expiresInSeconds);
  }

  async getAllRefreshTokens(
    identifier: string,
    isAdmin: boolean
  ): Promise<string[]> {
    const tokens = await redis.smembers(
      `refresh_tokens:${isAdmin ? "admin" : "user"}:${identifier}`
    );
    return tokens;
  }

  async blacklistRefreshToken(
    identifier: string,
    token: string,
    expiresInSeconds: number
  ) {
    const claims = this.getVerifiedClaims(token);
    if (!claims) return;

    const isAdmin = adminRoles.includes(claims.role);

    // Remove from the user’s active set
    await redis.srem(
      `refresh_tokens:${isAdmin ? "admin" : "user"}:${identifier}`,
      token
    );

    // Mark it explicitly as blacklisted
    await redis.set(
      `blacklisted_refresh:${token}`,
      "1",
      "EX",
      expiresInSeconds
    );
  }

  async isRefreshTokenBlacklisted(token: string) {
    const exists = await redis.exists(`blacklisted_refresh:${token}`);
    return exists === 1;
  }
}

export const jwtService = new JwtService();
