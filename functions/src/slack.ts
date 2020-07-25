import { IncomingWebhook } from "@slack/webhook";

const url = process.env.SLACK_WEBHOOK_URL;

if (!url) throw new Error("SLACK_WEBHOOK_URL not set");

const webhook = new IncomingWebhook(url);

export const send = async () => {
  await webhook.send({
    text: "I've got news for you...",
  });
};
