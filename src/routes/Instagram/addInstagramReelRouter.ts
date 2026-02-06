import { Hono } from "hono";
import z from "zod";
import { validateSchema } from "../../helper/validation/ValidateSchema";
import { addInstagramReel } from "../../helper/Instagram/addInstagramReel";

export const AddInstagramReelRouter = new Hono();

const AddInstagramReelSchema = z.object({
  igReelId: z.string().min(1, { message: "igReelId is required" }),
  igUserId: z.string().min(1, { message: "igUserId is required" }),
  reelURL: z.url({ message: "reelURL is required" }),
  title: z.string().min(1, { message: "title is required" }),
});

AddInstagramReelRouter.post("/", async (c) => {
  const body = await c.req.json();

  const validate = validateSchema(AddInstagramReelSchema, body);

  if (!validate.success) {
    return c.json({ success: false, message: validate.message });
  }

  const { igReelId, igUserId, reelURL, title } = validate.data as z.infer<
    typeof AddInstagramReelSchema
  >;

  const { success, message } = await addInstagramReel({
    igReelId,
    igUserId,
    reelURL,
    title,
  });
  if (!success) {
    return c.json({ success: false, message });
  }

  return c.json({ success: true, message });
});
