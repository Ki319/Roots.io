var countdown;
var countdownText = "Time Until Game : ";
var worldMapValues = [];
var worldSize;
var viewTileWidth1;
var viewTileWidth2;
var viewTileHeight;
var socket = io();

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
        worldMapValues = data.world;
        worldSize = new Size(data.width, data.height);

        updateTileGroup();
    });

    socket.on("start-game", function(data) {
        console.log("Starting game");
        console.log(worldMapValues.length);
    });

    socket.on("update-tiles", function(data) {
        console.log(data);
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

        for(var i = 0; i < worldSize.width && curY + 60 <= view.size.height; i++) {
            curX = i % 2 === 1 ? 104 : 60;
            for(var j = 0; j < worldSize.height && curX + 60 <= view.size.width; j++) {

                var tile = tileGroup.addChild(new Group([new Path.RegularPolygon(new Point(curX, curY), 6, 50), new PointText(new Point(curX, curY - 22))]));

                tile.children[0].strokeWidth = 2;
                tile.children[1].fillColor = "black";
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
            curY += 77;
            viewTileHeight++;
        }
        populateTiles();
    }
}

function populateTiles() {
    var startX = Math.floor(currentPos.x / 86);
    var startY = Math.floor(currentPos.y / 75);

    var totalX = 0;

    for(var j = 0; j < viewTileHeight; j++) {
        for(var i = 0; (j % 2 === 0 && i < viewTileWidth1) || (j % 2 === 1 && i < viewTileWidth2); i++) {
            if(worldMapValues[(startX + i) + (startY + j) * worldSize.width] >= 0) {
                tileGroup.children[totalX].children[0].strokeColor = "black";
                tileGroup.children[totalX].children[1].content = worldMapValues[(startX + i) + (startY + j) * worldSize.width];
            }
            else {
                tileGroup.children[totalX].children[0].strokeColor = "white";
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
    currentPos.x = Math.min(currentPos.x, worldSize.width * 86);

    currentPos.x = Math.max(currentPos.y, 0);
    currentPos.x = Math.min(currentPos.y, worldSize.height * 75);

    if(Math.floor(lastPos.x / 86) !== Math.floor(currentPos.x / 86) || Math.floor(lastPos.y / 75) !== Math.floor(currentPos.y / 75))
        populateTiles();
}

function onFrame(event) {
    view.viewSize = new Size(Math.max(document.documentElement.clientWidth, window.innerWidth || 0), Math.max(document.documentElement.clientHeight, window.innerHeight || 0));

    if(countdown) {
        var time = (((countdown) - new Date().getTime()) / 1000);
        if(time > 0) {
            lobbyText.opacity = 1;
            lobbyText.content = countdownText + time + "s";
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