import { Hono } from "hono";
import { handelAsyc } from "../../helper/validation/handelAsync";
import { prisma } from "../../libs/prisma";
import { getReelUrl } from "../../helper/getReelUrl";
export const GetGroupReelsRouter = new Hono();

GetGroupReelsRouter.get("/", async (c) => {
  const groupId = c.req.query("groupId");
  const cursor = Number(c.req.query("cursor")) || 0;
  const limit = Number(c.req.query("limit")) || 8;

  if (!groupId) {
    return c.json({ success: false, message: "Invalid inputs" }, 401);
  }
  const res = await handelAsyc(async () => {
    const groupReels = await prisma.userReel.findMany({
      where: {
        user: {
          groupMembers: {
            some: {
              groupId,
            },
          },
        },
      },
      skip: cursor,
      take: limit,

      select: {
        user: {
          select: {
            username: true,
          },
        },
        reel: true,
      },
    });

    const reelsInfo = [];
    for (const reel of groupReels) {
      const reelUrl = await getReelUrl(reel.reel?.fileName as string);
      reelsInfo.push({ ...reel, reel: { ...reel.reel, url: reelUrl.data } });
    }

    return {
      reels: reelsInfo,
      cursor: cursor + limit,
      hasNext: groupReels.length !== 0,
    };
  }, "Error in Getting Group Reels");
  if (!res.success) {
    return c.json({ success: false, message: res.message });
  }

  return c.json(res);
});
