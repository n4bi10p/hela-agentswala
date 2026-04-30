const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
app.use(express.json());

console.log("[WhatsApp Service] Initializing...");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log("\n=======================================================");
    console.log("[WhatsApp] ACTION REQUIRED: Link your WhatsApp account!");
    console.log("Please scan the QR code below using your WhatsApp app:");
    console.log("=======================================================\n");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log("\n[WhatsApp] Client is successfully authenticated and ready!\n");
    isReady = true;
});

client.on('auth_failure', msg => {
    console.error('[WhatsApp] Authentication failure', msg);
});

client.initialize();

app.post('/send', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ error: "WhatsApp client is not ready yet." });
    }

    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
        return res.status(400).json({ error: "Missing phoneNumber or message" });
    }

    const formattedNumber = phoneNumber.replace(/[^0-9]/g, '') + "@c.us";

    try {
        console.log(`[WhatsApp] Sending message to ${formattedNumber}...`);
        await client.sendMessage(formattedNumber, message);
        console.log(`[WhatsApp] Message sent!`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[WhatsApp] Failed to send message:`, error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`[WhatsApp Service] REST API listening on port ${PORT}`);
});
