import { prisma } from "../../libs/prisma";
import { redis } from "../../libs/RedisProvider";
import { queueNames } from "../../queue/config";
import { queues } from "../../queue/defination";
import { handelAsyc } from "../validation/handelAsync";

const USER_INCLUDE = {
  reels: {
    include: {
      reel: true,
    },
  },
  team: {
    include: {
      teamMembers: {
        include: {
          user: {
            include: {
              reels: {
                include: {
                  reel: true,
                },
              },
            },
          },
        },
      },
    },
  },
};

export const getUserInfo = async (userId?: string, email?: string) => {
  if (!userId && !email) {
    return { success: false, message: "Inputs are missing." };
  }
  return handelAsyc(
    async () => {
      const cacheKey = userId ? `user:${userId}` : `user:email:${email}`;
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached.success && cached.data) {
        return { success: true, user: cached.data };
      }
      // Fetch from database
      const user = await prisma.user.findFirst({
        where: userId ? { id: userId } : { email },
        include: USER_INCLUDE,
      });

      // Cache asynchronously (don't await)
      queues.addDataToRedisQueue
        .add(queueNames.addDataToRedis, {
          key: cacheKey,
          value: user,
        })
        .catch((err) => console.error("Cache queue error:", err));
      return { success: true, user };
    },
    `Error fetching user: ${userId || email}`,
  );
};
