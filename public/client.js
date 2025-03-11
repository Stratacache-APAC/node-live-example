const captions = window.document.getElementById("captions");
let audio = null;
// Play welcome audio when page loads
function playWelcomeAudio() {
  console.log("Playing welcome audio");
  audio = new Audio('/output.wav');
  audio.play().catch(error => {
    console.error("Error playing welcome audio:", error);
  });
}

async function getMicrophone() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return new MediaRecorder(stream);
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw error;
  }
}

async function openMicrophone(microphone, socket) {
  return new Promise((resolve) => {
    microphone.onstart = () => {
      console.log("WebSocket connection opened");
      document.body.classList.add("recording");
      resolve();
    };

    microphone.onstop = () => {
      console.log("WebSocket connection closed");
      document.body.classList.remove("recording");
    };

    microphone.ondataavailable = (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    microphone.start(1000);
  });
}

async function closeMicrophone(microphone) {
  microphone.stop();
}

async function start(socket) {
  const listenButton = document.querySelector("#record");
  let microphone;

  console.log("client: waiting to open microphone");

  listenButton.addEventListener("click", async () => {
    if (!microphone) {
      try {
        microphone = await getMicrophone();
        console.log("client: microphone opened");
       
        await openMicrophone(microphone, socket);
       
      } catch (error) {
        console.error("Error opening microphone:", error);
      }
    } else {
      await closeMicrophone(microphone);
      microphone = undefined;
    }
  });
}

window.addEventListener("load", () => {
  console.log("Loading welcome audio");
 
  const socket = new WebSocket("ws://localhost:3000");

  socket.addEventListener("open", async () => {
    console.log("WebSocket connection opened");
    await start(socket);
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    
    if (data.channel.alternatives[0].transcript !== "") {
      if (audio) {
        audio.stop();
      }
      captions.innerHTML = data
        ? `<span>${data.channel.alternatives[0].transcript}</span>`
        : "";
    }
  });

  socket.addEventListener("close", () => {
    console.log("WebSocket connection closed");
  });
});


