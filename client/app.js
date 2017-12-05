var countdown;
var countdownText = "Time Until Game : ";
var worldMapValues = [];
var worldFoodValues = [];
var worldOwnerValues = {};
var worldSize;
var viewTileWidth1;
var viewTileWidth2;
var viewTileHeight;
var socket = io();
var currentClick = [];

var currentPos = new Point(0, 0);

view.viewSize = new Size(Math.max(document.documentElement.clientWidth, window.innerWidth || 0), Math.max(document.documentElement.clientHeight, window.innerHeight || 0));

lobbyText = new PointText(new Point(view.size.width / 2, view.size.height / 2));
lobbyText.fillColor = "lightgray";
lobbyText.fontSize = "3em";
lobbyText.fontFamily = "Impact";
//lobbyText.fontWeight = "bold";
lobbyText.justification = "center";
lobbyText.opacity = 0;

//lobbyText.point = new Point(view.width / 2, view.height / 2);

tileGroup = new Group([]);

tileGroup.sendToBack();

/*
for(let i = 0; i < 6; i++) {
  //  hexagon.add(new Point(60 * Math.cos(((2 * Math.PI) / 6) * i)), 60 * Math.sin(((2 * Math.PI) / 6) * i));
}
*/
//hexagon.moveTo(new Point(200, 200));

socket.on("connect", function() {
    console.log("connected!");

    socket.on("lobby-time", function(data) {
        console.log("Lobby time left");
        countdown = new Date(data.lobby).getTime();
        currentClick = [];
        worldMapValues = data.world;
        worldFoodValues = data.foodMap;
        worldSize = new Size(data.width, data.height);

        updateTileGroup();
    });

    socket.on("start-game", function(data) {
        console.log("Starting game");

        var tileY = data.spawn[1] - viewTileHeight / 2;

        tileY = Math.max(tileY, 0);
        tileY = Math.min(tileY, worldSize.height - viewTileHeight);

        currentPos.y = tileY * 76;

        currentPos.x = (data.spawn[0] - (tileY % 2 === 0 ? viewTileWidth1 : viewTileWidth2) / 2) * 88;

        currentPos.x = Math.max(currentPos.x, 0);
        currentPos.x = Math.min(currentPos.x, worldSize.width * 88 - view.size.width);

        populateTiles();

    }.bind(this));

    socket.on("update-tiles", function(data) {
        for(var property in data) {
            if(data.hasOwnProperty(property)) {
                worldMapValues[property] = data[property].value;
                worldOwnerValues[property] = data[property].owner;
            }
        }
        populateTiles();
    });

    socket.emit("queue", {});
});

function updateTileGroup() {
    if(worldSize) {
        var curX = 60;
        var curY = 60;

        tileGroup.removeChildren();

        var flag = 0;

        viewTileWidth1 = 0;
        viewTileWidth2 = 0;
        viewTileHeight = 0;

        for(var i = 0; i < worldSize.width && curY + 40 <= view.size.height; i++) {
            curX = i % 2 === 1 ? 104 : 60;
            for(var j = 0; j < worldSize.height && curX + 40 <= view.size.width; j++) {

                var tile = tileGroup.addChild(new Group([new Path.RegularPolygon(new Point(curX, curY), 6, 50), new PointText(new Point(curX, curY - 22))]));

                tile.children[0].strokeWidth = 2;
                tile.children[1].fillColor = "black";
                tile.children[1].fontWeight = "bold";
                tile.children[1].fontSize = 16;
                tile.children[1].fontFamily = "Arial";
                tile.children[1].justification = "center";

                curX += 88;
                if(!flag)
                    viewTileWidth1++;
                if(flag === 1)
                    viewTileWidth2++;
            }
            flag++;
            curY += 76;
            viewTileHeight++;
        }

        for(var i = 0; i < tileGroup.children.length; i++) {
            tileGroup.children[i].children[0].on("click", function(event) {
                var x = 0;
                var y = 0;

                var totalX = 0;

                for(y = 0; y < viewTileHeight; y++) {
                    if(tileGroup.children[totalX].children[0] === event.target) {
                        x = 0;
                        break;
                    }

                    var flag = false;

                    for(x = 0; ((y % 2 === 0 && x < viewTileWidth1) || (y % 2 === 1 && x < viewTileWidth2)); x++, totalX++) {
                        if(tileGroup.children[totalX].children[0] === event.target) {
                            flag = true;
                            break;
                        }
                    }

                    if(flag)
                        break;
                }

                x += Math.floor(currentPos.x / 88);
                y += Math.floor(currentPos.y / 76);

                if(!currentClick || currentClick.length === 0 || currentClick[2] !== event.event.button) {
                    if(worldMapValues[x + y * worldSize.width] !== -1 && worldOwnerValues[x + y * worldSize.width]) {
                        currentClick = [x, y, event.event.button];
                        populateTiles();
                    }
                    else
                        currentClick = [];
                }
                else if(worldMapValues[x + y * worldSize.width] !== -1) {

                    if(currentClick[0] !== x || currentClick[1] !== y) {
                        if(currentClick[2] === 0) {
                            console.log("MOVE TO TILE ", { x : currentClick[0], y : currentClick[1], toX : x, toY : y });
                            socket.emit("move-to-tile", { x : currentClick[0], y : currentClick[1], toX : x, toY : y });
                        }
                        else if(currentClick[2] === 2) {
                            console.log("SET RALLY ", { x : currentClick[0], y : currentClick[1], toX : x, toY : y });
                            socket.emit("set-rally", { x : currentClick[0], y : currentClick[1], toX : x, toY : y });
                        }
                    }

                    currentClick = [];
                    populateTiles();
                }
            });
        }

        populateTiles();
    }
}

