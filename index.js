import World from "./server/world";

const express = require("express");
const app = express();
const server = require("http").createServer(app).listen(55437);

const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./roots.db", (err) => {
    if(err)
        console.error(err.message);

    console.log("Connected to the Roots.io database.");
});

app.get("/", (req, res) => {
    res.sendfile("./client/index.html");
});

app.use(express.static("client"));

app.get("/socket.io.js", (req, res) => {
   res.sendfile("./node_modules/socket.io-client/dist/socket.io.js");
});

app.get("/paper.js", (req, res) => {
    res.sendfile("./node_modules/paper/dist/paper-full.js");
});


new World(db, (world) => {
    const io = require("socket.io")(server);
    io.on("connection", (socket) => {

        socket.on("queue", (data) => world.queue(socket, data));
        socket.on("move-to-tile", (data) => world.moveToTile(socket, data));
        socket.on("set-rally", (data) => world.setRally(socket, data));

        socket.on("disconnect", () => world.removePlayer(socket));
    });
});