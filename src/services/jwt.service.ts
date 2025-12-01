import jwt, { SignOptions } from "jsonwebtoken";
import { ENV } from "../config/env.ts";
import { Role } from "../generated/prisma/enums.ts";

interface TokenPayload {
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
}

export const jwtService = new JwtService();