function populateTiles() {
    var startX = Math.floor(currentPos.x / 88);
    var startY = Math.floor(currentPos.y / 76);

    var totalX = 0;

    for(var j = 0; j < viewTileHeight; j++) {
        for(var i = 0; (j % 2 === 0 && i < viewTileWidth1) || (j % 2 === 1 && i < viewTileWidth2); i++) {
            if(worldMapValues[(startX + i) + (startY + j) * worldSize.width] >= 0) {
                //Dark Brown 43, 29, 14
                //Dark Green 61, 186, 59
                var foodValue = worldFoodValues[(startX + i) + (startY + j) * worldSize.width];
                if(currentClick === undefined || currentClick.length === 0 || currentClick[0] !== startX + i || currentClick[1] !== startY + j)
                    tileGroup.children[totalX].children[0].strokeColor = "black";
                else {
                    tileGroup.children[totalX].children[0].strokeColor = "rgb(0,203,255)";
                }
                if(worldOwnerValues[(startX + i) + (startY + j) * worldSize.width] !== undefined) {
                    if(worldOwnerValues[(startX + i) + (startY + j) * worldSize.width])
                        tileGroup.children[totalX].children[0].fillColor = "blue";
                    else
                        tileGroup.children[totalX].children[0].fillColor = "red";
                }
                else
                    tileGroup.children[totalX].children[0].fillColor = "rgb(" + Math.round(61 - (61 - 43) / 256 * foodValue) + ", " + Math.round(186 - (186 - 29) / 256 * foodValue) + ", " + Math.round(59 - (59 - 14) / 256 * foodValue) + ")";

                tileGroup.children[totalX].children[1].content = worldMapValues[(startX + i) + (startY + j) * worldSize.width];
            }
            else {
                tileGroup.children[totalX].children[0].strokeColor = "white";
                tileGroup.children[totalX].children[0].fillColor = "white";
                tileGroup.children[totalX].children[1].content = "";
            }
            totalX++;
        }
    }
}

console.log("VIEW", view.pixelRatio, view.resolution);

function onMouseDrag(event) {

    var lastPos = currentPos;

    currentPos -= event.delta * 5;

    currentPos.x = Math.max(currentPos.x, 0);
    currentPos.x = Math.min(currentPos.x, worldSize.width * 88 - view.size.width);

    currentPos.y = Math.max(currentPos.y, 0);
    currentPos.y = Math.min(currentPos.y, worldSize.height * 76 - view.size.height);

    if(Math.floor(lastPos.x / 88) !== Math.floor(currentPos.x / 88) || Math.floor(lastPos.y / 76) !== Math.floor(currentPos.y / 76))
        populateTiles();
}

function onFrame(event) {
    view.viewSize = new Size(Math.max(document.documentElement.clientWidth, window.innerWidth || 0), Math.max(document.documentElement.clientHeight, window.innerHeight || 0));

    if(countdown) {
        var time = (((countdown) - new Date().getTime()) / 1000);
        if(time > 0) {
            lobbyText.opacity = 1;
            lobbyText.content = countdownText + Math.ceil(time) + "s";
        }
        else {
            countdown = undefined;
            game = true;
            lobbyText.opacity = 0;

        }
    }
}

function onResize(event) {
    updateTileGroup();
}