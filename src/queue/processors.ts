import type { Job } from "bullmq";
import {
  queues,
  type ConvertURLToVideoJob,
  type ConvertVideoToAudioJob,
  type GenerateTranscribeJob,
  type GenerateNicheJob,
  type GenerateEmbeddingJob,
  type AddInstagramReciverIdJob,
  type SendDMJob,
  type CompreesVideoJob,
  type AddInstagramReelJob,
} from "./defination";

import { convertURlToVideo } from "../helper/convert/convertURlToVideo";
import { convertVideoToAudio } from "../helper/convert/convertVideoToAudio";
import { generateTranscribe } from "../helper/ai/generateTranscribe";
import { generateNiche } from "../helper/ai/generateNiche";
import { addInstagramReel } from "../helper/Instagram/addInstagramReel";
import { createEmbedding } from "../libs/rag_tools";
import { addInstaReciverId } from "../helper/Instagram/addInstaReciverId";
import { sendDM } from "../workers/sendDM";
import { queueNames } from "./config";
import { compressedVideo } from "../helper/convert/compressVideo";

export class Processors {
  async urlToVideoProcessor(job: Job<ConvertURLToVideoJob>) {
    const { fileName, igReelId, igUserId, reelURL, title } = job.data;
    const response = await convertURlToVideo(reelURL, fileName);
    if (!response.success) {
      return { success: false, message: response.message };
    }
    console.log("next step -> compressVideoQueue");
    await queues.compressVideoQueue.add(queueNames.compressVideo, {
      videoPath: response.filePath as string,
      igReelId,
      igUserId,
      reelURL,
      title,
    });

    return { success: true, message: "Video downloaded successfully" };
  }
  async compressVideoProcessor(job: Job<CompreesVideoJob>) {
    try {
      const { videoPath, igReelId, igUserId, reelURL, title } = job.data;

      const videoCompressResponse = await compressedVideo(videoPath);

      if (!videoCompressResponse.success) {
        throw new Error(videoCompressResponse.message);
      }

      await queues.convertVideoToAudioQueue.add(
        queueNames.convertVideoToAudio,
        {
          videoPath: videoCompressResponse.videoPath as string,
          igReelId,
          igUserId,
          reelURL,
          title,
        },
      );

      return { success: true, message: "Video compressed successfully" };
    } catch (error: any) {
      console.error("compressVideoProcessor error:", error);
      throw error; // Let Bull retry
    }
  }

  async videoToAudioProcessor(job: Job<ConvertVideoToAudioJob>) {
    const { videoPath, igReelId, igUserId, reelURL, title } = job.data;
    const response = await convertVideoToAudio(videoPath);
    if (!response.success) {
      return { success: false, message: response.message };
    }

    // adding data to Audio To generate Transcibe queue

    await queues.generateTranscribeQueue.add(queueNames.generateTranscribe, {
      audioPath: response.audioPath as string,
      igReelId,
      igUserId,
      reelURL,
      title,
    });
    return { success: true, message: "Audio converted successfully" };
  }
  async generateTranscribeProcessor(job: Job<GenerateTranscribeJob>) {
    const { audioPath, title, igReelId, igUserId, reelURL } = job.data;
    const response = await generateTranscribe(audioPath);
    if (!response.success) {
      return { success: false, message: response.message };
    }

    await queues.generateNicheQueue.add(queueNames.generateNiche, {
      transcript: response.text as string,
      title,
      igReelId,
      igUserId,
      reelURL,
      audioPath,
    });

    return { success: true, message: "Transcribe generated successfully" };
  }
  async generateNicheProcessor(job: Job<GenerateNicheJob>) {
    const { title, transcript, igReelId, igUserId, reelURL, audioPath } =
      job.data;
    const response = await generateNiche(title, transcript);
    if (!response.success) {
      return { success: false, message: response.message };
    }

    await queues.generateEmbeddingQueue.add(queueNames.generateEmbedding, {
      title,
      igReelId,
      igUserId,
      reelURL,
      niche: response.niche as string,
      subNiche: response.subNiche as string,
      transcribe: transcript as string,
      audioPath,
    });

    return { success: true, message: "Niche generated successfully" };
  }
  async generateEmbeddingProcessor(job: Job<GenerateEmbeddingJob>) {
    const {
      title,
      igReelId,
      igUserId,
      reelURL,
      niche,
      subNiche,
      transcribe,
      audioPath,
    } = job.data;
    const [
      transcriptEmbedding,
      nicheEmbedding,
      subNicheEmbedding,
      titleEmbedding,
    ] = await Promise.all([
      createEmbedding(transcribe),
      createEmbedding(JSON.stringify(niche)),
      createEmbedding(JSON.stringify(subNiche)),
      createEmbedding(title === "" || !title ? " " : title),
    ]);

    await queues.addInstagramReelToDBQueue.add(
      queueNames.addInstagramReelToDB,
      {
        igReelId,
        igUserId,
        reelURL,
        title,
        niche,
        subNiche,
        transcribe,
        titleEmbedding: titleEmbedding.embedding,
        transcriptEmbedding: transcriptEmbedding.embedding,
        nicheEmbedding: nicheEmbedding.embedding,
        subNicheEmbedding: subNicheEmbedding.embedding,
        audioPath,
      },
    );
    return { success: true, message: "Embedding generated successfully" };
  }
  async addInstagramReelToDBProcessor(job: Job<AddInstagramReelJob>) {
    const {
      igReelId,
      igUserId,
      reelURL,
      title,
      niche,
      subNiche,
      transcribe,
      titleEmbedding,
      transcriptEmbedding,
      nicheEmbedding,
      subNicheEmbedding,
      audioPath,
    } = job.data;

    const response = await addInstagramReel({
      igReelId,
      igUserId,
      reelURL,
      title,
      niche,
      subNiche,
      transcribe,
      titleEmbedding,
      transcriptEmbedding,
      nicheEmbedding,
      subNicheEmbedding,
      audioPath,
    });
    if (!response.success) {
      return { success: false, message: response.message };
    }
    console.log("Reel added successfully to DB");
    return { success: true, message: "Reel added successfully to DB" };
  }
  async addInstaReciverIdProcessor(job: Job<AddInstagramReciverIdJob>) {
    const { userId, reciverId } = job.data;
    const response = await addInstaReciverId(userId, reciverId);
    if (!response.success) {
      return { success: false, message: response.message };
    }
    await queues.sendDMQueue.add(queueNames.sendDM, {
      reciverId,
      message: "Your account has been successfully configure",
    });
    return { success: true, message: "ReciverId added successfully" };
  }
  async sendDMProcessor(job: Job<SendDMJob>) {
    const { reciverId, message } = job.data;
    const response = await sendDM(reciverId, message);
    if (!response.success) {
      return { success: false, message: response.message };
    }
    console.log("DM sent successfully");
    return { success: true, message: "DM sent successfully" };
  }
}
