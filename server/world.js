import Player from "./player";
import Tile from "./tile";
import Queue from "./queue";

const LOBBY_TIME = 5;

export let worldWidth = 0;
export let worldHeight = 0;
export const worldMapValues = [];
export const worldFoodValues = [];
export const spawnPoints = [[116, 0], [138, 0], [161, 4], [181, 12], [200, 23], [217, 37], [232, 55], [243, 73], [250, 95],
    [254, 117], [254, 138], [250, 161], [242, 182], [232, 200], [218, 217], [201, 231], [182, 242],
    [160, 250], [138, 254], [117, 254], [94, 250], [74, 243], [54, 231], [37, 217], [23, 200],
    [12, 181], [5, 162], [0, 139], [0, 115], [5, 93], [12, 74], [23, 54], [38, 36], [53, 24],
    [73, 12], [94, 4]];

Array.prototype.inArray = function(comparer) {
    for(var i=0; i < this.length; i++) {
        if(comparer(this[i])) return true;
    }
    return false;
};

// adds an element to the array if it does not already exist using a comparer
// function
Array.prototype.pushIfNotExist = function(element, comparer) {
    if (!this.inArray(comparer)) {
        this.push(element);
    }
};

export default class World {

    constructor(database, callback) {
        this.db = database;

        this.broadcast = this.broadcast.bind(this);
        this.updateTile = this.updateTile.bind(this);
        this.queue = this.queue.bind(this);
        this.start = this.start.bind(this);
        this.gameLoop = this.gameLoop.bind(this);
        this.moveToTile = this.moveToTile.bind(this);
        this.setRally = this.setRally.bind(this);
        this.changeOwner = this.changeOwner.bind(this);

        this.removePlayer = this.removePlayer.bind(this);
        this.clear = this.clear.bind(this);

        console.log(worldMapValues);

        if(worldMapValues.length === 0) {
            const getpixels = require("get-pixels");
            getpixels("server/map.png", (err, pixels) => {
                if(err) {
                    console.log("Bad image path", err);
                    return;
                }

                worldWidth = 256;
                worldHeight = 256;

                for(let i = 0; i < 256; i++) {
                    for(let j = 0; j < 256; j++) {
                        const value = pixels.get(i, j, 0);
                        if(pixels.get(i, j, 3) === 0)
                            worldMapValues.push(-1);
                        else if(value >= 163)
                            worldMapValues.push(15 - (value - 256));
                        else
                            worldMapValues.push(Math.round(Math.pow((value - 256) / 30, 4)) + 15);
                    }
                }

                getpixels("server/mapfood.png", (err, pixels) => {

                    if(err) {
                        console.log("Bad image path", err);
                        return;
                    }

                    for(let i = 0; i < 256; i++) {
                        for(let j = 0; j < 256; j++) {
                            if(pixels.get(i, j, 3) === 0)
                                worldFoodValues.push(-1);
                            else
                                worldFoodValues.push((256 - pixels.get(i, j, 0)));
                        }
                    }

                    this.clear();
                    callback(this);
                });
            });
        }
        else {
            this.clear();
            callback(this);
        }
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

    updateTile(x, y, func) {

        func(this.tiles[x][y]);

        const viewers = [];

        let owner = this.tiles[x][y].owner;

        if(owner)
            viewers.pushIfNotExist(owner, (viewer) => viewer === owner);

        owner = this.tiles[x - 1][y] ? this.tiles[x - 1][y].owner : undefined;

        if(owner)
            viewers.pushIfNotExist(owner, (viewer) => viewer === owner);

        owner = this.tiles[x + 1][y] ? this.tiles[x + 1][y].owner : undefined;

        if(owner)
            viewers.pushIfNotExist(owner, (viewer) => viewer === owner);

        owner = this.tiles[x][y - 1] ? this.tiles[x][y - 1].owner : undefined;

        if(owner)
            viewers.pushIfNotExist(owner, (viewer) => viewer === owner);

        owner = this.tiles[x][y + 1] ? this.tiles[x][y + 1].owner : undefined;

        if(owner)
            viewers.pushIfNotExist(owner, (viewer) => viewer === owner);

        viewers.forEach((viewer) => {
            if(!this.updates[viewer])
                this.updates[viewer] = {};

            this.updates[viewer][x + y * worldWidth] = { value : this.tiles[x][y].value, owner : this.tiles[x][y].owner ? this.tiles[x][y].owner === viewer : undefined };
        });
    }

    queue(socket, data) {
        if(!this.gameActive) {
            console.log("First player joined!");

            this.players[socket.id] = new Player(socket);

            this.lobby = new Date();
            this.lobby.setSeconds(this.lobby.getSeconds() + LOBBY_TIME);
            this.gameActive = true;

            setTimeout(() => {
                this.lobby = undefined;
                this.start();
            }, LOBBY_TIME * 1000);

            socket.emit("lobby-time", { lobby : this.lobby, world : worldMapValues, foodMap : worldFoodValues, width: worldWidth, height : worldHeight, playerCount : Object.keys(this.players).length });
        }
        else if(this.lobby && Object.keys(this.players).length < 36) {
            console.log("Another player joined!");

            this.players[socket.id] = new Player(socket);

            socket.emit("lobby-time", { lobby : this.lobby, world : worldMapValues, foodMap : worldFoodValues, width: worldWidth, height : worldHeight, playerCount : Object.keys(this.players).length });

            this.broadcast("player-count", { playerCount : Object.keys(this.players).length });
        }
        else {
            this.playerQueue.push(new Player(socket));
            socket.emit("queue", {});
        }

    }

    start() {
        console.log("Starting game");
        let count = 0;
        this.broadcast("start-game", (player) => {
            const tile = this.tiles[spawnPoints[count][0]][spawnPoints[count][1]];

            tile.setOwner(player.socket.id);
            tile.value = 99999;

            player.add(tile);

            return { spawn : spawnPoints[count++] };
        });

        this.broadcast("update-tiles", (player) => {
            let tiles = {};
            for(let i = 0; i < count; i++) {
                const tile = this.tiles[spawnPoints[i][0]][spawnPoints[i][1]];
                tiles[spawnPoints[i][0] + spawnPoints[i][1] * worldWidth] = { value : tile.value, owner : tile.owner === player.socket.id };
            }
            return tiles;
        });

        setInterval(this.gameLoop, 500);
    }

    gameLoop() {
        this.moveQueues.forEach((queue, index) => {
            if(queue.nextTile()) {
                this.moveQueues.splice(index, 1);
            }
        });

        for(let i = 0; i < 256; i++) {
            for(let j = 0; j < 256; j++) {
                if(this.tiles[i][j] && this.tiles[i][j].owner)
                    this.updateTile(i, j, (tile) => tile.calcFood(this.loop))
            }
        }


        for(let property in this.updates) {
            if(property && this.updates.hasOwnProperty(property)) {
                this.players[property].socket.emit("update-tiles", this.updates[property]);
            }
        }

        this.updates = {};
        this.loop++;
    }

    moveToTile(socket, data) {
        if(data.x !== undefined && data.y !== undefined && data.toX !== undefined && data.toY !== undefined)
            this.moveQueues.push(new Queue({ world : this, pos : { x : data.x, y : data.y }, toPos : { x : data.toX, y : data.toY }, value : this.tiles[data.x][data.y].value }));
    }

    setRally(socket, data) {
        console.log(data);
        if(data.x !== undefined && data.y !== undefined && data.toX !== undefined && data.toY !== undefined && this.tiles[data.toX][data.toY].owner === socket.id)
            this.tiles[data.x][data.y].setRally(this.tiles[data.toX][data.toY]);
    }

    changeOwner(tile, newOwner) {
        this.players[newOwner].add(tile);

        if(tile.owner && this.players[tile.owner].remove(tile)) {
            console.log("Sending lose condition");
            this.players[tile.owner].socket.emit("game-lose", {});

            delete this.players[tile.owner];

            if(Object.keys(this.players).length === 1) {
                this.players[newOwner].socket.emit("game-lose", {});
                this.clear();
            }
        }

        tile.setOwner(newOwner);
    }

    removePlayer(socket) {

    }

    clear() {
        this.db.run("INSERT INTO totalGame VALUES (1)", ["C"], function(err) {
            if(err)
                return console.log(err.message);

            console.log("ADDED to SERVER");
        });
        this.tiles = [];
        for(let i = 0; i < 256; i++) {
            const column = {};
            for(let j = 0; j < 256; j++) {
                if(worldMapValues[i + j * 256] >= 0) {
                    column[j + ""] = new Tile({ x : i, y : j }, worldMapValues[i + j * worldWidth], worldFoodValues[i + j * worldWidth]);
                }
            }
            this.tiles.push(column);
        }

        this.broadcast("clear", {});

        this.players = {};
        this.gameActive = false;
        this.lobby = undefined;

        this.loop = 0;

        this.updates = {};
        this.moveQueues = [];

        if(this.playerQueue) {
            for(let i = 0; i < this.playerQueue.length; i++) {
                this.queue(this.playerQueue[i], {});
            }
        }

        this.playerQueue = [];

    }
};