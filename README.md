# WebRTC Signalling Server

## Generate a ssl certificate

```
$ mkdir ssl
$ openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
```

## Setup and Usage

The signaling server uses Node.js and ws

```
$ npm install
$ npm start
```

With the server running, visit `wss://localhost:$port`
