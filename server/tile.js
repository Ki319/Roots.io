export default class Tile {
    constructor(pos, value, foodValue) {
        this.pos = pos;
        this.value = value;
        this.foodValue = foodValue;
        this.extraTime = 0;
        this.parentRallies = [];

        this.calcFood = this.calcFood.bind(this);
        this.addFood = this.addFood.bind(this);
        this.setOwner = this.setOwner.bind(this);
        this.clearRally = this.clearRally.bind(this);
        this.setRally = this.setRally.bind(this);
        this.moveParentRally = this.moveParentRally.bind(this);
    }

    calcFood(loopCount) {
        if(this.rallyTile) {
            if (!this.rallyStartTime)
                this.rallyStartTime = loopCount;
            else if (this.rallyTile.owner !== this.owner)
                this.clearRally();
            else if ((loopCount - this.rallyStartTime) % this.rallyDistance === 0)
                this.addFood(this.rallyTile);
        }
        else
            this.addFood(this);
    }

    addFood(tile) {
        this.extraTime += 500;
        tile.value += Math.floor(this.extraTime / this.foodValue);
        this.extraTime %= this.foodValue;
    }

    setOwner(owner) {
        this.clearRally();
        this.owner = owner;
    }

    clearRally() {
        this.rallyTile = undefined;
        this.rallyStartTime = undefined;
        this.rallyDistance = undefined;
    }

    setRally(toTile) {
        toTile.moveParentRally(this);

        this.rallyDistance = Math.abs(this.pos.x - this.rallyTile.pos.x) + Math.abs(this.pos.y - this.rallyTile.pos.y);

        for(let i = 0; i < this.parentRallies.length; i++) {
            this.rallyTile.moveParentRally(this.parentRallies[i]);
        }

        this.parentRallies = [];
    }

    moveParentRally(tile) {
        if(this.rallyTile)
            this.rallyTile.moveParentRally(tile);
        else {
            tile.rallyTile = this;
            this.parentRallies.push(tile);
        }
    }
}