const axios = require("axios");
const { WebSocket } = require("ws");

initSocket = async () => {
  try {
    const response = await axios.post("http://francescogorini.com:4269/login", {
      username: "raspberrypirobot",
      password: "$fuckyomomma$",
    });
    const ws = new WebSocket(
      `ws://francescogorini.com:4269/ws?token=${response.data.token}`
    );
    ws.on("open", function open() {
      console.log("connected");
    });

    ws.on("close", function close() {
      console.log("disconnected");
    });

    ws.on("message", function message(data) {
      console.log(data.toString());
    });
  } catch (err) {
    console.error(err);
  }
};

initSocket();
