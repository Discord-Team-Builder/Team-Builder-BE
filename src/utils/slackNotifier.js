import axios from "axios";

export const sendSlackNotification = async (message) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("Slack webhook URL is not defined");
    return;
  }

  try {
    await axios.post(webhookUrl, {
      text: message,
    });
    console.log("Slack notification sent successfully");
  } catch (error) {
    console.error("Error sending Slack notification:", error);
  }
}