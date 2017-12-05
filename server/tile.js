export default class Tile {
    constructor(value, foodValue) {
        this.value = value;
        this.foodValue = foodValue;
        this.extraTime = 0;

        this.calcFood = this.calcFood.bind(this);
    }

    calcFood() {
        this.extraTime += 500;
        this.value += Math.floor(this.extraTime / this.foodValue);
        this.extraTime %= this.foodValue;
    }
}