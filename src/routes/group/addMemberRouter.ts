import { Hono } from "hono";
import { addMember } from "../../helper/group/addMember";
export const AddMemberRouter = new Hono();

AddMemberRouter.post("/", async (c) => {
  const { userId, groupId } = await c.req.json();

  if (!userId || !groupId) {
    return c.json({ success: false, message: "Invalid inputs" });
  }

  const addMemberResponse = await addMember({
    userId,
    groupId,
    role: "MEMBER",
    isAlreadyValidated: false,
  });

  return c.json(addMemberResponse);
});
