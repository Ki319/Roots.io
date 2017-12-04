var app = require("express")();
var server = require("http").createServer(app).listen(55437);
var io = require("socket.io").listen(server);

var world = require("./world.js");

app.get("/", function(req, res) {
   res.sendfile("index.html");
});

io.on("connection", function(socket) {

});