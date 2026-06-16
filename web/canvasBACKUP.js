const canvasContainer = document.getElementById("page");
const canvas = document.getElementById("game-canvas");

function resizeHandler() {
    canvasContainer.className =
        canvasContainer.clientWidth / canvas.width < canvasContainer.clientHeight / canvas.height
            ? "width-scaling"
            : "height-scaling";
}

resizeHandler();

window.addEventListener("resize", resizeHandler);

const ctx = canvas.getContext("2d");

const keyEvents = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    mouseDown: false,
    shift: false,
};

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get distance() {
        return Math.hypot(this.x, this.y);
    }

    set distance(newDistance) {
        let change = newDistance / this.distance;
        this.x *= change;
        this.y *= change;
    }
}

class Block {
    constructor(pos, sideLength) {
        this.pos = pos;
        this.sideLength = sideLength;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = this.colour;
        ctx.fillRect(
            this.pos.x - this.sideLength / 2,
            this.pos.y - this.sideLength / 2,
            this.sideLength,
            this.sideLength
        );
        // ctx.fill();
        ctx.closePath();
    }
}

const game = {};

const speedLimit = (n, limit) => limit * Math.tanh(n / (1.25 * limit));

const player = {
    pos: new Vector2(50, 50),
    nextPos: new Vector2(50, 50),

    velocity: new Vector2(0, 0),
    gravityStrength: -1,
    canJump: 4, // ${player.canJump} frames left of jump; coyote jump

    sideLength: 20,
    size: 20 * 20,

    spiritColour: "White",
    spiritSize: 20 * 0.7,
    freeSpirit: false,

    bodyColour: "Black",

    processkeyEvents() {
        let xDirection = 0;

        const asdf = 4;

        if (keyEvents.a && !keyEvents.d) {
            this.velocity.x -= asdf;
            xDirection = -1;
        } else if (keyEvents.d && !keyEvents.a) {
            this.velocity.x += asdf;
            xDirection = 1;
        } else {
            if (Math.abs(this.velocity.x) < 0.5) {
                this.velocity.x = 0;
            }
        }

        if (keyEvents.space && this.canJump) {
            this.velocity.y = -(this.size / 40);
            this.canJump = 0;
        }

        if (keyEvents.s) {
            this.gravityStrength = 2;
        } else {
            this.gravityStrength = 1;
        }

        return xDirection * asdf;
    },

    willCollide(Block) {
        let dist = (Block.sideLength + this.sideLength) / 2;
        return (
            Block.relPos.x - dist <= this.nextPos.x &&
            this.nextPos.x <= Block.relPos.x + dist &&
            Block.relPos.y - dist <= this.nextPos.y &&
            this.nextPos.y <= Block.relPos.y + dist
        );
    },

    processCollisions() {
        // TODO: fix wallhopping (not an issue yet)

        if (this.nextPos.x < this.sideLength / 2) {
            this.velocity.x = this.velocity.x > 0 ? this.velocity.x : 0;
            this.pos.x = this.sideLength / 2;
        } else if (this.nextPos.x > canvas.width - this.sideLength / 2) {
            this.velocity.x = this.velocity.x < 0 ? this.velocity.x : 0;
            this.pos.x = canvas.width - this.sideLength / 2;
        }

        this.canJump = this.canJump > 0 ? this.canJump - 1 : 0;

        if (this.nextPos.y < this.sideLength / 2) {
            this.velocity.y = this.velocity.y > 0 ? this.velocity.y : 0;
            this.pos.y = this.sideLength / 2;
        } else if (this.nextPos.y > canvas.height - this.sideLength / 2) {
            this.velocity.y = this.velocity.y < 0 ? this.velocity.y : 0;
            this.pos.y = canvas.height - this.sideLength / 2;
            this.canJump = 4;
        }

        // Code for collisions with Blocks/blocks here [UNFINISHED]

        // Block collisions
        // game.levelList[canvas.levelID].roomsList[canvas.roomID].objects.forEach((Block) => {
        //     if (this.willCollide(Block)) {
        //         let dist = (this.sideLength + Block.sideLength) / 2;
        //         let distX = this.nextPos.x - Block.relPos.x;
        //         let distY = this.nextPos.y - Block.relPos.y;

        //         if (-1 * distY >= Math.abs(distX)) {
        //             // Top section
        //             this.velocity.y = this.velocity.y < 0 ? this.velocity.y : 0;
        //             this.pos.y = Block.relPos.y - dist;
        //             this.canJump = true;
        //         } else if (-1 * distX > Math.abs(distY)) {
        //             // Left section
        //             this.velocity.x = this.velocity.x < 0 ? this.velocity.x : 0;
        //             this.pos.x = Block.relPos.x - dist;
        //         } else if (distX > Math.abs(distY)) {
        //             // Right section
        //             this.velocity.x = this.velocity.x > 0 ? this.velocity.x : 0;
        //             this.pos.x = Block.relPos.x + dist;
        //         } else if (distY >= Math.abs(distX)) {
        //             // Bottom section
        //             this.velocity.y = this.velocity.y > 0 ? this.velocity.y : 0;
        //             this.pos.y = Block.relPos.y + dist;
        //         }
        //     }
        // });
    },

    update(deltaTime) {
        let timeMult = deltaTime / 16;

        // TODO: Make the player be able to function when the spirit is in habiting blocks (detached from player)
        let xDirection = this.processkeyEvents();

        this.nextPos = new Vector2(
            this.pos.x + this.velocity.x + xDirection,
            this.pos.y + this.velocity.y + (this.gravityStrength * this.size) / 500
        );

        if (!this.freeSpirit) {
            this.processCollisions();

            this.velocity.y += (this.gravityStrength * this.size * timeMult) / 500;

            const speedLim = new Vector2(11, 50);

            this.velocity.x = speedLimit(this.velocity.x, speedLim.x, timeMult);

            if (this.velocity.y >= this.size) {
                this.velocity.y = this.size;
            } else if (this.velocity.y <= (-2 * this.size) / speedLim.y) {
                this.velocity.y = (-2 * this.size) / speedLim.y;
            }

            // this.processCollisions();

            this.pos.x += this.velocity.x * timeMult;
            this.pos.y += this.velocity.y * timeMult;
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
            this.pos = new Vector2(
                (Math.floor(this.pos.x / this.sideLength) + 0.5) * this.sideLength,
                (Math.floor(this.pos.y / this.sideLength) + 0.5) * this.sideLength
            );
        }

        if (this.freeSpirit) {
            if (this.spiritSize > this.sideLength * 0.35) {
                this.spiritSize *= timeMult / 1.2;
            } else {
                this.spiritSize = this.sideLength * 0.3 * timeMult;
            }
        } else {
            if (this.spiritSize < this.sideLength * 0.675) {
                this.spiritSize *= 0.97 * timeMult;
                this.spiritSize += 1 * timeMult;
            } else {
                this.spiritSize = this.sideLength * 0.7 * timeMult;
            }
        }

        // if (this.spiritSize == this.sideLength * 0.3) {
        //     game.levelList[canvas.levelID].roomsList[canvas.roomID].objects.push(
        //         new Block(this.pos, this.sideLength, this.colour)
        //     );
        // } // TODO: Make the player inhabit the block when shift is released
    },

    draw() {
        // Draw Player Body
        ctx.beginPath();

        ctx.fillStyle = this.bodyColour;

        let halfSideLength = this.sideLength / 2;

        ctx.moveTo(this.pos.x - halfSideLength, this.pos.y + halfSideLength);
        ctx.lineTo(this.pos.x + halfSideLength, this.pos.y + halfSideLength);
        ctx.lineTo(this.pos.x + halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
        ctx.lineTo(this.pos.x - halfSideLength + this.velocity.x, this.pos.y - halfSideLength);
        ctx.lineTo(this.pos.x - halfSideLength, this.pos.y + halfSideLength);

        ctx.fill();

        ctx.closePath();

        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = (125 * this.spiritSize) / this.sideLength;
        ctx.fillStyle = this.spiritColour;

        // Draw Spirit
        // Do not tweak, only touch it if you re-write the whole function.
        // I have no clue how it works but it does somehow.
        ctx.beginPath();

        halfSideLength = this.spiritSize / 2;

        ctx.moveTo(
            this.pos.x -
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2),
            this.pos.y + halfSideLength
        );
        ctx.lineTo(
            this.pos.x +
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2),
            this.pos.y + halfSideLength
        );
        ctx.lineTo(
            this.pos.x +
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2) +
                (this.velocity.x * this.spiritSize) / this.sideLength,
            this.pos.y - halfSideLength
        );
        ctx.lineTo(
            this.pos.x -
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2) +
                (this.velocity.x * this.spiritSize) / this.sideLength,
            this.pos.y - halfSideLength
        );
        ctx.lineTo(
            this.pos.x -
                halfSideLength +
                ((this.sideLength - this.spiritSize) * this.velocity.x) / (this.sideLength * 2),
            this.pos.y + halfSideLength
        );

        ctx.fill();
        ctx.closePath();

        ctx.shadowBlur = 0;
    },
};

