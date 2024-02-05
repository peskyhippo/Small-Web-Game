let canvas = document.getElementById("mainCanvas");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

const mouse = new Vector2(undefined, undefined);

const keyPresses = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
}

class Level {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.roomsList = [];
        this.currentRoom = undefined;
    };

    loadRoom(roomIndex) {
        this.currentRoom = this.roomsList[roomIndex];
        borders.reEvaluate();
    };

    draw() {
        undefined
    };
};

let currentLevel = new Level(200, 100);

const relativeToReal = new class {
    constructor() {
        // These are defined in borders.reEvaluate()
        this.multiplier = undefined;
        this.xOffset = undefined;
        this.yOffset = undefined;
    };

    convert(vector) {
        return new Vector2((vector.x * this.multiplier) - this.xOffset, (vector.y * this.multiplier) - this.yOffset);
    };

    convertX(x) {
        return (x * this.multiplier) - this.xOffset
    };

    convertY(y) {
        return (y * this.multiplier) - this.yOffset
    };
};

const borders = new class {
    reEvaluate() {
        if (window.innerWidth / window.innerHeight > currentLevel.width / currentLevel.height) {
            this.top    = window.innerHeight / 16;
            this.bottom = window.innerHeight * (15/16);
            relativeToReal.yOffset = this.top;

            let relativeWidth = window.innerHeight * (14/16) / currentLevel.height * currentLevel.width;
            relativeToReal.multiplier = (window.innerHeight * (14/16)) / currentLevel.height;

            this.left   = (window.innerWidth - relativeWidth) / 2;
            this.right  = window.innerWidth - ((window.innerWidth - relativeWidth) / 2);
            relativeToReal.xOffset = this.left;
        } else {
            this.left    = window.innerWidth / 16;
            this.right = window.innerWidth * (15/16);
            relativeToReal.xOffset = this.left;

            let relativeHeight = window.innerWidth * (14/16) / currentLevel.width * currentLevel.height;
            relativeToReal.multiplier = (window.innerWidth * (14/16)) / currentLevel.width;

            this.top   = (window.innerHeight - relativeHeight) / 2;
            this.bottom  = window.innerHeight - (window.innerHeight - relativeHeight) / 2;
            relativeToReal.yOffset = this.top;
        };
    };

    draw() {
        ctx.fillStyle = this.colour
        ctx.fillRect(0, 0, innerWidth, innerHeight);
        ctx.clearRect(this.left, this.top, this.right - this.left, this.bottom - this.top);
    };
};

borders.colour = "Black";
borders.reEvaluate();

class Platform {
    constructor(pos, sidelength) {
        this.relativePos = pos;
        this.realPos = relativeToReal.convert(pos);
        this.sidelength = sidelength;
    }
    
    draw() {
        ctx.beginPath();
        ctx.fillStyle = "Black"
        ctx.fillRect(this.pos.x - (this.sidelength / 2),
                     this.pos.y - (this.sidelength / 2),
                     this.sidelength,
                     this.sidelength);
        ctx.closePath();
    }
};

