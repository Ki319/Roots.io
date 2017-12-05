export default class Queue {
    constructor(move) {
        this.world = move.world;
        this.pos = move.pos;
        this.toPos = move.toPos;
        this.value = move.value;
    }

    nextTile() {
        let move = this.pos;
        const moveValues = [{ x : move.x - 1, y : move.y - 1 }, { x : move.x - 1, y : move.y }, { x : move.x - 1, y : move.y + 1 },
                            { x : move.x, y : move.y - 1 }, { x : move.x, y : move.y + 1 }, { x : move.x + 1, y : move.y }];

        for(var i = 0; i < moveValues.length; i++)
        {
            if(this.world.tiles[moveValues[i].x][moveValues[i].y]) {

            }
        }

        this.updateTile(nextMove.x, nextMove.y, (tile) => tile.value += queue.move.value);
        this.updateTile(prevX, prevY, (tile) => tile.value -= queue.move.value);

        const disX = this.move.pos.x - this.move.toPos.x;
        const disY = this.move.pos.y - this.move.toPos.y;
        if(Math.abs(disX) >= Math.abs(disY))
            this.move.pos.x += disX / Math.abs(disX);
        else
            this.move.pos.y += disY / Math.abs(disY);

        return { x : this.move.pos.x, y : this.move.pos.y, pop : (this.move.pos.x === this.move.toPos.x && this.move.pos.y === this.move.toPos.y) };
    }
}