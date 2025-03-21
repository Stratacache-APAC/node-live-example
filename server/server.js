const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const dotenv = require("dotenv");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
global.Blob = require('node:buffer').Blob;
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);
let keepAlive;

const text = "Hello and welcome to Singapore Changi Airport! I'm Natasha. I can assist you with flight details, directions, or travel tips, I'm here to help make your journey smooth and enjoyable.";

// Generate TTS audio on server start
//generateWelcomeAudio();

// Function to generate welcome audio using ElevenLabs
async function generateWelcomeAudio() {
  try {
    console.log("Generating welcome audio...");
    await getAudioFromElevenLabs();
    console.log("Welcome audio generated successfully");
  } catch (error) {
    console.error("Error generating welcome audio:", error);
  }
}

// Function to get audio from ElevenLabs
async function getAudioFromElevenLabs() {
  try {
    // Make sure you have your ElevenLabs API key in your .env file
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not defined in .env file");
    }

    // ElevenLabs API endpoint for text-to-speech
    const url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"; // Rachel voice ID

    // Request configuration
    const config = {
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      responseType: 'arraybuffer'
    };

    // Request body
    const data = {
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    };

    console.log("Requesting audio from ElevenLabs...");
    const response = await axios.post(url, data, config);
    
    // Save the audio file
    fs.writeFileSync("public/output.wav", response.data);
    console.log("Audio file written to public/output.wav");
    
    return true;
  } catch (error) {
    console.error("Error in getAudioFromElevenLabs:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data.toString());
    }
    throw error;
  }
}

const setupDeepgram = (ws) => {
  const deepgram = deepgramClient.listen.live({
    language: "en",
    punctuate: true,
    smart_format: true,
    model: "nova-3",
  });

  if (keepAlive) clearInterval(keepAlive);
  keepAlive = setInterval(() => {
    console.log("deepgram: keepalive");
    deepgram.keepAlive();
  }, 10 * 1000);

  deepgram.addListener(LiveTranscriptionEvents.Open, async () => {
    console.log("deepgram: connected");
   
    const filePath = "transcripts.json";
    deepgram.addListener(LiveTranscriptionEvents.Transcript, (data) => {
      console.log("deepgram: packet received");
      console.log("deepgram: transcript received");
      console.log("socket: transcript sent to client");
    
      // Send to client
      ws.send(JSON.stringify(data));
    
      // Save to file
      try {
        const transcriptText = data.channel?.alternatives?.[0]?.transcript;
        if (transcriptText && transcriptText.trim() !== "") {
          const timestamp = new Date().toISOString();
          const transcriptEntry = {
            timestamp,
            transcript: transcriptText,
          };
    
          let transcripts = [];
    
          // Check if file exists and has content
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf-8");
            if (fileContent.trim() !== "") {
              try {
                transcripts = JSON.parse(fileContent);
              } catch (parseErr) {
                console.error("Error parsing existing transcripts.json:", parseErr);
              }
            }
          }
    
          // Add new entry
          transcripts.push(transcriptEntry);
    
          // Save back to file as array
          fs.writeFileSync(filePath, JSON.stringify(transcripts, null, 2));
        }
      } catch (err) {
        console.error("Error saving transcript to file:", err);
      }
    });
    

    deepgram.addListener(LiveTranscriptionEvents.Close, async () => {
      console.log("deepgram: disconnected");
      clearInterval(keepAlive);
      deepgram.finish();
    });

    deepgram.addListener(LiveTranscriptionEvents.Error, async (error) => {
      console.log("deepgram: error received");
      console.error(error);
    });

    deepgram.addListener(LiveTranscriptionEvents.Warning, async (warning) => {
      console.log("deepgram: warning received");
      console.warn(warning);
    });

    deepgram.addListener(LiveTranscriptionEvents.Metadata, (data) => {
      console.log("deepgram: packet received");
      console.log("deepgram: metadata received");
      console.log("ws: metadata sent to client");
      ws.send(JSON.stringify({ metadata: data }));
    });
  });

  return deepgram;
};

wss.on("connection", (ws) => {
  console.log("socket: client connected");
  let deepgram = setupDeepgram(ws);
  
  ws.on("message", (message) => {
    console.log("socket: client data received");

    if (deepgram.getReadyState() === 1 /* OPEN */) {
      console.log("socket: data sent to deepgram");
      deepgram.send(message);
    } else if (deepgram.getReadyState() >= 2 /* 2 = CLOSING, 3 = CLOSED */) {
      console.log("socket: data couldn't be sent to deepgram");
      console.log("socket: retrying connection to deepgram");
      /* Attempt to reopen the Deepgram connection */
      deepgram.finish();
      deepgram.removeAllListeners();
      deepgram = setupDeepgram(socket);
    } else {
      console.log("socket: data couldn't be sent to deepgram");
    }
  });

  ws.on("close", () => {
    console.log("socket: client disconnected");
    deepgram.finish();
    deepgram.removeAllListeners();
    deepgram = null;
  });
});
 
app.use(express.static("public/"));
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Serve the welcome audio file
app.get("/welcome-audio", (req, res) => {
  res.sendFile(__dirname + "/public/output.wav");
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
