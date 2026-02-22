/**
 * ============================================================
 * WebHookEventRouter — Instagram Webhook Workflow Overview
 * ============================================================
 *
 *  ENTRY POINT
 *  ───────────
 *  POST /  ← Instagram sends all DM events here
 *  Guards: only processes body.object === "instagram"
 *
 *  LOOP: for each entry → entry.messaging[0]
 *  ─────────────────────────────────────────
 *
 *  1️⃣  TEXT MESSAGE FLOW  (textMessage && senderID)
 *  ──────────────────────────────────────────────────
 *  • Skip internal confirmation messages from JustDM account
 *  • extractEmail()      – parse email address out of the message text
 *  • getUserInfo()       – look up the user by extracted email
 *      └─ found  → addReciverId()
 *                   ├─ getUserInfo() again to validate userId
 *                   └─ queue job → addInstaReciverIdQueue
 *      └─ not found / no email → log and continue
 *
 *  2️⃣  ATTACHMENT FLOW  (attachments && senderID)
 *  ─────────────────────────────────────────────────
 *  • Loop every attachment, skip anything that isn't "ig_reel"
 *  • For each ig_reel:
 *      ├─ checkReciverExits(senderID)
 *      │    └─ prisma.user.findUnique({ reciverId })
 *      │    └─ fail → skip this reel
 *      │
 *      ├─ checkReelExits(igReelId, userId)
 *      │    └─ reel exists in DB → create UserReel link → skip queue
 *      │    └─ reel not found   → proceed to queue
 *      │
 *      └─ queues.convertURLToVideoQueue.add()
 *           payload: { igReelId, igUserId, fileName, title, reelURL }
 *
 *  ALWAYS RETURNS
 *  ──────────────
 *  c.text("EVENT_RECEIVED", 200)  — Instagram requires a 200 to stop retries
 *
 *  HELPER FUNCTIONS
 *  ────────────────
 *  addReciverId(userId, reciverId)    – validate user → queue link job
 *  checkReciverExits(reciverId)       – DB lookup by reciverId → return user
 *  checkReelExits(igReelId, userId)   – DB lookup by ig_reel_id →
 *                                       if found, create UserReel + skip queue
 *
 * ============================================================
 */

