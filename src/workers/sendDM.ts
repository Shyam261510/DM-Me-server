import axios from "axios";

const ACCESS_TOKEN = process.env.LONG_LIVE_TOKEN;

export const sendDM = async (reciverId: string, message: string) => {
  try {
    if (!reciverId || !message) {
      return {
        success: false,
        message: "Receiver's id or message is missing",
      };
    }

    const payload = {
      recipient: {
        id: reciverId,
      },
      message: {
        text: message,
      },
    };

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://graph.instagram.com/v24.0/me/messages?access_token=${ACCESS_TOKEN}`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(payload),
    };

    await axios(config);

    return {
      success: true,
      message: `DM send successfully to ${reciverId}`,
    };
  } catch (error: any) {
    console.error("❌ Error while sending DM:", error?.response?.data || error);

    return {
      success: false,
      message:
        error?.response?.data?.error?.message ||
        error.message ||
        "Failed to send DM",
    };
  }
};
