import axios from "axios";
import ApiError from "./api-error";
import { StatusCode } from "../services/constants/statusCode";

export const sendSlackNotification = async (message) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("Slack webhook URL is not defined");
    throw new ApiError(
      StatusCode.INTERNAL_SERVER_ERROR,
      "Slack webhook URL is not defined",
      [],
      "Please set SLACK_WEBHOOK_URL in your environment variables"
    );
  }
  

  try {
    await axios.post(webhookUrl, {
      text: message,
    });
    console.log("Slack notification sent successfully");
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    throw new ApiError(
      StatusCode.INTERNAL_SERVER_ERROR,
      "Failed to send Slack notification",
      [error.message],
      error.stack
    );
  }
}