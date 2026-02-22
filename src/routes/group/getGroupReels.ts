import { Hono } from "hono";
import { handelAsyc } from "../../helper/validation/handelAsync";
import { prisma } from "../../libs/prisma";
import { getReelUrl } from "../../helper/getReelUrl";
import { getUserInfo } from "../../helper/auth/getUserInfo";
export const GetGroupReelsRouter = new Hono();

GetGroupReelsRouter.get("/", async (c) => {
  const groupId = c.req.query("groupId");
  const userId = c.req.query("userId");
  const cursor = Number(c.req.query("cursor")) || 0;
  const limit = Number(c.req.query("limit")) || 8;

  if (!groupId || !userId) {
    return c.json({ success: false, message: "Invalid inputs" }, 401);
  }

  const userResponse = await getUserInfo(userId);
  if (!userResponse.success) {
    return c.json({ success: false, message: userResponse.message }, 401);
  }
  const userRoleResponse = await handelAsyc(async () => {
    const userRole = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
      select: {
        role: true,
      },
    });
    return userRole?.role;
  }, "Error in getting user role");

  if (!userRoleResponse.success) {
    return c.json({ success: false, message: userRoleResponse.message }, 401);
  }
  const userRole = userRoleResponse.data;
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
      role: userRole,
    };
  }, "Error in Getting Group Reels");
  if (!res.success) {
    return c.json({ success: false, message: res.message });
  }

  return c.json(res);
});
