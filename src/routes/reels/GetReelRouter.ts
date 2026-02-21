import { Hono } from "hono";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { handelAsyc } from "../../helper/validation/handelAsync";
import { User } from "../../generated/prisma/client";
import { prisma } from "../../libs/prisma";
import { getReelUrl } from "../../helper/getReelUrl";

export const GetReelRouter = new Hono();

GetReelRouter.get("/", async (c) => {
  const userId = c.req.query("userId");
  const cursor = Number(c.req.query("cursor")) || 0;
  const limit = Number(c.req.query("limit")) || 8;
  if (!userId) {
    return c.json({ success: false, message: "Invalid inputs" }, 401);
  }

  const userResponse = await getUserInfo(userId);

  if (!userResponse.success) {
    return c.json({ success: false, message: userResponse.message });
  }
  const reelsResponse = await getReels(
    userResponse.user as User,
    cursor,
    limit,
  );

  return c.json(reelsResponse);
});

const getReels = async (user: User, cursor: number, limit: number) => {
  const response = await handelAsyc(async () => {
    const reels = await prisma.userReel.findMany({
      where: {
        userId: user.id,
      },
      skip: cursor,
      take: limit,
      include: {
        reel: true,
      },
    });
    const reelsInfo = [];
    for (const reel of reels) {
      const reelUrl = await getReelUrl(reel.reel?.fileName as string);
      reelsInfo.push({ ...reel.reel, url: reelUrl.data || "" });
    }
    return {
      reels: reelsInfo,
      cursor: cursor + limit,
      hasNext: reelsInfo.length !== 0,
    };
  }, `Error in getting reels for user :${user.username}`);

  return response;
};
