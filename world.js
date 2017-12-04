import Player from "./player";

const worldMapValues = [];

require("get-pixels")("map.png", function(err, pixels) {
    if(err) {
        console.log("Bad image path");
        return;
    }

    for(var i = 0; i < 256; i++) {
        for(var j = 0; j < 256; j++) {
            var value = pixels.get(i, j, 0);
            if(pixels.get(i, j, 3) === 0)
                worldMapValues.push(-1);
            else
                worldMapValues.push(value);
        }
    }
});

export default class World {

    constructor() {
        this.removePlayer = this.removePlayer.bind(this);
        this.clear = this.clear.bind(this);

        this.clear();
    }

    queue(socket, data) {
        if(!this.gameActive) {
            console.log("First player joined!");
            this.players[socket.id] = new Player(socket);
            this.lobby = new Date();
            this.gameActive = true;
            setTimeout(() => {
               this.lobby = undefined;
            }, 60 * 1000);
            socket.emit("lobby-time", { lobby : this.lobby });
        }
        else if(this.lobby) {
            console.log("Another player joined!");
            this.players[socket.id] = new Player(socket);
            socket.emit("lobby-time", { lobby : this.lobby });
        }
    }

    tileClick(socket, data) {

    }

    removePlayer(socket) {

    }

    clear() {
        this.playerMapValues = worldMapValues.slice();
        this.players = {};
        this.gameActive = false;
        this.lobby = undefined;
    }
};