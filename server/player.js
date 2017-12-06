export default class Player {
    constructor(socket) {
        this.socket = socket;

        this.ownedTiles = [];

        this.add = this.add.bind(this);
        this.remove = this.remove.bind(this);
    }

    add(tile) {
        this.ownedTiles.push(tile)
    }

    remove(tile) {
        this.ownedTiles = this.ownedTiles.filter((ownedTile) => { return ownedTile !== tile });

        return this.ownedTiles.length === 0;
    }
}