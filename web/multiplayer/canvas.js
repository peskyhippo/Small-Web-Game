const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pageDiv = document.getElementById("page");
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: false });

class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * @returns {number}
     */
    get r() {
        return Math.hypot(this.x, this.y);
    }

    set r(newR) {
        if (!(this.x || this.y)) return 0;

        let ratio = newR / this.r;

        this.x *= ratio;
        this.y *= ratio;

        return newR;
    }

    /**
     * @returns {number}
     */
    get theta() {
        return Math.atan2(this.x, this.y);
    }

    set theta(newTheta) {
        let r = this.r;
        this.x = r * Math.cos(newTheta);
        this.y = r * Math.sin(newTheta);

        return newTheta;
    }

    /**
     * Adds another vector to this one using cartesian co-ordinates, returns a reference to the same object
     * @param {Vector2} vector
     * @returns {Vector2}
     */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;

        return this;
    }
}

const squareSize = 20;
const keyStates = {};
const gameState = { blocks: false };
const blockTypes = {
    0: {
        name: "air",
        visible: false,
        collision: false,
        controllable: false,
    },
    1: {
        name: "block",
        visible: true,
        collision: true,
        controllable: true,
    },
};
const player = {
    pos: new Vector2(0, 0),
    vel: new Vector2(0, 0),

    jumpFrames: 0,
    speed: 1.5,

    sideLength: squareSize,
    spiritSize: 0.7,
    // 0 for in host, 1 for transitioning, 2 for moving
    spiritState: 0,

    drawSpiritGlow() {
        if (!keyStates.shift) {
            let inRadius = (this.sideLength * 0.95) / 2;

            ctx.shadowColor = "#fff";
            ctx.shadowBlur = (75 * this.spiritSize * this.sideLength) / this.sideLength;
            ctx.strokeStyle = "#fff";
            ctx.fillStyle = "#fff";

            ctx.beginPath();

            ctx.moveTo(this.pos.x - inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius + this.vel.x, this.pos.y - inRadius);
            ctx.lineTo(this.pos.x - inRadius + this.vel.x, this.pos.y - inRadius);
            ctx.closePath();

            ctx.fill();

            ctx.shadowBlur = 0;
        } else {
            let inRadius = (this.sideLength * this.spiritSize * 0.95) / 2;

            ctx.shadowColor = "#fff";
            ctx.shadowBlur = (75 * this.spiritSize * this.sideLength) / this.sideLength;
            ctx.strokeStyle = "#fff";
            ctx.fillStyle = "#fff";

            ctx.beginPath();

            ctx.moveTo(this.pos.x - inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius, this.pos.y - inRadius);
            ctx.lineTo(this.pos.x - inRadius, this.pos.y - inRadius);
            ctx.closePath();

            ctx.fill();

            ctx.shadowBlur = 0;
        }
    },

    draw() {
        // Drawing body
        if (!keyStates.shift) {
            ctx.strokeStyle = "#000";
            ctx.fillStyle = "#000";

            ctx.beginPath();

            let inRadius = this.sideLength / 2;

            ctx.moveTo(this.pos.x - inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius + this.vel.x, this.pos.y - inRadius);
            ctx.lineTo(this.pos.x - inRadius + this.vel.x, this.pos.y - inRadius);
            ctx.closePath();

            ctx.fill();

            // Draw spirit
            inRadius *= this.spiritSize;

            ctx.shadowColor = "#fff";
            ctx.strokeStyle = "#fff";
            ctx.fillStyle = "#fff";

            ctx.beginPath();

            ctx.moveTo(this.pos.x - inRadius + ((1 - this.spiritSize) * this.vel.x) / 2, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius + ((1 - this.spiritSize) * this.vel.x) / 2, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius + ((1 + this.spiritSize) * this.vel.x) / 2, this.pos.y - inRadius);
            ctx.lineTo(this.pos.x - inRadius + ((1 + this.spiritSize) * this.vel.x) / 2, this.pos.y - inRadius);
            ctx.closePath();

            ctx.fill();
        } else {
            let inRadius = (this.sideLength * this.spiritSize) / 2;

            ctx.shadowColor = "#fff";
            ctx.strokeStyle = "#fff";
            ctx.fillStyle = "#fff";

            ctx.beginPath();

            ctx.moveTo(this.pos.x - inRadius /* + ((1 - this.spiritSize) * this.vel.x) / 2 */, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius /* + ((1 - this.spiritSize) * this.vel.x) / 2 */, this.pos.y + inRadius);
            ctx.lineTo(this.pos.x + inRadius /* + ((1 + this.spiritSize) * this.vel.x) / 2 */, this.pos.y - inRadius);
            ctx.lineTo(this.pos.x - inRadius /* + ((1 + this.spiritSize) * this.vel.x) / 2 */, this.pos.y - inRadius);
            ctx.closePath();

            ctx.fill();
        }
    },

    update(dT) {
        const dTMult = dT * (3 / 50);

        const shrinkSpeed = 1.4;

        if ((!keyStates.shift && this.spiritState === 2) || (keyStates.shift && this.spiritState === 0)) {
            this.spiritState = 1;
        }

        if (!keyStates.shift) {
            if (this.spiritState === 1) {
                this.vel.x = 0;
                this.vel.y = 0;

                let col = Math.floor(this.pos.x / this.sideLength);
                let row = Math.floor(this.pos.y / this.sideLength);

                this.pos.x = this.sideLength * (col + 0.5);
                this.pos.y = this.sideLength * (row + 0.5);

                ws.send(JSON.stringify({ type: "spiritupd", value: 0, pos: { x: col, y: row } }));
                gameState.blocks[row][col] = 0;

                this.spiritState = 0;
            }

            this.spiritSize += 0.7 * (shrinkSpeed - 1);
            this.spiritSize /= shrinkSpeed;

            this.vel.y += (this.sideLength / 30) * dTMult;

            // Key Events
            if (this.jumpFrames && (keyStates.w || keyStates[" "])) {
                this.vel.y = -10;
                this.jumpFrames = 0;
            }

            if (keyStates.a && !keyStates.d) {
                this.vel.x -= this.speed * dTMult;
            } else if (!keyStates.a && keyStates.d) {
                this.vel.x += this.speed * dTMult;
            }

            const a = 30;
            this.vel.x = a * Math.tanh(this.vel.x / (1.25 * a));

            let nextPos = new Vector2(this.vel.x * dTMult, this.vel.y * dTMult).add(this.pos);
            // let nextPos = structuredClone(this.pos);
            let inRadius = this.sideLength / 2;

            // Border Collisions

            if (nextPos.x - inRadius < 0) {
                nextPos.x = inRadius;
                this.vel.x = this.vel.x < 0 ? 0 : this.vel.x;
            } else if (canvas.width < nextPos.x + inRadius) {
                nextPos.x = canvas.width - inRadius;
                this.vel.x = this.vel.x > 0 ? 0 : this.vel.x;
            }

            if (nextPos.y - inRadius < 0) {
                nextPos.y = inRadius;
                this.vel.y = this.vel.y < 0 ? 0 : this.vel.x;
            } else if (canvas.height < nextPos.y + inRadius) {
                nextPos.y = canvas.height - inRadius;
                this.vel.y = this.vel.y > 0 ? 0 : this.vel.x;
                this.jumpFrames = 4;
            } else if (0 < this.jumpFrames) {
                this.jumpFrames--;
            }

            // Block Collisions
            for (let row = 0; row < gameState.blocks.length; row++) {
                for (let col = 0; col < gameState.blocks[row].length; col++) {
                    const dist = (this.sideLength + squareSize) / 2;

                    if (
                        gameState.blocks[row][col] &&
                        (col + 0.5) * squareSize - dist <= nextPos.x &&
                        nextPos.x <= (col + 0.5) * squareSize + dist &&
                        (row + 0.5) * squareSize - dist <= nextPos.y &&
                        nextPos.y <= (row + 0.5) * squareSize + dist
                    ) {
                        // Distances from center of block to center of player

                        // Left of block = negative
                        let distX = nextPos.x - (col + 0.5) * squareSize;

                        // Above block = negative
                        let distY = nextPos.y - (row + 0.5) * squareSize;

                        // let distX = this.pos.x - (col + 0.5) * squareSize;
                        // let distY = this.pos.y - (row + 0.5) * squareSize;

                        let above = gameState.blocks[row - 1]?.[col] || 0,
                            left = gameState.blocks[row]?.[col - 1] || 0,
                            right = gameState.blocks[row]?.[col + 1] || 0,
                            under = gameState.blocks[row + 1]?.[col] || 0;

                        if (
                            ((distY <= 0 && distX - distY <= 0 && left) ||
                                -distY >= Math.abs(distX) ||
                                (distY <= 0 && distY + distX >= 0 && right)) &&
                            !above
                        ) {
                            this.vel.y = this.vel.y < 0 ? this.vel.y : 0;
                            nextPos.y = (row + 0.5) * squareSize - dist;
                            this.jumpFrames = 4;
                        } else if (-distX > Math.abs(distY) && !left) {
                            // Left section
                            this.vel.x = this.vel.x < 0 ? this.vel.x : 0;
                            nextPos.x = (col + 0.5) * squareSize - dist;
                        } else if (distX > Math.abs(distY) && !right) {
                            // Right section
                            this.vel.x = this.vel.x > 0 ? this.vel.x : 0;
                            nextPos.x = (col + 0.5) * squareSize + dist;
                        } else if (
                            ((distY >= 0 && distX + distY <= 0 && left) || distY >= Math.abs(distX) || (distY >= 0 && distX - distY >= 0 && right)) &&
                            !under
                        ) {
                            // Bottom section
                            this.vel.y = this.vel.y > 0 ? this.vel.y : 0;
                            nextPos.y = (row + 0.5) * squareSize + dist;
                        }
                    }
                }
            }

            this.pos = nextPos;
        } else {
            if (this.spiritState === 1) {
                this.vel.x = 0;
                this.vel.y = 0;

                let col = Math.floor(this.pos.x / this.sideLength);
                let row = Math.floor(this.pos.y / this.sideLength);

                this.pos.x = this.sideLength * (col + 0.5);
                this.pos.y = this.sideLength * (row + 0.5);

                ws.send(JSON.stringify({ type: "spiritupd", value: 1, pos: { x: col, y: row } }));
                gameState.blocks[row][col] = 1;

                this.spiritState = 2;
            }

            this.spiritSize += 0.3 * (shrinkSpeed - 1);
            this.spiritSize /= shrinkSpeed;

            // Key Events
            const a = 30;
            let keyVector = new Vector2(0, 0);

            if (keyStates.w && !keyStates.s) {
                keyVector.y -= 1;
            } else if (!keyStates.w && keyStates.s) {
                keyVector.y += 1;
            }

            if (keyStates.a && !keyStates.d) {
                keyVector.x -= 1;
            } else if (!keyStates.a && keyStates.d) {
                keyVector.x += 1;
            }

            keyVector.r = (this.speed * dTMult) / 2;

            this.vel.add(keyVector);

            this.vel.r = a * Math.tanh(this.vel.r / (1.25 * a));

            let nextPos = new Vector2(this.vel.x * dTMult, this.vel.y * dTMult).add(this.pos);
            let inRadius = (this.sideLength * (this.spiritSize + 1)) / 4;

            // Border Collisions
            if (nextPos.x - inRadius < 0) {
                nextPos.x = inRadius;
                this.vel.x = this.vel.x < 0 ? 0 : this.vel.x;
            } else if (canvas.width < nextPos.x + inRadius) {
                nextPos.x = canvas.width - inRadius;
                this.vel.x = this.vel.x > 0 ? 0 : this.vel.x;
            }

            if (nextPos.y - inRadius < 0) {
                nextPos.y = inRadius;
                this.vel.y = this.vel.y < 0 ? 0 : this.vel.x;
            } else if (canvas.height < nextPos.y + inRadius) {
                nextPos.y = canvas.height - inRadius;
                this.vel.y = this.vel.y > 0 ? 0 : this.vel.x;
                this.jumpFrames = 4;
            } else if (0 < this.jumpFrames) {
                this.jumpFrames--;
            }

            // Block Collisions

            for (let row = 0; row < gameState.blocks.length; row++) {
                for (let col = 0; col < gameState.blocks[row].length; col++) {
                    const dist = ((this.sideLength * (this.spiritSize + 1)) / 2 + squareSize) / 2;

                    if (
                        !gameState.blocks[row][col] &&
                        (col + 0.5) * squareSize - dist <= nextPos.x &&
                        nextPos.x <= (col + 0.5) * squareSize + dist &&
                        (row + 0.5) * squareSize - dist <= nextPos.y &&
                        nextPos.y <= (row + 0.5) * squareSize + dist
                    ) {
                        let distX = nextPos.x - (col + 0.5) * squareSize;
                        let distY = nextPos.y - (row + 0.5) * squareSize;

                        if (-1 * distY >= Math.abs(distX)) {
                            // Top section
                            this.vel.y = this.vel.y < 0 ? this.vel.y : 0;
                            nextPos.y = (row + 0.5) * squareSize - dist;
                            this.jumpFrames = 4;
                        } else if (-1 * distX > Math.abs(distY)) {
                            // Left section
                            this.vel.x = this.vel.x < 0 ? this.vel.x : 0;
                            nextPos.x = (col + 0.5) * squareSize - dist;
                        } else if (distX > Math.abs(distY)) {
                            // Right section
                            this.vel.x = this.vel.x > 0 ? this.vel.x : 0;
                            nextPos.x = (col + 0.5) * squareSize + dist;
                        } else if (distY >= Math.abs(distX)) {
                            // Bottom section
                            this.vel.y = this.vel.y > 0 ? this.vel.y : 0;
                            nextPos.y = (row + 0.5) * squareSize + dist;
                        }
                    }
                }
            }

            this.pos = nextPos;
        }
    },
};

