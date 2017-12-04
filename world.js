var worldMapValues = [];

require("get-pixels")("map.png", function(err, pixels) {
    if(err) {
        console.log("Bad image path");
        return;
    }

    for(var i = 0; i < 256; i++) {
        for(var j = 0; j < 256; j++) {
            worldMapValues.push(pixels.get(i, j, 0));
        }
    }

    var string = "";
});

module.exports = function () {

};