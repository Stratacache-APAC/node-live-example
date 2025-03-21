<template>
    <div>
      <div class="box">
        <div class="object" id="record" @click="handleMicrophoneClick">
          <div class="outline"></div>
          <div class="outline" id="delayed"></div>
          <div class="button"></div>
          <div class="button" id="circlein">
            <svg
              class="mic-icon"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              viewBox="0 0 1000 1000"
              enable-background="new 0 0 1000 1000"
              xml:space="preserve"
              style="fill: #000000"
            >
              <g>
                <path
                  d="M500,683.8c84.6,0,153.1-68.6,153.1-153.1V163.1C653.1,78.6,584.6,10,500,10c-84.6,0-153.1,68.6-153.1,153.1v367.5C346.9,615.2,415.4,683.8,500,683.8z M714.4,438.8v91.9C714.4,649,618.4,745,500,745c-118.4,0-214.4-96-214.4-214.4v-91.9h-61.3v91.9c0,141.9,107.2,258.7,245,273.9v124.2H346.9V990h306.3v-61.3H530.6V804.5c137.8-15.2,245-132.1,245-273.9v-91.9H714.4z"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
      <div class="captions" id="captions">
        <span>{{ transcript || 'Captions by Deepgram' }}</span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'speechToText',
    data() {
      return {
        socket: null,
        microphone: null,
        audio: null,
        transcript: '',
        welcomeAudioPlayed: false,
        isRecording: false
      }
    },
    mounted() {
      this.initializeWebSocket()
    },
    methods: {
      initializeWebSocket() {
        this.socket = new WebSocket(`ws://${window.location.host}/ws`)
        
        this.socket.addEventListener("open", () => {
          console.log("WebSocket connection opened")
        })
  
        this.socket.addEventListener("message", (event) => {
          const data = JSON.parse(event.data)
          if (data.channel.alternatives[0].transcript !== "") {
            if (this.audio) {
              console.log("stopping audio")
              this.audio.pause()
              this.audio.currentTime = 0
            }
            this.transcript = data.channel.alternatives[0].transcript
          }
        })
  
        this.socket.addEventListener("close", () => {
          console.log("WebSocket connection closed")
        })
      },
  
      async getMicrophone() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          return new MediaRecorder(stream)
        } catch (error) {
          console.error("Error accessing microphone:", error)
          throw error
        }
      },
  
      playWelcomeAudio() {
        console.log("Playing welcome audio")
        this.audio = new Audio('/output.wav')
        this.audio.play().catch(error => {
          console.error("Error playing welcome audio:", error)
        })
      },
  
      async openMicrophone(microphone) {
        return new Promise((resolve) => {
          microphone.onstart = () => {
            console.log("Microphone opened")
            this.isRecording = true
            document.body.classList.add("recording")
            resolve()
          }
  
          microphone.onstop = () => {
            console.log("Microphone closed")
            this.isRecording = false
            document.body.classList.remove("recording")
          }
  
          microphone.ondataavailable = (event) => {
            if (event.data.size > 0 && this.socket.readyState === WebSocket.OPEN) {
              this.socket.send(event.data)
            }
          }
  
          microphone.start(1000)
        })
      },
  
      async handleMicrophoneClick() {
        if (!this.microphone) {
          try {
            if (!this.welcomeAudioPlayed) {
              this.playWelcomeAudio()
              this.welcomeAudioPlayed = true
            }
            
            this.microphone = await this.getMicrophone()
            await this.openMicrophone(this.microphone)
          } catch (error) {
            console.error("Error opening microphone:", error)
          }
        } else {
          this.microphone.stop()
          this.microphone = null
        }
      }
    }
  }
  </script>
  
  <style>
  body {
    background: #4e4e4e;
  }
  
  .box {
    position: absolute;
    top: 50%;
    left: 50%;
  }
  
  .object {
    display: flex;
    flex: 0 1 100%;
    justify-content: center;
    align-items: center;
    align-content: stretch;
  }
  
  .outline {
    display: none;
  }
  
  .recording .outline {
    display: block;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 8px solid #b5a4a4;
    animation: pulse 3s;
    animation-timing-function: ease-out;
    animation-iteration-count: infinite;
    position: absolute;
  }
  
  .button {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: #50cddd;
    box-shadow: 0px 0px 80px #0084f9;
    position: absolute;
  }
  
  .recording .button {
    background: #dd5050;
    box-shadow: 0px 0px 80px #f90000;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(0);
      opacity: 0;
      border: 65px solid #000000;
    }
    50% {
      border: solid #ffffff;
      opacity: 0.8;
    }
  
    90% {
      transform: scale(3.2);
      opacity: 0.2;
      border: 3px solid #000000;
    }
    100% {
      transform: scale(3.3);
      opacity: 0;
      border: 1px solid #ffffff;
    }
  }
  
  #delayed {
    animation-delay: 1.5s;
  }
  
  #circlein {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: #6bd6e1;
    box-shadow: 0px -2px 15px #e0ff94;
    position: absolute;
  }
  
  .recording #circlein {
    background: #e16b6b;
    box-shadow: 0px -2px 15px #e0ff94;
  }
  
  .mic-icon {
    height: 60px;
    position: absolute;
    margin: 21px;
  }
  
  .captions {
    font: 3.2rem/1.25 Verdana, Geneva, Tahoma, sans-serif;
    text-transform: uppercase;
    text-align: center;
    font-weight: 400;
    position: absolute;
    bottom: 1rem;
    left: 50%;
    transform: translate(-50%, 0);
  }
  
  .captions span {
    display: inline-block;
    line-height: 4rem;
    padding: 1rem;
    color: white;
    background-color: rgba(0, 0, 0, 0.3);
  }
  </style> 