import { Hono } from "hono";
import { config } from "dotenv";
import { cors } from "hono/cors";
import {
  UserInfoAuthRouter,
  verifyWebhookRouter,
  WebHookEventRouter,
  SignInRouter,
  AddInstagramReelRouter,
} from "./routes";
import { serve } from "bun";
import { prisma } from "./libs/prisma";
import axios from "axios";

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

app.route("/api/addInstagramReel", AddInstagramReelRouter);

app.route("/api/signin", SignInRouter);

app.get("/api/deleteVideo", async (c) => {
  const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY!;
  const ImageKitAuth = Buffer.from(`${imageKitPrivateKey}:`).toString("base64");
  const reels = await prisma.reel.findMany({});

  for (const reel of reels) {
    const imageKitId = reel.fileId;
    // ✅ Prepare API options for deleting image from ImageKit
    const options = {
      method: "DELETE",
      url: `https://api.imagekit.io/v1/files/${imageKitId}`,
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${ImageKitAuth}`,
      },
    };

    try {
      // ✅ Delete image from ImageKit first
      const response = await axios.request(options);

      return c.json({ success: true, response: response.data });
    } catch (error: any) {
      console.error(
        "❌ ImageKit Deletion Error:",
        error.response?.data || error.message,
      );
      return c.json(
        { success: false, message: "Failed to delete image from ImageKit." },
        { status: 500 },
      );
    }
  }
});

serve({ fetch: app.fetch, port: 8000 });
