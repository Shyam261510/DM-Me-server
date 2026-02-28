import { queues } from "../../queue/defination";
import { Hono } from "hono";
import z from "zod";
import { queueNames } from "../../queue/config";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { getEmailBody } from "../../libs/getEmailBody";
import { GetGroupInfo } from "../../helper/group/GroupInfo";
import { prisma } from "../../libs/prisma";
import { handelAsyc } from "../../helper/validation/handelAsync";
import { validateSchema } from "../../helper/validation/ValidateSchema";

type SendInvitationInput = z.infer<typeof SendInvitationSchema>;

interface NotificationStrategy {
  notify: (payload: {
    email: string;
    subject: string;
    message: string;
  }) => Promise<void>;
}

class SendEmailStrategy implements NotificationStrategy {
  async notify(payload: { email: string; subject: string; message: string }) {
    await queues.sendMessageQueue.add(queueNames.sendMessage, payload);
  }
}

class InivtationService {
  private readonly notifier: NotificationStrategy;

  constructor(notify: NotificationStrategy) {
    this.notifier = notify;
  }

  async addInvitation(groupId: string, email: string) {
    const response = await handelAsyc(async () => {
      const alreadyInvited = await prisma.invite.findFirst({
        where: { groupId, email },
      });

      if (!alreadyInvited) {
        await prisma.invite.create({ data: { groupId, email } });
      }

      return { message: "Inivtation added successfully" };
    }, "Error saving invitation");

    if (!response.success) {
      return { success: false, message: response.message };
    }

    return { success: true, message: response.data?.message };
  }

  async sendInvitations(input: SendInvitationInput) {
    const { emails, userId, groupName, groupId } = input;

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

    for (const email of emails) {
      const invited = await this.addInvitation(groupId, email);
      if (!invited.success) {
        return { success: false, message: `Failed to invite ${email}` };
      }

      await this.notifier.notify({
        email,
        subject: `${userResponse.user?.username} invited you to join ${groupName} on Just DM`,
        message: getEmailBody(
          userResponse.user?.username as string,
          groupName,
          groupId,
        ),
      });
    }

    return { success: true, data: groupResponse.data };
  }
}

const SendInvitationSchema = z.object({
  emails: z.array(z.email("Please enter a valid email address")),
  groupName: z.string().min(1, "Group name is required"),
  userId: z.string().min(1, "User id is required"),
  groupId: z.string().min(1, "Group id is required"),
});

export const SendInvitionRouter = new Hono();

const invitationService = new InivtationService(new SendEmailStrategy());

SendInvitionRouter.post("/", async (c) => {
  const body = await c.req.json();

  const validate = validateSchema(SendInvitationSchema, body);
  if (!validate.success) {
    return c.json({ success: false, message: validate?.message });
  }

  const result = await invitationService.sendInvitations(
    validate.data as z.infer<typeof SendInvitationSchema>,
  );
  if (!result.success) {
    return c.json({ success: false, message: result.message });
  }

  return c.json({
    success: true,
    message: "Invitation send successfully",
  });
});
