const fs = require("fs");
const https = require("https");
const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;

require("dotenv").config();

let users = {};
let allUsers = [];

const httpsServer = https.createServer({
  key: fs.readFileSync(process.env.SSL_PRIVATE_KEY),
  cert: fs.readFileSync(process.env.SSL_BUNDLE)
});
httpsServer.listen(process.env.SERVER_PORT, "0.0.0.0");

const wss = new WebSocketServer({ server: httpsServer });
const ACTION = {
  login: "login",
  offer: "offer",
  answer: "answer",
  candidate: "candidate",
  leave: "leave",
  error: "error"
};

wss.on("connection", function(ws) {
  ws.on("message", function(message) {
    let data = parseDataMessage(message);
    console.log("Received data:", data);
    switch (data.type) {
      case ACTION.login:
        console.log("User logged", data.name);
        if (users[data.name]) {
          sendTo(ws, { type: ACTION.login, success: false });
        } else {
          users[data.name] = ws;
          allUsers.includes(data.name)
            ? console.log("This user already exists")
            : allUsers.push(data.name);
          ws.name = data.name;
          sendTo(ws, { type: ACTION.login, success: true, allUsers: allUsers });
        }
        break;
      case ACTION.offer:
        console.log("Sending offer to: ", data.name);
        var connection = users[data.name];
        if (connection) {
          ws.otherName = data.name;
          sendTo(connection, {
            type: ACTION.offer,
            offer: data.offer,
            name: ws.name
          });
        }
        break;
      case ACTION.answer:
        console.log("Sending answer to: ", data.name);
        var connection = users[data.name];
        if (connection) {
          ws.otherName = data.name;
          sendTo(connection, { type: ACTION.answer, answer: data.answer });
        }
        break;
      case ACTION.candidate:
        console.log("Sending candidate to:", data.name);
        var connection = users[data.name];
        if (connection) {
          sendTo(connection, {
            type: ACTION.candidate,
            candidate: data.candidate
          });
        }
        break;
      case ACTION.leave:
        console.log("Disconnecting from", data.name);
        var connection = users[data.name];
        connection.otherName = null;
        if (connection) sendTo(connection, { type: ACTION.leave });
        break;
      default:
        sendTo(ws, {
          type: ACTION.error,
          message: "Command not found: " + data.type
        });
        break;
    }
  });

  ws.on("close", function() {
    if (ws.name) {
      delete users[ws.name];
      if (ws.otherName) {
        console.log("Disconnecting from ", ws.otherName);
        var connection = users[ws.otherName];
        connection.otherName = null;
        if (connection) sendTo(connection, { type: ACTION.leave });
      }
    }
  });
});

function sendTo(connection, message) {
  connection.send(JSON.stringify(message));
}

function parseDataMessage(message) {
  try {
    return JSON.parse(message);
  } catch {
    console.log("Invalid JSON");
    return {};
  }
}

console.log(
  `Server web socket running. Visit wss://localhost:${process.env.SERVER_PORT}`
);
