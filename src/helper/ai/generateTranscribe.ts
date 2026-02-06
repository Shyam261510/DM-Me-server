import OpenAI from "openai";
import * as fs from "fs";

export const generateTranscribe = async (filePath: string) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        message: "Audio file not found",
      };
    }

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      response_format: "json",
      language: "en",
    });
    console.log("Audio Transcribe Successfully");

    return {
      success: true,
      message: "Transcription done",
      text: transcription.text,
    };
  } catch (error: any) {
    console.error("❌ Transcription error:", error);

    return {
      success: false,
      message: "Failed to generate transcription",
      error: error?.message || "Unknown error",
    };
  }
};
