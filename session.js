const express = require("express");
const { toBuffer } = require("qrcode");
const { exec } = require("child_process");
const fs = require('fs');
const axios = require("axios");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");

const app = express();
const PORT = process.env.PORT || 3000;
const PRIVATEBIN_URL = "https://privatebin.net";

async function getSessionData(sessionID) {
  try {
    const response = await axios.get(`${PRIVATEBIN_URL}/?paste=${sessionID}`);
    return Buffer.from(response.data, 'base64').toString('utf-8');
  } catch (error) {
    console.error(error);
    return null;
  }
}

app.get('/', async (req, res) => {
  const { state, saveCreds } = await useMultiFileAuthState("./multi_file_auth/auth_info.json");
  
  try {
    const socket = makeWASocket({
      logger: pino({ level: 'silent' }),
      browser: ["ALEXA MD", "Firefox", "3.0.0"],
      auth: state
    });

    socket.ev.on("connection.update", async (update) => {
      if (update.qr) {
        res.end(await toBuffer(update.qr));
      }

      const { connection, lastDisconnect } = update;
      if (connection === 'open') {
        const sessionID = socket.user.id;
        const data = JSON.stringify({ ...state.creds, sessionID });

        try {
          const encodedData = Buffer.from(data).toString('base64');
          const response = await axios.post(`${PRIVATEBIN_URL}/?paste`, encodedData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
          const PASTE_KEY = response.data.split('/')[3];
          const Bin_HATED = `${PRIVATEBIN_URL}/${pasteKey}`;
          await socket.sendMessage(socket.user.id, {
            text: `*ᴅᴇᴀʀ*: ${socket.user.name}\n *ʏᴏᴜʀ sᴇssɪᴏɴ ɪᴅ* \n *_sessionID_*: Socket;;;${PASTE_KEY}\n*_PrivateBin_*: ${Bin_HATED}\n\nfooter: 2024 Astrid`
          });

        } catch (error) {
      }
        process.exit(0);
      }

      if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 409) {
        WhatsApp();
      }
    });

    socket.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error(error);
  }
});

app.listen(PORT, () => 
  console.log(`${PORT}`));
