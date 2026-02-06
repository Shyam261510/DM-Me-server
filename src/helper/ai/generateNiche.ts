import { google } from "@ai-sdk/google";
import z, { success } from "zod";
import { generateText, Output } from "ai";
import { NicheCategorizationPrompt } from "../../Prompt";

const NicheSchema = z.object({
  niche: z
    .string()
    .describe(
      "The Niche of the reel content based on the caption and transcribe of the reel",
    ),
  subNiche: z
    .string()
    .describe(
      "The Sub Niche of the reel content based on the caption and transcribe of the reel",
    ),
});

export const generateNiche = async (caption: string, transcript: string) => {
  try {
    if (!caption && !transcript) {
      return {
        success: false,
        message: "Caption or transcript is required",
      };
    }

    const response = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Here is the caption: ${caption} and transcript: ${transcript}`,
      system: NicheCategorizationPrompt,
      output: Output.object({ schema: NicheSchema }),
    });

    if (!response?.output) {
      return { success: false, message: "Failed to generate niche" };
    }
    console.log("Niche Sub-Niche Generated Successfully");
    return {
      success: true,
      niche: response.output.niche,
      subNiche: response.output.subNiche,
    };
  } catch (error: any) {
    console.error("❌ Niche generation error:", error);

    return {
      success: false,
      message: "Failed to generate niche",
    };
  }
};
