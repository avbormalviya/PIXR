import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_TOKEN;

export const client = new MailtrapClient({
    token: TOKEN,
});

export const sender = {
    email: "mailtrap@demomailtrap.com",
    name: "PIXR",
};