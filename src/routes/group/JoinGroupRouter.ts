import { Hono } from "hono";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { GetGroupInfo } from "../../helper/group/GroupInfo";
import { prisma } from "../../libs/prisma";
import { Role } from "../../generated/prisma/enums";
import { handelAsyc } from "../../helper/validation/handelAsync";
import z from "zod";
import { validateSchema } from "../../helper/validation/ValidateSchema";

export const JoinGroupRouter = new Hono();

// 1. schema.ts — owns validation only
const JoinGroupSchema = z.object({
  userId: z.string().min(1, "User id is required"),
  groupId: z.string().min(1, "Group id is required"),
});

interface MembershipStrategy {
  addMember(
    userId: string,
    groupId: string,
  ): Promise<{ success: boolean; message: string }>;
}
// 2. membership.strategy.ts — OCP fix, injectable behavior
class MembershipStrategyService implements MembershipStrategy {
  async addMember(
    userId: string,
    groupId: string,
  ): Promise<{ success: boolean; message: string }> {
    const addMemberResponse = await handelAsyc(async () => {
      await prisma.groupMember.upsert({
        where: {
          id: groupId,
          userId: userId,
        },
        update: {},
        create: {
          userId,
          groupId,
          role: Role.MEMBER,
        },
      });
      return { message: "Member added successfully" };
    }, "Error in adding group Member");
    if (!addMemberResponse.success) {
      return { success: false, message: addMemberResponse.message as string };
    }
    return {
      success: true,
      message: addMemberResponse.data?.message as string,
    };
  }
}
// 3. joinGroup.service.ts — pure business logic, no HTTP

class JoinGroupService {
  private readonly membership: MembershipStrategy;
  constructor(membership: MembershipStrategy) {
    this.membership = membership;
  }

  async join(userId: string, groupId: string) {
    const userResponse = await getUserInfo(userId);
    if (!userResponse.success) {
      return { success: false, message: userResponse.message };
    }
    const groupResponse = await GetGroupInfo({
      condition: { id: groupId },
      include: {},
    });
    if (!groupResponse.success || !groupResponse.data) {
      return {
        success: false,
        message: groupResponse.message ?? "Group not found",
      };
    }

    const addMemberResponse = await this.membership.addMember(userId, groupId);
    return addMemberResponse;
  }
}

// 4. router.ts — only HTTP concerns

const joinGroupService = new JoinGroupService(new MembershipStrategyService());

JoinGroupRouter.post("/", async (c) => {
  const body = await c.req.json();

  const validateBody = validateSchema(JoinGroupSchema, body);

  if (!validateBody.success) {
    return c.json({ success: false, message: validateBody.message });
  }
  const { userId, groupId } = validateBody.data as z.infer<
    typeof JoinGroupSchema
  >;
  const result = await joinGroupService.join(userId, groupId);
  return c.json(result);
});
