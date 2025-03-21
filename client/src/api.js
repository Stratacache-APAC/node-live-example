import axios from "axios";

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;
const API_URL = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream";

/**
 * Streams audio from ElevenLabs API.
 * @param {string} text - The text to convert to speech.
 * @returns {Promise<ReadableStream>} - The streaming audio response.
 */
export const streamAudio = async (text) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.body; // Return readable stream
  } catch (error) {
    console.error("Error streaming audio:", error);
    return null;
  }
};
