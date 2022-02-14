const { WebSocket } = require('ws');
const websocketStream = require('websocket-stream');
const { StreamCamera, Codec, Flip, SensorMode } = require('pi-camera-connect');
const { spawn } = require('child_process');
require('dotenv').config();

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


      vstream = spawn('raspivid', ['-t', '9999999', '-fps', '10', '-b', '20000', '-h', '300', '-w', '500', '-ro', '180', '-ih', '-o', '-', '-n']);
      let streamSockVid = websocketStream(streamSock)
      vstream.stdout.pipe(streamSockVid);
      // vstream.stdout.on('data', async (data) => {
      //   streamSock.send(data)
      // })

      vstream.stderr.on('data', (data) => {
        console.error(`videostream: stderr: ${data}`);
      });

      vstream.on('close', (code) => {
        console.log(`videostream: process exited with code ${code}`);
      });

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