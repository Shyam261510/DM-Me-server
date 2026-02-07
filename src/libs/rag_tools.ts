import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

const createEmbedding = async (text: string) => {
  try {
    if (!text?.trim()) {
      throw new Error("Text is required for embedding");
    }
    console.log({ embed: process.env.EMBEDDING_MODEL });

    const result = await embed({
      model: openai.embedding(`${process.env.EMBEDDING_MODEL!}`),
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
