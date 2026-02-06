import { embed } from "ai";
import { google } from "@ai-sdk/google";

const createEmbedding = async (text: string) => {
  try {
    if (!text?.trim()) {
      throw new Error("Text is required for embedding");
    }

    const result = await embed({
      model: google.embedding("text-embedding-004"),
      value: text,
    });

    if (!result?.embedding || !Array.isArray(result.embedding)) {
      throw new Error("Invalid embedding response");
    }

    return result;
  } catch (error) {
    console.error("Create embedding error:", error);
    throw error; // propagate (used by retrieveDocument)
  }
};

export { createEmbedding };
