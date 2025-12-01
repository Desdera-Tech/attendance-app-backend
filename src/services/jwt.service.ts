import jwt, { SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env.ts";
import { Role } from "../generated/prisma/enums.ts";
import { redis } from "../config/redis.ts";

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

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.jwtSecret) as TokenPayload;
  }

  async storeRefreshToken(
    identifier: string,
    token: string,
    expiresInSeconds: number
  ) {
    // Add token to a Redis set for the user
    await redis.sadd(`refresh_tokens:${identifier}`, token);

    // Set expiry for the token individually (optional, helps auto-cleanup)
    await redis.set(`refresh_token:${token}`, "1", "EX", expiresInSeconds);
  }

  async getAllRefreshTokens(identifier: string): Promise<string[]> {
    const tokens = await redis.smembers(`refresh_tokens:${identifier}`);
    return tokens;
  }

  async blacklistRefreshToken(
    identifier: string,
    token: string,
    expiresInSeconds: number
  ) {
    // Remove from the user’s active set
    await redis.srem(`refresh_tokens:${identifier}`, token);

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