function initEventListeners() {
    window.addEventListener(
        'resize', 
        function() { 
            ctx.canvas.width  = window.innerWidth; 
            ctx.canvas.height = window.innerHeight; 
            borders.reEvaluate();
        });
    window.addEventListener("mousemove", 
    function(event) {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener("keydown",
    function(event) {
        switch (event.key.toLowerCase()) {
            case "w":
                keyPresses.w = true;
                break;
            case "a":
                keyPresses.a = true;
                break;
            case "s":
                keyPresses.s = true;
                break;
            case "d":
                keyPresses.d = true;
                break;
            case " ":
                keyPresses.space = true
                break;
            default:
                break;
        }
    });

    window.addEventListener("keyup",
    function(event) {
        switch (event.key.toLowerCase()) {
            case "w":
                keyPresses.w = false;
                break;
            case "a":
                keyPresses.a = false;
                break;
            case "s":
                keyPresses.s = false;
                break;
            case "d":
                keyPresses.d = false;
                break;
            case " ":
                keyPresses.space = false;
                break;
            default:
                break;
        }
    });
};

const player = new class {
    constructor() {
        this.relativePos        = new Vector2(currentLevel.width / 2, currentLevel.height / 2);
        this.realPos            = relativeToReal.convert(this.relativePos);
        this.gravityStrength    = 1;
        this.velocity           = new Vector2(0,0);
        this.relativeSideLength = 20;
        this.colour             = "Black";
        this.canJump            = false;
    };
    
    draw() {
        ctx.beginPath();
        ctx.strokeStyle = this.colour;
        ctx.fillStyle = this.colour;

        let halfSideLength = this.relativeSideLength * relativeToReal.multiplier / 2;

        ctx.moveTo(this.realPos.x - halfSideLength, this.realPos.y + halfSideLength);
        ctx.lineTo(this.realPos.x + halfSideLength, this.realPos.y + halfSideLength);
        ctx.lineTo(this.realPos.x + halfSideLength + (this.velocity.x * relativeToReal.multiplier), this.realPos.y - halfSideLength);
        ctx.lineTo(this.realPos.x - halfSideLength + (this.velocity.x * relativeToReal.multiplier), this.realPos.y - halfSideLength);
        ctx.lineTo(this.realPos.x - halfSideLength, this.realPos.y + halfSideLength);
        ctx.fill();
    };

    processKeyPresses() {
        if (keyPresses.a && !keyPresses.d) {
            this.velocity.x -= 1.5;
        } else if (keyPresses.d && !keyPresses.a) {
            this.velocity.x += 1.5;
        } else {
            if (this.velocity.x < -0.5 || this.velocity.x > 0.5) {
                this.velocity.x /= 1.2;
            } else {
                this.velocity.x = 0;
            }
        }

        if ((keyPresses.space || keyPresses.w) && this.canJump) {
            this.velocity.y = this.relativeSideLength * -2;
            this.canJump = false;
        }

        if (keyPresses.s) {
            this.gravityStrength = 2
        } else {
            this.gravityStrength = 1
        }
    };

    processCollisions() {
        this.canJump = false;
        if (this.relativePos.y + this.velocity.y > currentLevel.height - (this.relativeSideLength / 2)) {
            this.velocity.y = 0;
            this.relativePos.y = currentLevel.height - (this.relativeSideLength / 2);
            this.canJump = true;
        } else if (this.relativePos.y + this.velocity.y < this.relativeSideLength / 2) {
            this.velocity.y = 0;
            this.relativePos.y = this.relativeSideLength / 2;
        };
        
        if (this.relativePos + this.velocity.x < this.relativeSideLength / 2) {
            this.velocity.x = 0;
            this.relativePos.x = this.relativeSideLength / 2;
        } else if (this.relativePos.x + this.velocity.x > currentLevel.width - (this.relativeSideLength / 2)) {
            this.velocity.x = 0;
            this.relativePos.x = currentLevel.width - (this.relativeSideLength / 2);
        };

        // Make code for collisions with platforms and blocks here
        // Again, have fun future me :)
    };

    update() {
        this.processKeyPresses()

        this.velocity.y += this.gravityStrength / 2;

        // Enforce speed Limit
        if (this.velocity.x >= 10) {
            this.velocity.x = 10;
        } else if (this.velocity.x <= -10) {
            this.velocity.x = -10;
        }

        if (this.velocity.y >= 50) {
            this.velocity.y = 50;
        } else if (this.velocity.y <= -10) {
            this.velocity.y = -10;
        }

        this.relativePos.x += this.velocity.x;
        this.relativePos.y += this.velocity.y;

        this.processCollisions()

        console.log(this.relativePos);

        this.realPos = relativeToReal.convert(this.relativePos);

        this.draw();
    };
};

initEventListeners();

function animate() {
    requestAnimationFrame(animate);
    borders.draw();
    player.update();
    currentLevel.draw();
};

animate();

/*
Things which could be messing it up:
  - I have no clue, could be anything.
  - Have fun, future me ¯\_(ツ)_/¯
*/