let players = [];
function drawPlayer(playerData) {
    let x, y, dx, isCtrl, spiritSize, sideLength;
    try {
        ({ x, y, dx, isCtrl, spiritSize, sideLength } = playerData);
    } catch (error) {
        return false;
    }

    // Drawing body
    if (isCtrl) {
        ctx.strokeStyle = "#000";
        ctx.fillStyle = "#000";

        ctx.beginPath();

        let inRadius = sideLength / 2;

        ctx.moveTo(x - inRadius, y + inRadius);
        ctx.lineTo(x + inRadius, y + inRadius);
        ctx.lineTo(x + inRadius + dx, y - inRadius);
        ctx.lineTo(x - inRadius + dx, y - inRadius);
        ctx.closePath();

        ctx.fill();

        // Draw spirit
        inRadius *= spiritSize;

        ctx.shadowColor = "#fff";
        ctx.strokeStyle = "#fff";
        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.moveTo(x - inRadius + ((1 - spiritSize) * dx) / 2, y + inRadius);
        ctx.lineTo(x + inRadius + ((1 - spiritSize) * dx) / 2, y + inRadius);
        ctx.lineTo(x + inRadius + ((1 + spiritSize) * dx) / 2, y - inRadius);
        ctx.lineTo(x - inRadius + ((1 + spiritSize) * dx) / 2, y - inRadius);
        ctx.closePath();

        ctx.fill();
    } else {
        let inRadius = (sideLength * spiritSize) / 2;

        ctx.shadowColor = "#fff";
        ctx.strokeStyle = "#fff";
        ctx.fillStyle = "#fff";

        ctx.beginPath();

        ctx.moveTo(x - inRadius /* + ((1 - spiritSize) * dx) / 2 */, y + inRadius);
        ctx.lineTo(x + inRadius /* + ((1 - spiritSize) * dx) / 2 */, y + inRadius);
        ctx.lineTo(x + inRadius /* + ((1 + spiritSize) * dx) / 2 */, y - inRadius);
        ctx.lineTo(x - inRadius /* + ((1 + spiritSize) * dx) / 2 */, y - inRadius);
        ctx.closePath();

        ctx.fill();
    }

    return true;
}

