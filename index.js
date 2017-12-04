import World from "./world";

const app = require("express")();
const server = require("http").createServer(app).listen(55437);
const io = require("socket.io")(server);

const world = new World();

app.get("/", (req, res) => {
    res.sendfile("./client/index.html");
});

app.get("/socket.io.js", (req, res) => {
   res.sendfile("./node_modules/socket.io-client/dist/socket.io.js");
});

io.on("connection", (socket) => {

    socket.on("queue", (data) => world.queue(socket, data));
    socket.on("click-tile", (data) => world.tileClick(socket, data));

    socket.on("disconnect", () => world.removePlayer(socket));
});