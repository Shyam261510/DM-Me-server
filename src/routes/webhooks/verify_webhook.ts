import { Hono } from "hono";

export const verifyWebhookRouter = new Hono();
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

verifyWebhookRouter.get("/", async (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");

  if (mode && token) {
    if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      return c.text(challenge as string, 200);
    }
  }
  return c.text("Verification Failed", 403);
});
