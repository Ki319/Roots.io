import Player from "./player";

const worldMapValues = [];
const spawnPoints = [[116, 0], [138, 0], [161, 4], [181, 12], [200, 23], [217, 37], [232, 55], [243, 73], [250, 95],
                     [254, 117], [254, 138], [250, 161], [242, 182], [232, 200], [218, 217], [201, 231], [182, 242],
                     [160, 250], [138, 254], [117, 254], [94, 250], [74, 243], [54, 231], [37, 217], [23, 200],
                     [12, 181], [5, 162], [0, 139], [0, 115], [5, 93], [12, 74], [23, 54], [38, 36], [53, 24],
                     [73, 12], [94, 4]];

require("get-pixels")("server/map.png", function(err, pixels) {
    if(err) {
        console.log("Bad image path");
        return;
    }

    for(let i = 0; i < 256; i++) {
        for(let j = 0; j < 256; j++) {
            const value = pixels.get(i, j, 0);
            if(pixels.get(i, j, 3) === 0)
                worldMapValues.push(-1);
            else
                worldMapValues.push(value);
        }
    }
});

export default class World {

    constructor() {
        this.broadcast = this.broadcast.bind(this);
        this.queue = this.queue.bind(this);
        this.start = this.start.bind(this);
        this.tileClick = this.tileClick(this);

        this.removePlayer = this.removePlayer.bind(this);
        this.clear = this.clear.bind(this);

        this.clear();
    }

    broadcast(msg, data) {
        console.log(typeof(data));
        for(let property in this.players) {
            if(this.players.hasOwnProperty(property)) {
                if(typeof(data) === "object")
                    this.players[property].socket.emit(msg, data);
                else
                    this.players[property].socket.emit(msg, data(this.players[property]));
            }
        }
    }

    queue(socket, data) {
        if(!this.gameActive) {
            console.log("First player joined!");

            this.players[socket.id] = new Player(socket);

            this.lobby = new Date();
            this.gameActive = true;

            setTimeout(() => {
               this.lobby = undefined;
               this.start();
            }, 10 * 1000);

            socket.emit("lobby-time", { lobby : this.lobby });
        }
        else if(this.lobby) {
            console.log("Another player joined!");

            this.players[socket.id] = new Player(socket);

            socket.emit("lobby-time", { lobby : this.lobby });
        }
    }

    start() {
        console.log("Starting game");
        let count = 0;
        this.broadcast("start-game", (player) => {
            console.log("Spawning player(" + player.socket.id + ") at : " + spawnPoints[count][0] + ", " + spawnPoints[count][1]);
            count++;
            return { spawn : spawnPoints[count] };
        });
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