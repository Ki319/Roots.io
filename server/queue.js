import {worldHeight, worldWidth} from "./world";

export default class Queue {
    constructor(move) {
        this.world = move.world;
        this.pos = move.pos;
        this.toPos = move.toPos;
        this.value = move.value;
    }

    nextTile() {
        const currentTile = this.world.tiles[this.pos.x][this.pos.y];
        let flag = false;

        if(currentTile.value < this.value)
            this.value = currentTile.value;

        if(!this.value)
            return true;

        const moveValues = [{ x : this.pos.x + (this.pos.y % 2 === 0 ? -1 : 1), y : this.pos.y - 1 }, { x : this.pos.x - 1, y : this.pos.y }, { x : this.pos.x + (this.pos.y % 2 === 0 ? -1 : 1), y : this.pos.y + 1 },
                            { x : this.pos.x, y : this.pos.y - 1 }, { x : this.pos.x, y : this.pos.y + 1 }, { x : this.pos.x + 1, y : this.pos.y }];

        let shortestMoveValue = undefined;

        for(let i = 0; i < moveValues.length; i++)
        {
            let value;
            if(this.world.tiles[moveValues[i].x][moveValues[i].y]) {
                value = Math.abs(moveValues[i].x - this.toPos.x) + Math.abs(moveValues[i].y - this.toPos.y);
            }
            else {
                value = worldWidth * worldHeight + 10;
            }

            if(!shortestMoveValue || shortestMoveValue.value > value) {
                shortestMoveValue = moveValues[i];
                shortestMoveValue.value = value;
            }
        }

        this.world.updateTile(shortestMoveValue.x, shortestMoveValue.y, (tile) => {
            if(tile.owner === currentTile.owner)
                tile.value += this.value;
            else {
                tile.value -= this.value;
                if(tile.value < 0) {
                    this.world.changeOwner(currentTile, currentTile.owner);
                    tile.value = -tile.value;
                }
                else
                    flag = true;
            }
        });
        this.world.updateTile(this.pos.x, this.pos.y, (tile) => tile.value -= this.value);

        this.pos.x = shortestMoveValue.x;
        this.pos.y = shortestMoveValue.y;


        return flag || (this.pos.x === this.toPos.x && this.pos.y === this.toPos.y);
    }
}