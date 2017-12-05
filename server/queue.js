export default class Queue {
    constructor(move) {
        this.move = move;
    }

    nextTile() {
        const disX = this.move.pos.x - this.move.toPos.x;
        const disY = this.move.pos.y - this.move.toPos.y;
        if(Math.abs(disX) >= Math.abs(disY))
            this.move.pos.x += disX / Math.abs(disX);
        else
            this.move.pos.y += disY / Math.abs(disY);

        return { x : this.move.pos.x, y : this.move.pos.y, pop : (this.move.pos.x === this.move.toPos.x && this.move.pos.y === this.move.toPos.y) };
    }
}