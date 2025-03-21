<template>
    <div class="audio-player">
      <button @click="togglePlayPause" class="play-btn">
        <span v-if="isPlaying">⏸ Pause</span>
        <span v-else>▶ Play</span>
      </button>
      <button @click="stopAudio" class="stop-btn">⏹ Stop</button>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      audioSrc: String,
    },
    data() {
      return {
        isPlaying: false,
        audio: null,
      };
    },
    watch: {
      audioSrc(newSrc) {
        this.audio = new Audio(newSrc);
      },
    },
    methods: {
      togglePlayPause() {
        if (!this.audio) return;
        if (this.isPlaying) {
          this.audio.pause();
        } else {
          this.audio.play();
        }
        this.isPlaying = !this.isPlaying;
      },
      stopAudio() {
        if (this.audio) {
          this.audio.pause();
          this.audio.currentTime = 0;
          this.isPlaying = false;
        }
      },
    },
    mounted() {
      this.audio = new Audio(this.audioSrc);
    },
  };
  </script>
  
  <style scoped>
  .audio-player {
    display: flex;
    gap: 10px;
    background: #f0f0f0;
    padding: 10px;
    border-radius: 8px;
  }
  
  .play-btn, .stop-btn {
    padding: 8px 16px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    border-radius: 5px;
  }
  
  .play-btn {
    background: #007bff;
    color: white;
  }
  
  .stop-btn {
    background: #dc3545;
    color: white;
  }
  </style>
  