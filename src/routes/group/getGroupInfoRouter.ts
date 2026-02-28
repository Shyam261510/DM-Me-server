import { Hono } from "hono";

import { prisma } from "../../libs/prisma";
import { getReelUrl } from "../../helper/getReelUrl";
import { Role } from "../../generated/prisma/client";

export const GetGroupRouter = new Hono();
const GROUP_MEMBER_INCLUDES = {
  select: {
    role: true,
    id: true,
    user: {
      select: {
        id: true,
        username: true,
        reels: {
          skip: 0,
          take: 3,
          select: {
            reel: {
              select: {
                id: true,
                fileName: true,
              },
            },
          },
        },
      },
    },
  },
};
const INCLUDING_GROUP = {
  group: {
    select: {
      id: true,
      groupName: true,
      adminId: true,
      createdAt: true,
      groupMembers: GROUP_MEMBER_INCLUDES,
    },
  },
};

const getGroupsByAdmin = async (userId: string) => {
  const groups = await prisma.group.findMany({
    where: { adminId: userId },
    include: { groupMembers: GROUP_MEMBER_INCLUDES },
  });
  return await formatGroups(groups);
};

const getGroupsByMember = async (userId: string) => {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: INCLUDING_GROUP,
  });
  return await formatGroups(memberships.map((membership) => membership.group));
};

interface GroupInfo {
  id: string;
  groupName: string;
  adminId: string;
  reels: string[];
  createdAt: Date;
  groupMembers: {
    username: string;
    userId: string;
    role: Role;
    id: string;
  }[];
}

async function formatGroups(groups: any[]): Promise<GroupInfo[]> {
  const formattedGroups: GroupInfo[] = [];

  for (const group of groups) {
    const reelUrls: string[] = [];
    for (const member of group.groupMembers) {
      const userReels = member.user.reels;

      for (const reel of userReels) {
        const reelUrlResponse = await getReelUrl(reel.reel?.fileName as string);
        if (reelUrlResponse.success) {
          reelUrls.push(reelUrlResponse.data as string);
        }
      }
    }
    formattedGroups.push({
      id: group.id,
      groupName: group.groupName,
      adminId: group.adminId,
      reels: reelUrls,
      createdAt: group.createdAt,
      groupMembers: group.groupMembers.map((m: any) => ({
        username: m.user.username,
        userId: m.user.id,
        role: m.role,
        id: m.id,
      })),
    });
  }

  return formattedGroups;
}

// 2. service.ts — business logic only, OCP fix via injected strategies
type GroupFetchStrategy = (userId: string) => Promise<any>;

class GetGroupService {
  private readonly strategies: GroupFetchStrategy[];
  constructor(strategies: GroupFetchStrategy[]) {
    this.strategies = strategies;
  }

  async getGroups(userId: string) {
    for (const strategy of this.strategies) {
      const result = await strategy(userId);
      if (result.length > 0) return { success: true, data: result };
    }
    return { success: true, data: [] };
  }
}

// wire up — adding a new role = add a new strategy, touch nothing else ✅
const getGroupService = new GetGroupService([
  getGroupsByAdmin,
  getGroupsByMember,
]);

// 3. router.ts — HTTP concerns only
GetGroupRouter.get("/", async (c) => {
  const userId = c.req.query("userId");

  if (!userId) {
    return c.json({ success: false, message: "Invalid inputs" });
  }

  const result = await getGroupService.getGroups(userId);
  return c.json(result);
});
