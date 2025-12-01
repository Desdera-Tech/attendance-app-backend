import Redis from "ioredis";
import { ENV } from "./env";

export const redis = new Redis({
  host: ENV.REDIS_HOST,
  port: Number(ENV.REDIS_PORT),
  password: ENV.REDIS_PASSWORD,
});
