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
} from "./defination";
import { type AddInstagramReelTypes } from "../helper/Instagram/addInstagramReel";
import { convertURlToVideo } from "../helper/convert/convertURlToVideo";
import { convertVideoToAudio } from "../helper/convert/convertVideoToAudio";
import { generateTranscribe } from "../helper/ai/generateTranscribe";
import { generateNiche } from "../helper/ai/generateNiche";
import { addInstagramReel } from "../helper/Instagram/addInstagramReel";
import { createEmbedding } from "../libs/rag_tools";
import { addInstaReciverId } from "../helper/Instagram/addInstaReciverId";
import { sendDM } from "../workers/sendDM";
import { queueNames } from "./config";

export class Processors {
  async urlToVideoProcessor(job: Job<ConvertURLToVideoJob>) {
    const { fileName, igReelId, igUserId, reelURL, title } = job.data;
    const response = await convertURlToVideo(reelURL, fileName);
    if (!response.success) {
      return { success: false, message: response.message };
    }

    await queues.convertVideoToAudioQueue.add(queueNames.convertVideoToAudio, {
      videoPath: response.filePath as string,
      igReelId,
      igUserId,
      reelURL,
      title,
    });

    return { success: true, message: "Video downloaded successfully" };
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

    const videoPath = audioPath.replace(/\.mp3$/i, ".mp4");

    const videoFile = Bun.file(videoPath);
    const audioFile = Bun.file(audioPath);

    if (await videoFile.exists()) {
      await videoFile.delete();
      console.log("Video File deleted successfully");
    }
    if (await audioFile.exists()) {
      await audioFile.delete();
      console.log("Audio File deleted successfully");
    }

    await queues.generateNicheQueue.add(queueNames.generateNiche, {
      transcript: response.text as string,
      title,
      igReelId,
      igUserId,
      reelURL,
    });

    return { success: true, message: "Transcribe generated successfully" };
  }
  async generateNicheProcessor(job: Job<GenerateNicheJob>) {
    const { title, transcript, igReelId, igUserId, reelURL } = job.data;
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
    });

    return { success: true, message: "Niche generated successfully" };
  }
  async generateEmbeddingProcessor(job: Job<GenerateEmbeddingJob>) {
    const { title, igReelId, igUserId, reelURL, niche, subNiche, transcribe } =
      job.data;
    const [
      transcriptEmbedding,
      nicheEmbedding,
      subNicheEmbedding,
      titleEmbedding,
    ] = await Promise.all([
      createEmbedding(transcribe),
      createEmbedding(JSON.stringify(niche)),
      createEmbedding(JSON.stringify(subNiche)),
      createEmbedding(title),
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
      },
    );
    return { success: true, message: "Embedding generated successfully" };
  }
  async addInstagramReelToDBProcessor(job: Job<AddInstagramReelTypes>) {
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
