const axios = require("axios");
const { WebSocket } = require("ws");
const Gpio = require("pigpio").Gpio;
const { StreamCamera, Codec } = require("pi-camera-connect");
require("dotenv").config();

const API_URL = "https://francescogorini.com/rpi-relay";
const SOCK_URL = "wss://francescogorini.com/rpi-relay";

const Lforward = new Gpio(17, "out"); //use GPIO pin 4, and specify that it is output
const Rforward = new Gpio(27, "out");
const Lreverse = new Gpio(22, "out");
const Rreverse = new Gpio(23, "out");

const timeOut = 200;
const streamCamera = new StreamCamera({
  codec: Codec.MJPEG,
  flip: Flip.Vertical,
  sensorMode: SensorMode.Mode6
});


initSocketConn = async () => {
  try {
    // Login through REST API to fetch JWT
    const response = await axios.post(`${API_URL}/login`, {
      username: process.env.API_USERNAME,
      password: process.env.API_PASSWORD,
      isRobot: true,
    });

    // Establish Websocket connection using JWT
    const ws = new WebSocket(`${SOCK_URL}/ws?token=${response.data.token}`);

    // Websocket events
    ws.on("open", () => {
      const handle = setInterval(() => clearInputs(), timeOut);
      console.log("Websocket connection established");
    });

    ws.on("close", () => {
      console.log("Websocket connection closed");
    });

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      switch (msg.cmd) {
        case "TX_PING":
          // Send user ping packet back to relay server to let users calc ping delay in ms
          console.log(`Recieved TX_PING`);
          const pingReply = { ...msg, sender: msg.target, target: msg.sender };
          ws.send(JSON.stringify(pingReply));
          break;
        case "TX_CMD":
          // Process command
          console.log(`Recieved TX_CMD: ${msg.data}`);
          checkInputs(msg.data);
          break;
        default:
          console.error("Invalid command recieved");
      }
    });

    // Fetch it as a NodeJS buffer
    streamCamera.on('frame', (data) => {
      const base64Data = "data:image/jpeg;base64," + data.toString("base64")
      const TX_FRAME = {
        cmd: "TX_FRAME",
        target: "server",
        data: base64Data
      }
      console.log("Sending frame:" + JSON.stringify(TX_FRAME))
      ws.send(JSON.stringify(TX_FRAME))
    })

    async function cameraStartCapture() {
      await streamCamera.startCapture();
    }

    cameraStartCapture().then(() => {
      console.log('Camera is now capturing');
    });

  } catch (err) {
    console.error(`Error: ${err.response?.status} ${err.response?.data}`);
  }
};

let wTimeOut = new Date().getTime();
let sTimeOut = new Date().getTime();
let aTimeOut = new Date().getTime();
let dTimeOut = new Date().getTime();
let wPressed = 0;
let sPressed = 0;
let aPressed = 0;
let dPressed = 0;

initSocketConn();

const clearInputs = () => {
  if (new Date().getTime() - wTimeOut > timeOut) {
    wPressed = 0;
  }
  if (new Date().getTime() - sTimeOut > timeOut) {
    sPressed = 0;
  }
  if (new Date().getTime() - aTimeOut > timeOut) {
    aPressed = 0;
  }
  if (new Date().getTime() - dTimeOut > timeOut) {
    dPressed = 0;
  }
  setInputs();
};
const checkInputs = (data) => {
  console.log("checking input" + data);
  if (data === "W") {
    wPressed = 1;
    wTimeOut = new Date().getTime();
  }
  if (data === "S") {
    sPressed = 1;
    sTimeOut = new Date().getTime();
  }
  if (data === "A") {
    aPressed = 1;
    aTimeOut = new Date().getTime();
  }
  if (data === "D") {
    dPressed = 1;
    dTimeOut = new Date().getTime();
  }
  setInputs();
};

const setInputs = () => {
  if (
    (wPressed && !sPressed && !aPressed && !dPressed) ||
    (aPressed && dPressed && wPressed && !sPressed)
  ) {
    //forward
    console.log(`Forward`);
    Lforward.pwmWrite(255);
    Rforward.pwmWrite(255);
    Lreverse.pwmWrite(0);
    Rreverse.pwmWrite(0);
  }
  if (
    (!wPressed && sPressed && !aPressed && !dPressed) ||
    (aPressed && dPressed && !wPressed && sPressed)
  ) {
    //backward
    console.log(`Backward`);
    Lforward.pwmWrite(0);
    Rforward.pwmWrite(0);
    Lreverse.pwmWrite(255);
    Rreverse.pwmWrite(255);
  }
  if (!wPressed && !sPressed && aPressed && !dPressed) {
    //left
    console.log(`Left`);
    Lforward.pwmWrite(0);
    Rforward.pwmWrite(255);
    Lreverse.pwmWrite(255);
    Rreverse.pwmWrite(0);
  }
  if (!wPressed && !sPressed && !aPressed && dPressed) {
    //right
    console.log(`Right`);
    Lforward.pwmWrite(255);
    Rforward.pwmWrite(0);
    Lreverse.pwmWrite(0);
    Rreverse.pwmWrite(255);
  }
  if (wPressed && !sPressed && aPressed && !dPressed) {
    //forward left
    Lforward.pwmWrite(50);
    Rforward.pwmWrite(255);
    Lreverse.pwmWrite(0);
    Rreverse.pwmWrite(0);
  }
  if (wPressed && !sPressed && !aPressed && dPressed) {
    //forward right
    Lforward.pwmWrite(255);
    Rforward.pwmWrite(50);
    Lreverse.pwmWrite(0);
    Rreverse.pwmWrite(0);
  }
  if (!wPressed && sPressed && aPressed && !dPressed) {
    //backward left
    Lforward.pwmWrite(0);
    Rforward.pwmWrite(0);
    Lreverse.pwmWrite(50);
    Rreverse.pwmWrite(255);
  }
  if (!wPressed && sPressed && !aPressed && dPressed) {
    //backward right
    Lforward.pwmWrite(0);
    Rforward.pwmWrite(0);
    Lreverse.pwmWrite(50);
    Rreverse.pwmWrite(255);
  }
  if (
    (!wPressed && !sPressed && !aPressed && !dPressed) ||
    (wPressed && sPressed)
  ) {
    //stopped
    Lforward.pwmWrite(0);
    Rforward.pwmWrite(0);
    Lreverse.pwmWrite(0);
    Rreverse.pwmWrite(0);
  }
};
