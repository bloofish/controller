const { WebSocket } = require("ws");
const { StreamCamera, Codec, Flip, SensorMode } = require("pi-camera-connect");
const { spawn } = require('child_process');
require("dotenv").config();

// const API_URL = "https://francescogorini.com/rpi-relay";
// const SOCK_URL = "wss://francescogorini.com/rpi-relay";

const API_URL = "http://192.168.1.65:9999/rpi-relay";
const SOCK_URL = "ws://192.168.1.65:9999/rpi-relay";

// const FPS = 5;
// const streamCamera = new StreamCamera({
//   codec: Codec.H264,
//   flip: Flip.Both,
//   sensorMode: SensorMode.Mode7,
//   fps: FPS // This doesn't seem to work

// });
// let lastFrameTime = Date.now()

let vstream;

const InitStreamConn = async (token) => {
  try {
    // Establish Websocket connection using JWT
    const streamSock = new WebSocket(`${SOCK_URL}/ws?token=${token}`);
    streamSock.binaryType = 'arraybuffer'
    // Event handlers
    streamSock.on("close", () => console.log("Stream Websocket connection closed"));
    streamSock.on("error", () => console.log("Stream Websocket connection error"));

    streamSock.on("open", async () => {
      console.log("Stream Websocket connection established");

      // Camera streaming code for MJPEG base64
      //   streamCamera.on('frame', async (data) => {
      //     if (Date.now() - lastFrameTime < 500) return // hacky 2fps
      //     lastFrameTime = Date.now()

      //     let b64Data = data.toString("base64")
      //     console.log(`Sending frame of length ${b64Data.length}...`)
      //     const TX_FRAME = {
      //       cmd: "TX_FRAME",
      //       target: "server",
      //       data: b64Data
      //     }
      //     streamSock.send(JSON.stringify(TX_FRAME))
      //   })

      // Camera streaming code for H264 binary
      //   const videoStream = streamCamera.createStream();

      vstream = spawn('raspivid', ['-t', '9999999', '-o', '-', '-n']);

      vstream.on('data', async (data) => {
        console.log(`Sending frame of length ${data.length}...`)
        streamSock.send(data)
      })

      // await streamCamera.startCapture();
      console.log(`Camera is now capturing`);
    });

  } catch (err) {
    console.error(`Stream sock setup Error: ${err}`);
  }
};

module.exports = {
  API_URL: API_URL,
  SOCK_URL: SOCK_URL,
  InitStreamConn: InitStreamConn
}