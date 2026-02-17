import { createClient } from "redis";
import { handelAsyc } from "../helper/validation/handelAsync";

export class RedisProvider {
  private static instance: RedisProvider;
  private client: ReturnType<typeof createClient>;

  private constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_SERVER_HOST,
        port: Number(process.env.REDIS_SERVER_PORT),
      },
    });
    // Error logging
    this.client.on("error", (err) => {
      console.error("Redis Error:", err);
    });
  }

  static getInstance(): RedisProvider {
    if (!RedisProvider.instance) {
      RedisProvider.instance = new RedisProvider();
      RedisProvider.instance.client.connect();
    }
    return RedisProvider.instance;
  }

  async get<T>(key: string) {
    return handelAsyc(async () => {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    }, `Redis GET failed (key: ${key})`);
  }

  async set<T>(key: string, value: T) {
    return handelAsyc(async () => {
      const payload = JSON.stringify(value);
      const res = await this.client.set(key, payload);
      if (res) {
        return {
          success: true,
          data: value,
        };
      }
      return {
        success: false,
        message: "Redis SET failed",
      };
    }, `Redis SET failed (key: ${key})`);
  }

  async del<T>(key: string) {
    return handelAsyc(async () => {
      if (await this.client.exists(key)) {
        await this.client.del(key);

        return;
      }
      return;
    }, `Redis DEL failed Key: ${key}`);
  }
}

export const redis = RedisProvider.getInstance();
