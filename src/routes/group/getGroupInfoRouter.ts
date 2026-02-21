import { Hono } from "hono";
import { handelAsyc } from "../../helper/validation/handelAsync";
import { prisma } from "../../libs/prisma";

export const GetGroupRouter = new Hono();

const INCLUDING_GROUP = {
  groupMembers: {
    include: {
      user: true,
    },
  },
};

GetGroupRouter.get("/", async (c) => {
  const userId = c.req.query("userId");

  if (!userId) {
    return c.json({ success: false, message: "Invalid inputs" });
  }

  const res = await handelAsyc(async () => {
    // first check that if user is the admin if the user is the admin then check based on userId in Group table and
    // if user is not the admin check based on userId in GroupMember tabel
    const Group = await (prisma.group.findMany({
      where: {
        adminId: userId,
      },
      include: INCLUDING_GROUP,
    }) ??
      prisma.groupMember.findMany({
        where: {
          userId,
        },
        include: {
          group: {
            include: INCLUDING_GROUP,
          },
        },
      }));

    return Group;
  }, "Error in Getting Group Info");

  return c.json(res);
});
