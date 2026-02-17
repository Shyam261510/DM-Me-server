import { Hono } from "hono";
import z from "zod";
import { validateSchema } from "../../helper/validation/ValidateSchema";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { prisma } from "../../libs/prisma";
import { Role } from "../../generated/prisma/enums";
import { handelAsyc } from "../../helper/validation/handelAsync";
const groupRouter = new Hono();

const CreateTeamSchema = z.object({
  groupName: z
    .string()
    .min(5, { message: "Group Name must be at least 5 characters" }),
  userId: z.string().min(1, { message: "userId is required" }),
});

class Group {
  async createGroup() {
    return groupRouter.post("/", async (c) => {
      const body = await c.req.json();
      const validateBody = validateSchema(CreateTeamSchema, body);
      if (!validateBody.success) {
        return c.json({ success: false, message: validateBody.message }, 400);
      }
      const { userId, groupName } = validateBody.data as z.infer<
        typeof CreateTeamSchema
      >;
      
      const response = await handelAsyc(async () => {
        const userResponse = await getUserInfo(userId);
        if (!userResponse.success) {
          return { success: false, message: userResponse.message };
        }

        const newGroup = await prisma.group.create({
          data: {
            groupName,
          },
        });

        // add the creater in the group memeber
        await prisma.groupMember.upsert({
          where: {
            userId,
          },
          update: {},
          create: {
            userId,
            groupId: newGroup.id,
            role: Role.ADMIN,
          },
        });
      }, `Error in creating group for userId: ${userId}`);

      return c.json(response);
    });
  }

}
