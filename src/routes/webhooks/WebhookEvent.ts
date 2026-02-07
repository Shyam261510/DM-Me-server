import { Hono } from "hono";
import { extractUserId } from "../../helper/extarctUserId";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { queues } from "../../queue/defination";
import { queueNames } from "../../queue/config";
import { prisma } from "../../libs/prisma";

export const WebHookEventRouter = new Hono();

WebHookEventRouter.post("/", async (c) => {
  const body = await c.req.json();

  // Debug: Log the entire body to see what Meta is actually sending
  console.log("Full Webhook Payload");
  if (body.object === "instagram") {
    body.entry.forEach(async (entry: any) => {
      const webhook_event = entry.messaging[0];
      const senderID = webhook_event.sender.id;
      const textMessage = webhook_event.message?.text;
      const attachments = webhook_event.message?.attachments;

      if (textMessage) {
        const userId = extractUserId(textMessage);
        if (userId) {
          const response = await addReciverId(userId, senderID);
          if (!response.success) {
            console.log(`Issue in adding reciverId ${response.message}`);
          }
          console.log("ReciverId added successfully");
        }
      }

      attachments?.forEach(async (attachment: any) => {
        const attachmentType = attachment.type;

        if (attachmentType === "ig_reel") {
          const { title, url, reel_video_id } = attachment.payload;

          const id = reel_video_id;
          const user = await checkReciverExits(senderID);
          if (!user.success) {
            console.log({ success: false, message: user.message });
            return c.text("EVENT_RECEIVED", 200);
          }

          await queues.convertURLToVideoQueue.add(
            queueNames.convertUrlToVideo,
            {
              igReelId: id,
              igUserId: senderID,
              fileName: `${Date.now()}.mp4`,
              title: title ?? "Untitled",
              reelURL: url,
            },
          );
        }
      });
    });
  }

  return c.text("EVENT_RECEIVED", 200);
});

const addReciverId = async (userId: string, reciverId: string) => {
  const userResponse = await getUserInfo(userId);
  if (!userResponse.success) {
    return { success: false, message: userResponse.message };
  }

  await queues.addInstaReciverIdQueue.add(queueNames.addInstagramReciverId, {
    userId,
    reciverId,
  });

  return { success: true, message: "ReciverId added successfully" };
};

// checking the user is exits based on the reciver id
const checkReciverExits = async (reciverId: string) => {
  if (!reciverId) {
    return { success: false, message: "ReciverId is required" };
  }
  const user = await prisma.user.findUnique({
    where: {
      reciverId,
    },
  });
  if (!user) {
    return { success: false, message: "ReciverId not found" };
  }

  return { success: true, message: "ReciverId found" };
};
