<template>
  <div class="app">
    <div class="container">
      <h1 class="title">AI Text-to-Speech Streaming</h1>
      <p class="text">{{ text }}</p>

      <button @click="fetchAudio" :disabled="loading" class="generate-btn">
        <span v-if="loading" class="spinner"></span>
        {{ loading ? "Streaming..." : "Stream Audio" }}
      </button>

      <div v-if="isPlaying || isStreaming" class="audio-container">
        <button @click="togglePlay" class="play-btn">
          <span v-if="!isPlaying">▶</span>
          <span v-else>⏸</span>
        </button>

        <!-- Progress Bar -->
        <div class="progress-wrapper">
          <input 
            type="range" 
            min="0" 
            max="100" 
            v-model="progress" 
            @input="seekAudio" 
            class="progress-bar" 
          />
        </div>

        <!-- Volume Control -->
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          v-model="volume" 
          @input="updateVolume" 
          class="volume-bar" 
        />
      </div>
    </div>

    <audio 
      ref="audioPlayer" 
      @timeupdate="updateProgress" 
      @ended="resetProgress" 
    ></audio>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import { streamAudio } from "../api";
import textData from "../text.json";

export default {
  setup() {
    const text = ref(textData.text);
    const loading = ref(false);
    const isStreaming = ref(false);
    const isPlaying = ref(false);
    const progress = ref(0);
    const volume = ref(1);
    const audioPlayer = ref(new Audio());
    let mediaSource, sourceBuffer, reader, stream;

    // Function to fetch and play audio stream
    const fetchAudio = async () => {
      // Stop previous audio if playing
      stopAudio();

      loading.value = true;
      isStreaming.value = true;

      stream = await streamAudio(text.value);
      if (!stream) {
        loading.value = false;
        isStreaming.value = false;
        return;
      }

      playStream(stream);
    };

    // Function to handle streaming audio playback
    const playStream = async (stream) => {
      mediaSource = new MediaSource();
      audioPlayer.value.src = URL.createObjectURL(mediaSource);
      audioPlayer.value.play();
      isPlaying.value = true;
      loading.value = false;

      reader = stream.getReader();

      mediaSource.addEventListener("sourceopen", async () => {
        sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
        appendNextChunk();
      });
    };

    // Append audio chunks to sourceBuffer
    const appendNextChunk = async () => {
      const { value, done } = await reader.read();
      if (done) {
        mediaSource.endOfStream();
        return;
      }
      sourceBuffer.appendBuffer(value);
      sourceBuffer.addEventListener("updateend", appendNextChunk, { once: true });
    };

    // Stop audio and reset progress
    const stopAudio = () => {
      if (audioPlayer.value) {
        audioPlayer.value.pause();
        audioPlayer.value.src = "";
        isPlaying.value = false;
        isStreaming.value = false;
        progress.value = 0;
      }
    };

    // Toggle Play / Pause
    const togglePlay = () => {
      if (!audioPlayer.value) return;
      if (audioPlayer.value.paused) {
        audioPlayer.value.play();
        isPlaying.value = true;
      } else {
        audioPlayer.value.pause();
        isPlaying.value = false;
      }
    };

    // Update progress bar
    const updateProgress = () => {
      if (audioPlayer.value) {
        progress.value = (audioPlayer.value.currentTime / audioPlayer.value.duration) * 100;
      }
    };

    // Seek audio playback
    const seekAudio = () => {
      if (audioPlayer.value) {
        audioPlayer.value.currentTime = (progress.value / 100) * audioPlayer.value.duration;
      }
    };

    // Update volume
    const updateVolume = () => {
      if (audioPlayer.value) {
        audioPlayer.value.volume = volume.value;
      }
    };

    // Reset progress bar when audio ends
    const resetProgress = () => {
      progress.value = 0;
      isPlaying.value = false;
    };

    // Watch volume changes
    watch(volume, updateVolume);

    return {
      text,
      fetchAudio,
      loading,
      isStreaming,
      isPlaying,
      progress,
      volume,
      audioPlayer,
      togglePlay,
      updateProgress,
      seekAudio,
      updateVolume,
      resetProgress
    };
  },
};
</script>

<style scoped>
.app {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  font-family: "Poppins", sans-serif;
}

.container {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.title {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 10px;
}

.text {
  font-size: 18px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.generate-btn {
  padding: 12px 20px;
  background: #ff7eb3;
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.3s ease-in-out;
  box-shadow: 0 5px 15px rgba(255, 126, 179, 0.4);
}

.generate-btn:hover {
  background: #ff4f8f;
  transform: scale(1.05);
}

.generate-btn:disabled {
  background: gray;
  cursor: not-allowed;
  opacity: 0.6;
}

.audio-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.play-btn {
  background: #ff7eb3;
  color: white;
  font-size: 18px;
  border: none;
  padding: 10px 15px;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.3s ease-in-out;
}

.play-btn:hover {
  background: #ff4f8f;
  transform: scale(1.1);
}

.progress-wrapper {
  flex-grow: 1;
}

.progress-bar {
  width: 100%;
  cursor: pointer;
  background: transparent;
}

.volume-bar {
  width: 60px;
  cursor: pointer;
}
</style>
