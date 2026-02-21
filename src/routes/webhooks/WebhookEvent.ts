import { Hono } from "hono";
import { extractUserId } from "../../helper/extarctUserId";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { queues } from "../../queue/defination";
import { queueNames } from "../../queue/config";
import { prisma } from "../../libs/prisma";

export const WebHookEventRouter = new Hono();

WebHookEventRouter.post("/", async (c) => {
  const body = await c.req.json();

  console.log("\n========== INSTAGRAM WEBHOOK ==========");
  console.log("Time:", new Date().toISOString());
  console.log("Object:", body.object);

  try {
    if (body.object === "instagram") {
      for (const entry of body.entry) {
        const webhook_event = entry.messaging?.[0];
        if (!webhook_event) continue;

        const senderID = webhook_event.sender?.id;
        const textMessage = webhook_event.message?.text;
        const attachments = webhook_event.message?.attachments;

        console.log("\n--- New Event ---");
        console.log("Sender ID:", senderID);
        console.log("Text:", textMessage);
        console.log("Attachments:", attachments?.length || 0);

        // =====================
        // 1️⃣ Text Message Flow
        // =====================
        if (textMessage) {
          const userId = extractUserId(textMessage);
          console.log("Extracted UserId:", userId);

          if (userId && senderID) {
            const response = await addReciverId(userId, senderID);
            if (!response.success) {
              console.error("Add Receiver Failed:", response.message);
            }
          }
        }

        // =====================
        // 2️⃣ Attachment Flow
        // =====================
        if (attachments && senderID) {
          for (const attachment of attachments) {
            const attachmentType = attachment.type;
            console.log("Attachment Type:", attachmentType);

            if (attachmentType !== "ig_reel") continue;

            const { title, url, reel_video_id } = attachment.payload || {};
            const igReelId = reel_video_id;

            console.log("Reel Received:", {
              igReelId,
              title,
              url,
            });

            if (!igReelId || !url) {
              console.error("Invalid reel payload");
              continue;
            }

            // 1️⃣ Check receiver exists
            const receiverResponse = await checkReciverExits(senderID);
            if (!receiverResponse.success) {
              console.error("Receiver Check Failed:", receiverResponse.message);
              continue;
            }

            const userId = receiverResponse.user!.id;
            console.log("User Found:", userId);

            // 2️⃣ Check reel already exists
            const reelCheck = await checkReelExits(igReelId, userId);
            if (reelCheck.success) {
              console.log("Reel already exists. Skipping processing.");
              continue;
            }

            // 3️⃣ Add to queue
            console.log("Adding reel to convert queue...");

            await queues.convertURLToVideoQueue.add(
              queueNames.convertUrlToVideo,
              {
                igReelId,
                igUserId: senderID,
                fileName: `${Date.now()}.mp4`,
                title: title ?? "Untitled",
                reelURL: url,
              },
            );

            console.log("Reel added to queue successfully");
          }
        }
      }
    } else {
      console.log("Ignored webhook object:", body.object);
    }
  } catch (error) {
    console.error("Webhook Processing Error:", error);
  }

  console.log("=======================================\n");
  return c.text("EVENT_RECEIVED", 200);
});

// =============================
// Helper Functions
// =============================

const addReciverId = async (userId: string, reciverId: string) => {
  console.log("Adding ReceiverId:", { userId, reciverId });

  const userResponse = await getUserInfo(userId);
  if (!userResponse.success) {
    console.error("User validation failed:", userResponse.message);
    return { success: false, message: userResponse.message };
  }

  await queues.addInstaReciverIdQueue.add(queueNames.addInstagramReciverId, {
    userId,
    reciverId,
  });

  console.log("ReceiverId queued");
  return { success: true, message: "ReciverId added successfully" };
};

const checkReciverExits = async (reciverId: string) => {
  console.log("Checking ReceiverId:", reciverId);

  const user = await prisma.user.findUnique({
    where: { reciverId },
  });

  if (!user) {
    console.error("ReceiverId not found");
    return { success: false, message: "ReciverId not found" };
  }

  console.log("ReceiverId belongs to user:", user.id);
  return { success: true, message: "ReciverId found", user };
};

const checkReelExits = async (igReelId: string, userId: string) => {
  console.log("Checking Reel:", igReelId);

  const existingReel = await prisma.reel.findUnique({
    where: { ig_reel_id: igReelId },
  });

  if (existingReel) {
    console.log("Reel already exists. Linking to user:", userId);

    await prisma.userReel.create({
      data: {
        userId,
        reelId: existingReel.id,
      },
    });

    console.log("UserReel created");
    return { success: true, message: "Reel already exists in DB" };
  }

  console.log("Reel not found. Will process.");
  return { success: false, message: "Reel not found" };
};
