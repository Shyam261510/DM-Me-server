import { Hono } from "hono";
import { getUserInfo } from "../../helper/auth/getUserInfo";

export const UserInfoAuthRouter = new Hono();

UserInfoAuthRouter.get("/", async (c) => {
  const userId = c.req.query("userId");
  const email = c.req.query("email");

  try {
    const { success, message, user } = await getUserInfo(userId, email);

    if (!success) return c.json({ success, message }, 400);

    return c.json({ success: true, user }, 200);
  } catch (error) {
    console.error("Error fetching user info:", error);

    return c.json({ success: false, message: "Internal server error" }, 500);
  }
});
