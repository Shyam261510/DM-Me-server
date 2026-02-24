import { Hono } from "hono";
import { config } from "dotenv";
import { cors } from "hono/cors";
import {
  UserInfoAuthRouter,
  verifyWebhookRouter,
  WebHookEventRouter,
  SignInRouter,
  AddInstagramReelRouter,
  CreateGroupRouter,
  AddMemberRouter,
  GetReelRouter,
  GetGroupRouter,
  GetGroupReelsRouter,
  SendInvitionRouter,
} from "./routes";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Bucket } from "./libs/Bucket";
import { serve } from "bun";

config();

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: [`${process.env.FRONTEND_ENDPOINT!}`, "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.route("/webhook", verifyWebhookRouter);

app.route("/webhook", WebHookEventRouter);

app.route("/api/get_user_info", UserInfoAuthRouter);

app.route("/api/getReels", GetReelRouter);

app.route("/api/addInstagramReel", AddInstagramReelRouter);

app.route("/api/signin", SignInRouter);

app.route("/api/createGroup", CreateGroupRouter);

app.route("/api/getGroupInfo", GetGroupRouter);

app.route("/api/getGroupReels", GetGroupReelsRouter);

app.route("/api/addMember", AddMemberRouter);

app.route("/api/sendInvitation", SendInvitionRouter);

app.delete("/deleteVideo", async (c) => {
  const fileName = "video.mp4";
  const command = new DeleteObjectCommand({
    Bucket: process.env.BUCKET_NAME!,
    Key: fileName,
  });
  try {
    const response = await Bucket.send(command);
    console.log(`Successfully deleted object: ${fileName}`, response);
    return c.json({ success: true, message: "Deletion successful" });
    // Note: The delete operation is idempotent; it responds with success even if the object didn't exist.
  } catch (err) {
    console.error(`Error deleting object: ${fileName}`, err);
    return c.json({ success: false, error: "Deletion failed" }, 500);
  }
});

serve({ fetch: app.fetch, port: 8000 });
