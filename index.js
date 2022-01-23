const axios = require("axios");
const { WebSocket } = require("ws");
require("dotenv").config();
var Gpio = require("onoff").Gpio; //include onoff to interact with the GPIO

const API_URL = "https://francescogorini.com/rpi-relay";
const SOCK_URL = "wss://francescogorini.com/rpi-relay";

var LED = new Gpio(4, "out"); //use GPIO pin 4, and specify that it is output

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
      console.log("Websocket connection established");
    });

    ws.on("close", () => {
      console.log("Websocket connection closed");
    });

    ws.on("message", (data) => {
      checkInput(data);
      console.log(`Recieved from relay server: ${data.toString()}`);
    });
  } catch (err) {
    console.error(`Error: ${err.response.status} ${err.response.data}`);
  }
};

initSocketConn();
//led.unexport();

function checkInput(data) {
  if (err) {
    throw err;
  }
  if (data.toString == "W") {
    LED.writeSync(1);
    console.log("on");
  }
  if (data.toString == "S") {
    LED.writeSync(0);
    console.log("off");
  }
}