let ws;
let ws_isOpen = false;
(async () => {
    ws = new WebSocket("/multiplayer");
    ws.onopen = () => {
        console.log("opened ws");
        ws_isOpen = true;
    };
    ws.onclose = () => {
        console.log("ws closed");
    };
    ws.onmessage = (event) => {
        let data = JSON.parse(event.data);

        if (data.type === "playerdata") {
            players[data.id] = data;
        } else if (data.type === "blockupd") {
            gameState.blocks[data.y][data.x] = data.block;
        } else if (data.type === "mapupd") {
            console.log("MAPUPD");

            gameState.blocks = data.blocks;
        } else if (data.type === "playerdisconnect") {
            delete players[data.id];
        } else if (data.type === "init") {
            console.log("INIT");

            gameState.blocks = data.blocks;
            gameState.width = data.width;
            gameState.height = data.height;
            player.pos.x = data.spawnPoint.x;
            player.pos.y = data.spawnPoint.y;
            // squareSize = data.squareSize;

            canvas.width = gameState.width * squareSize;
            canvas.height = gameState.height * squareSize;
        } else {
            // well thios is not supposed to happenj so idk ¯\_(ツ)_/¯
        }
    };
    ws.onerror = () => {
        // Oh noes
    };
})();

// Windows event listeners init
(async () => {
    /**
     * Updates canvas class based on how big the canvas is relative to it's container
     */
    function canvasResizeHandler() {
        pageDiv.className = pageDiv.clientWidth / canvas.width < pageDiv.clientHeight / canvas.height ? "width-scaling" : "height-scaling";
    }
    canvasResizeHandler();

    window.addEventListener("resize", () => {
        canvasResizeHandler(pageDiv, canvas);
    });

    // window.addEventListener("mousemove", (event) => {
    //     mouse.x = event.x;
    //     mouse.y = event.y;
    // });

    // window.addEventListener("mousedown", () => {
    //     mouse.down = true;
    // });

    // window.addEventListener("mouseup", () => {
    //     mouse.down = false;
    // });

    window.addEventListener("keydown", (event) => {
        keyStates[event.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (event) => {
        keyStates[event.key.toLowerCase()] = false;
    });
})();

let pT = -Infinity;

while (!ws_isOpen || !gameState.blocks) {
    await sleep(100);
    console.log("CONNECTING...");
}

requestAnimationFrame(function animate(cT) {
    let dT = cT - pT;

    if (dT < 1000) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        player.drawSpiritGlow();

        ctx.fillStyle = "#000";
        for (let row = 0; row < gameState.blocks.length; row++) {
            for (let col = 0; col < gameState.blocks[row].length; col++) {
                if (gameState.blocks[row][col]) {
                    ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
                }
            }
        }

        player.draw();
        for (let i = 0; i < players.length; i++) {
            if (!drawPlayer(players[i])) {
                // Don't rly care icl
            }
        }
        player.update(dT);
    }

    ws.send(
        JSON.stringify({
            type: "playerdata",
            x: player.pos.x,
            y: player.pos.y,
            dx: player.vel.x,
            isCtrl: player.spiritState < 1,
            spiritSize: player.spiritSize,
            sideLength: player.sideLength,
        })
    );

    pT = cT;
    requestAnimationFrame(animate);
});
