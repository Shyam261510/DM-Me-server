import { Hono } from "hono";
import { handelAsyc } from "../../helper/validation/handelAsync";
import { getUserInfo } from "../../helper/auth/getUserInfo";
import { prisma } from "../../libs/prisma";
import { User } from "../../generated/prisma/client";
import { addMember } from "../../helper/group/addMember";

export const CreateGroupRouter = new Hono();

CreateGroupRouter.post("/", async (c) => {
  const { userId, groupName } = await c.req.json();

  // Request log (important for tracing)

  // Input validation
  if (!userId || !groupName) {
    console.warn("[CreateGroup] Invalid input", { userId, groupName });
    return c.json({ success: false, message: "Invalid inputs" });
  }

  // Validate user
  const userResponse = await getUserInfo(userId);
  if (!userResponse.success) {
    console.warn("[CreateGroup] User not found or invalid", {
      userId,
      reason: userResponse.message,
    });
    return c.json({ success: false, message: userResponse.message });
  }

  const user = userResponse.user as User;

  // Main operation
  const res = await handelAsyc(async () => {
    // Create group
    const newGroup = await prisma.group.create({
      data: {
        groupName,
        adminId: user.id,
      },
    });

    // Add creator as ADMIN
    const memberRes = await addMember({
      userId: user.id,
      groupId: newGroup.id,
      role: "ADMIN",
      isAlreadyValidated: true,
    });

    if (!memberRes.success) {
      console.error("[CreateGroup] Failed to add admin member", {
        userId,
        groupId: newGroup.id,
        reason: memberRes.message,
      });

      return { success: false, message: memberRes.message };
    }

    return newGroup.id;
  }, `CreateGroup failed for userId=${userId}`);

  // Operation failed
  if (!res.success) {
    console.error("[CreateGroup] Creation failed", {
      userId,
      groupName,
      error: res.message,
    });

    return c.json({ success: false, message: res.message });
  }

  // Success log (important)
  console.info("[CreateGroup] Success", {
    userId,
    groupId: res.data,
  });

  return c.json({
    success: true,
    message: "Group created successfully",
    data: res.data,
  });
});
