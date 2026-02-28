import { Hono } from "hono";
import { GetGroupInfo } from "../../helper/group/GroupInfo";

export const GroupRouter = new Hono();

const INCLUDING_GROUP = {
  admin: {
    select: {
      username: true,
    },
  },
};

GroupRouter.get("/:groupId", async (c) => {
  const groupId = c.req.param("groupId");

  if (!groupId) {
    return c.json({ success: false, message: "Invalid inputs" });
  }
  const response = await GetGroupInfo({
    condition: {
      id: groupId,
    },
    include: INCLUDING_GROUP,
  });

  return c.json(response);
});
