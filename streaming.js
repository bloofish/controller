const { WebSocket } = require("ws");
const { StreamCamera, Codec, Flip, SensorMode } = require("pi-camera-connect");
require("dotenv").config();

const API_URL = "https://francescogorini.com/rpi-relay";
const SOCK_URL = "wss://francescogorini.com/rpi-relay";

const FPS = 5;
const streamCamera = new StreamCamera({
  codec: Codec.MJPEG,
  // flip: Flip.Vertical,
  sensorMode: SensorMode.Mode7,
  fps: FPS
});

let lastFrameTime = Date.now()

const InitStreamConn = async (token) => {
  try {
    // Establish Websocket connection using JWT
    const streamSock = new WebSocket(`${SOCK_URL}/ws?token=${token}`);

    // Event handlers
    streamSock.on("close", () => console.log("Stream Websocket connection closed"));
    streamSock.on("error", () => console.log("Stream Websocket connection error"));

    streamSock.on("open", async () => {
      console.log("Stream Websocket connection established");

      // Camera streaming code
      streamCamera.on('frame', async (data) => {
        if (Date.now() - lastFrameTime < 333) return
        lastFrameTime = Date.now()
        let b64Data = data.toString("base64")
        console.log(`Sending frame of length ${b64Data.length}...`)
        const TX_FRAME = {
          cmd: "TX_FRAME",
          target: "server",
          data: b64Data
        }
        streamSock.send(JSON.stringify(TX_FRAME))
      })

      await streamCamera.startCapture();
      console.log(`Camera is now capturing at ${FPS} fps`);
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