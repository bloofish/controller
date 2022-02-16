const { WebSocket } = require('ws');
const websocketStream = require('websocket-stream');
const { spawn } = require('child_process');
require('dotenv').config();

const API_URL = "https://francescogorini.com/rpi-relay";
const SOCK_URL = "wss://francescogorini.com/rpi-relay";
// const API_URL = "http://192.168.1.65:9999/rpi-relay";
// const SOCK_URL = "ws://192.168.1.65:9999/rpi-relay";

const FPS = '30'
const BitRate = '150000'
const Width = '1280'
const Height = '720'
const Rotation = '180'

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

      // Spawn child to fetch video stream
      const vstream = spawn('raspivid', ['-t', '9999999', '-fps', FPS, '-b', BitRate, '-w', Width, '-h', Height, '-rot', Rotation, '-ih', '-o', '-', '-n']);
      vstream.on('close', (code) => console.log(`videostream: process exited with code ${code}`));

      // Pipe child's stdout to websocket
      vstream.stdout.pipe(websocketStream(streamSock));
      vstream.stderr.on('data', (data) => console.error(`videostream: stderr: ${data}`));

      console.log(`Camera is now capturing ${Width}x${Height}@${FPS}fps : bitrate=${BitRate}`);
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