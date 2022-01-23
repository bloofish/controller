const axios = require("axios");
const { WebSocket } = require("ws");
require("dotenv").config();
const Gpio = require("onoff").Gpio; //include onoff to interact with the GPIO

const API_URL = "https://francescogorini.com/rpi-relay";
const SOCK_URL = "wss://francescogorini.com/rpi-relay";

const Lforward = new Gpio(4, "out"); //use GPIO pin 4, and specify that it is output
//const Rforward = new Gpio(1, "out");
//const Lreverse = new Gpio(1, "out");
//const Rreverse = new Gpio(1, "out");

const timeOut = 200;

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
      const handle = setTimeout(() => clearInputs(), timeOut);
      console.log("Websocket connection established");
    });

    ws.on("close", () => {
      console.log("Websocket connection closed");
    });

    ws.on("message", (data) => {
      checkInputs(data);
      console.log(`Recieved from relay server: ${data.toString()}`);
    });
  } catch (err) {
    console.error(`Error: ${err.response.status} ${err.response.data}`);
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
//led.unexport();

const clearInputs = () => {
  console.log("deezinputgone");
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
  console.log(wPressed);
  setInputs();
};
const checkInputs = (data) => {
  if (data.toString() === "W") {
    wPressed = 1;
    wTimeOut = new Date().getTime();
  }
  if (data.toString() === "S") {
    sPressed = 1;
    sTimeOut = new Date().getTime();
  }
  if (data.toString() === "A") {
    aPressed = 1;
    aTimeOut = new Date().getTime();
  }
  if (data.toString() === "D") {
    dPressed = 1;
    dTimeOut = new Date().getTime();
  }
  setInputs();
};
const setInputs = () => {
  if (wPressed && !sPressed && !aPressed && !dPressed) {
    //forward
    Lforward.writeSync(1);
  }
  if (!wPressed && sPressed && !aPressed && !dPressed) {
    //backward
  }
  if (!wPressed && !sPressed && aPressed && !dPressed) {
    //left
  }
  if (!wPressed && !sPressed && !aPressed && dPressed) {
    //right
  }
  if (wPressed && !sPressed && aPressed && !dPressed) {
    //forward left
  }
  if (wPressed && !sPressed && !aPressed && dPressed) {
    //forward right
  }
  if (!wPressed && sPressed && aPressed && !dPressed) {
    //backward left
  }
  if (!wPressed && sPressed && !aPressed && dPressed) {
    //backward right
  }
  if (!wPressed && !sPressed && !aPressed && !dPressed) {
    //stopped
    Lforward.writeSync(0);
  }

  if (aPressed && dPressed) {
    //a&d stop turning (priority)
  }
  if (wPressed && sPressed) {
    //s&d stop (priority)
  }
};