import { Hono } from "hono";
import { extractEmail } from "../../helper/extractEmail";
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
  console.log("Entries Count:", body.entry?.length || 0);

  try {
    if (body.object === "instagram") {
      let entryIndex = 0;

      for (const entry of body.entry) {
        entryIndex++;

        const webhook_event = entry.messaging?.[0];
        if (!webhook_event) {
          console.log(`Entry ${entryIndex}: No messaging event`);
          continue;
        }

        const senderID = webhook_event.sender?.id;
        const textMessage = webhook_event.message?.text;
        const attachments = webhook_event.message?.attachments;

        console.log(`\n--- Event ${entryIndex} ---`);
        console.log("Sender ID:", senderID);
        console.log("Text:", textMessage || "No text");
        console.log("Attachments Count:", attachments?.length || 0);

        // =====================
        // 1️⃣ TEXT MESSAGE FLOW
        // =====================
        if (textMessage && senderID) {
          if (textMessage === "Your account has been successfully configure") {
            // this message is send my the JustDM instagram account so we don't to process it any more
            return c.text("EVENT_RECEIVED", 200);
          }
          console.log("[Text Flow] Extracting email...");
          const userEmail = extractEmail(textMessage);

          if (!userEmail) {
            console.log("[Text Flow] No email found in message");
          } else {
            console.log("[Text Flow] Email extracted:", userEmail);

            console.log("[Text Flow] Fetching user...");
            const userResponse = await getUserInfo(
              undefined,
              userEmail as string,
            );

            if (!userResponse.success) {
              console.error(
                "[Text Flow] User validation failed:",
                userResponse.message,
              );
            } else {
              const userId = userResponse.user?.id;
              console.log("[Text Flow] User found:", userId);

              if (userId) {
                const response = await addReciverId(userId, senderID);

                if (!response.success) {
                  console.error(
                    "[Text Flow] Add Receiver Failed:",
                    response.message,
                  );
                } else {
                  console.log("[Text Flow] ReceiverId linked successfully");
                }
              }
            }
          }
        }

        // =====================
        // 2️⃣ ATTACHMENT FLOW
        // =====================
        if (attachments && senderID) {
          let attachmentIndex = 0;

          for (const attachment of attachments) {
            attachmentIndex++;

            const attachmentType = attachment.type;
            console.log(
              `[Attachment ${attachmentIndex}] Type:`,
              attachmentType,
            );

            if (attachmentType !== "ig_reel") {
              console.log("Skipped: Not an ig_reel");
              continue;
            }

            const { title, url, reel_video_id } = attachment.payload || {};
            const igReelId = reel_video_id;

            console.log("[Reel] Payload:", {
              igReelId,
              title,
              url,
            });

            if (!igReelId || !url) {
              console.error("[Reel] Invalid payload");
              continue;
            }

            // 1️⃣ Check receiver exists
            const receiverResponse = await checkReciverExits(senderID);
            if (!receiverResponse.success) {
              console.error(
                "[Reel] Receiver check failed:",
                receiverResponse.message,
              );
              continue;
            }

            const userId = receiverResponse.user!.id;
            console.log("[Reel] Receiver mapped to user:", userId);

            // 2️⃣ Check if reel already exists
            const reelCheck = await checkReelExits(igReelId, userId);
            if (reelCheck.success) {
              console.log("[Reel] Already processed. Skipping queue.");
              continue;
            }

            // 3️⃣ Add to queue
            const jobPayload = {
              igReelId,
              igUserId: senderID,
              fileName: `${Date.now()}.mp4`,
              title: title ?? "Untitled",
              reelURL: url,
            };

            console.log("[Reel] Queue Payload:", jobPayload);
            console.log("[Reel] Adding job to queue...");

            await queues.convertURLToVideoQueue.add(
              queueNames.convertUrlToVideo,
              jobPayload,
            );

            console.log("[Reel] Queue job added successfully");
          }
        }
      }
    } else {
      console.log("Ignored webhook object:", body.object);
    }
  } catch (error) {
    console.error("Webhook Processing Error:", error);
  }

  console.log("========== WEBHOOK END ==========\n");
  // Always return 200 — Instagram will keep retrying until it receives one
  return c.text("EVENT_RECEIVED", 200);
});

// =====================================
// Helper Functions
// =====================================

const addReciverId = async (userId: string, reciverId: string) => {
  console.log("[addReciverId] Start", { userId, reciverId });

  const userResponse = await getUserInfo(userId);
  if (!userResponse.success) {
    console.error(
      "[addReciverId] User validation failed:",
      userResponse.message,
    );
    return { success: false, message: userResponse.message };
  }

  await queues.addInstaReciverIdQueue.add(queueNames.addInstagramReciverId, {
    userId,
    reciverId,
  });

  console.log("[addReciverId] ReceiverId queued");
  return { success: true, message: "ReciverId added successfully" };
};

const checkReciverExits = async (reciverId: string) => {
  console.log("[checkReciverExits] Checking:", reciverId);

  const user = await prisma.user.findUnique({
    where: { reciverId },
  });

  if (!user) {
    console.error("[checkReciverExits] Not found");
    return { success: false, message: "ReciverId not found" };
  }

  console.log("[checkReciverExits] Found user:", user.id);
  return { success: true, message: "ReciverId found", user };
};

const checkReelExits = async (igReelId: string, userId: string) => {
  console.log("[checkReelExits] Checking reel:", igReelId);

  const existingReel = await prisma.reel.findUnique({
    where: { ig_reel_id: igReelId },
  });

  if (existingReel) {
    console.log("[checkReelExits] Reel exists. Linking to user:", userId);

    await prisma.userReel.create({
      data: {
        userId,
        reelId: existingReel.id,
      },
    });

    console.log("[checkReelExits] UserReel created");
    return { success: true, message: "Reel already exists in DB" };
  }

  console.log("[checkReelExits] Reel not found");
  return { success: false, message: "Reel not found" };
};
