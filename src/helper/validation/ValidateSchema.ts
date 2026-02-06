import z from "zod";

export const validateSchema = (schema: z.ZodType, data: unknown) => {
  type schemaType = z.infer<typeof schema>;
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const errorMessage = JSON.parse(parsed.error.message)[0].message;
    return { success: false, message: errorMessage };
  }
  return { success: true, data: parsed.data as schemaType };
};
