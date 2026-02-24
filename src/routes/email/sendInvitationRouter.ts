/**
 * ============================================================
 * SendInvitionRouter — Workflow Overview
 * ============================================================
 *
 *  ENTRY POINT
 *  ───────────
 *  POST /  ← caller sends a list of emails + groupName + userId
 *
 *  FLOW
 *  ────
 *  1. Parse body        – read raw JSON from the request
 *  2. Validate          – run SendInvitionSchema (zod)
 *       └─ fail  → return { success: false, message } immediately
 *       └─ pass  → destructure { emails, userId, groupName }
 *  3. getUserInfo()     – fetch the invitor's profile by userId
 *       └─ fail  → return { success: false, message } immediately
 *       └─ pass  → use user.username in the email subject
 *  4. Queue loop        – for each email in emails[]:
 *       └─ queues.sendMessageQueue.add()
 *            payload: { email, subject, message }
 *  5. Respond           – return { success: true } once all jobs are queued
 *
 *  VALIDATION  (SendInvitionSchema)
 *  ─────────────────────────────────
 *  emails    – non-empty array of valid email strings
 *  groupName – required string (min 1 char)
 *  userId    – required string (min 1 char)
 *
 * ============================================================
 */

import { queues } from "../../queue/defination";
import { Hono } from "hono";
import z from "zod";
import { queueNames } from "../../queue/config";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { getEmailBody } from "../../libs/getEmailBody";

export const SendInvitionRouter = new Hono();

// ── Schema: validate all required fields before touching the queue ──
const SendInvitionSchema = z.object({
  emails: z.array(z.email("Please enter a valid email address")),
  groupName: z.string().min(1, "Group name is required"),
  userId: z.string().min(1, "User id is required"),
  groupId: z.string().min(1, "Group id is required"),
});

SendInvitionRouter.post("/", async (c) => {
  const body = await c.req.json();

  // Validate the request body — return early if any field is invalid
  const validate = SendInvitionSchema.safeParse(body);
  if (!validate.success) {
    return c.json({ success: false, message: validate.error.message });
  }

  const { emails, userId, groupName, groupId } = validate.data;

  // Fetch the invitor's profile to get their username for the email subject
  const userResponse = await getUserInfo(userId);
  if (!userResponse.success) {
    return c.json({ success: false, message: userResponse.message });
  }

  // Queue one invitation email job per recipient
  for (const email of emails) {
    await queues.sendMessageQueue.add(queueNames.sendMessage, {
      email,
      subject: `${userResponse?.user?.username} invited you to join ${groupName} group on Just DM`,
      message: getEmailBody(
        userResponse?.user?.username as string,
        groupName,
        groupId,
      ),
    });
  }

  return c.json({ success: true, message: "Invitation send successfully" });
});
