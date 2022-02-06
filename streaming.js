const { WebSocket } = require("ws");
const { StreamCamera, Codec, Flip, SensorMode } = require("pi-camera-connect");
require("dotenv").config();

export const API_URL = "https://francescogorini.com/rpi-relay";
export const SOCK_URL = "wss://francescogorini.com/rpi-relay";

const FPS = 5;

const streamCamera = new StreamCamera({
  codec: Codec.MJPEG,
  flip: Flip.Vertical,
  sensorMode: SensorMode.Mode6,
  fps: FPS
});

export const InitStreamConn = async (token) => {
  try {
    // Establish Websocket connection using JWT
    const streamSock = new WebSocket(`${SOCK_URL}/ws?token=${token}`);

    // Event handlers
    streamSock.on("close", () => console.log("Stream Websocket connection closed"));
    streamSock.on("error", () => console.log("Stream Websocket connection error"));

    streamSock.on("open", () => {
      console.log("Stream Websocket connection established");

      // Camera streaming code
      streamCamera.on('frame', (data) => {
        const TX_FRAME = {
          cmd: "TX_FRAME",
          target: "server",
          data: data.toString("base64")
        }
        streamSock.send(JSON.stringify(TX_FRAME))
      })

      const cameraStartCapture = async () => {
        await streamCamera.startCapture();
      }

      cameraStartCapture().then(() => {
        console.log(`Camera is now capturing at ${FPS} fps`);
      });
    });

  } catch (err) {
    console.error(`Stream sock setup Error: ${err}`);
  }
};