const mouse = {}; // May be added for some feature I haven't thought of yet

(async () => {
    // window.addEventListener("resize", function () {
    //     ctx.canvas.width = window.innerWidth;
    //     ctx.canvas.height = window.innerHeight;

    //     // Fix borders after resize
    //     game.updateBorders();
    // });

    window.addEventListener("mousemove", function (event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener("keydown", function (event) {
        switch (event.key.toLowerCase()) {
            case "a":
                keyEvents.a = true;
                break;
            case "s":
                keyEvents.s = true;
                break;
            case "d":
                keyEvents.d = true;
                break;
            case "f":
                game.paused = true;
                break;
            case "w":
            case " ":
                keyEvents.space = true;
                break;
            case "shift":
                player.freeSpirit = true;
                break;
            default:
                break;
        }
    });

    window.addEventListener("keyup", function (event) {
        switch (event.key.toLowerCase()) {
            case "a":
                keyEvents.a = false;
                break;
            case "s":
                keyEvents.s = false;
                break;
            case "d":
                keyEvents.d = false;
                break;
            case "f":
                game.paused = false;
                break;
            case "w":
            case " ":
                keyEvents.space = false;
                break;
            case "shift":
                player.freeSpirit = false;
                break;
            default:
                break;
        }
    });

    window.addEventListener("mousedown", function () {
        keyEvents.mouseDown = true;
    });

    window.addEventListener("mouseup", function () {
        keyEvents.mouseDown = false;
    });
})();

let prevTime = 0;
let deltaTime = 0;

function animate(currentTime) {
    deltaTime = currentTime - prevTime;

    if (deltaTime > 1_000) {
        requestAnimationFrame(animate);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(deltaTime);
    player.draw();

    prevTime = currentTime;

    requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
