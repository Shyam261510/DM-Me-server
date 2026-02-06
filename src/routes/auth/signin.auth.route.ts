import { Hono } from "hono";
import { prisma } from "../../libs/prisma";
import z from "zod";
import { validateSchema } from "../../helper/validation/ValidateSchema";
export const SignInRouter = new Hono();

const SignInSchema = z.object({
  email: z.email().min(3, { message: "Email must be required" }),
  username: z.string().min(3, { message: "Username must be required" }),
});

SignInRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const validate = validateSchema(SignInSchema, body);

    if (!validate.success) {
      return c.json({ success: false, message: validate.message }, 400);
    }

    const { email, username } = validate.data as z.infer<typeof SignInSchema>;

    const result = await createUser(email, username);

    if (!result.success) {
      return c.json({
        success: false,
        message: result.message,
        user: result.user ?? null,
      });
    }

    return c.json({ success: true, user: result.user }, 201);
  } catch (error) {
    console.error("Sign-in route error:", error);

    return c.json({ success: false, message: "Unexpected server error" }, 500);
  }
});

async function createUser(email: string, username: string) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    // If user already exists
    if (existingUser) {
      return { success: true, user: existingUser };
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
      },
    });

    return { success: true, user: newUser };
  } catch (error) {
    console.error("Error creating user:", error);

    return {
      success: false,
      user: null,
      message: "Failed to create user",
    };
  }
}
