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
    await redis.set(
      `active_refresh:${identifier}:${token}`,
      "1",
      "EX",
      expiresInSeconds
    );
  }

  async blacklistRefreshToken(token: string, expiresInSeconds: number) {
    await redis.set(`bl_refresh:${token}`, "1", "EX", expiresInSeconds);
  }

  async isRefreshTokenBlacklisted(token: string) {
    const exists = await redis.get(`bl_refresh:${token}`);
    return exists !== null;
  }
}

export const jwtService = new JwtService();
