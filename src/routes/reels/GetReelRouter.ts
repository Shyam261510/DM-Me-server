import { Hono } from "hono";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { handelAsyc } from "../../helper/validation/handelAsync";
import { User } from "../../generated/prisma/client";
import { prisma } from "../../libs/prisma";

export const GetReelRouter = new Hono();

GetReelRouter.get("/", async (c) => {
  const userId = c.req.query("userId");

  const userResponse = await getUserInfo(userId);

  if (!userResponse.success) {
    return c.json({ success: false, message: userResponse.message });
  }
  const reelsResponse = await getReels(userResponse.user as User);

  return c.json(reelsResponse);
});

const getReels = async (user: User) => {
  const response = await handelAsyc(async () => {
    const reels = await prisma.userReel.findMany({
      where: {
        userId: user.id,
      },
      include: {
        reel: true,
      },
    });
    return reels;
  }, `Error in getting reels for user :${user.username}`);

  return response;
};
