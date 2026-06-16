const canvas = document.getElementById("canvas");

width = 1000;
height = 50;

canvas.width = width;
canvas.height = height;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;

const ctx = canvas.getContext("2d");

// const text = "singleplayer";
const text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toLowerCase();
const textColour = "#000000";

const letters = {
    a: ["###", "# #", "###", "# #", "# #"],
    b: ["###", "# #", "## ", "# #", "###"],
    c: ["###", "#  ", "#  ", "#  ", "###"],
    d: ["## ", "# #", "# #", "# #", "## "],
    e: ["###", "#  ", "## ", "#  ", "###"],
    f: ["###", "#  ", "###", "#  ", "#  "],
    g: ["###", "#  ", "# #", "# #", "###"],
    h: ["# #", "# #", "###", "# #", "# #"],
    i: ["###", " # ", " # ", " # ", "###"],
    j: ["###", " # ", " # ", "## ", "## "],
    k: ["# #", "# #", "## ", "# #", "# #"],
    l: ["#  ", "#  ", "#  ", "#  ", "###"],
    m: ["#   #", "## ##", "# # #", "#   #", "#   #"],
    n: ["#  #", "## #", "# ##", "#  #", "#  #"],
    o: ["###", "# #", "# #", "# #", "###"],
    p: ["###", "# #", "###", "#  ", "#  "],
    q: [" ## ", "#  #", "#  #", "# # ", " # #"],
    r: ["###", "# #", "## ", "# #", "# #"],
    s: ["###", "#  ", "###", "  #", "###"],
    t: ["###", " # ", " # ", " # ", " # "],
    u: ["# #", "# #", "# #", "# #", "###"],
    v: ["# #", "# #", "# #", "###", " # "],
    w: ["#   #", "#   #", "# # #", "# # #", " # # "],
    x: ["# #", "# #", " # ", "# #", "# #"],
    y: ["# #", "# #", " # ", " # ", " # "],
    z: ["###", "  #", " # ", "#  ", "###"],
    " ": [" ", " ", " ", " ", " ", " "],
    ".": ["  ", "  ", "  ", "  ", "# "],
};

function getTextLength(height, text) {
    let textLength = 0;

    for (const char of text) {
        textLength += letters[char][0].length + 1;
    }

    return (height * (textLength - 1)) / 5;
}

function drawText(ctx, height, text, colour) {
    const block = height / 5;

    ctx.fillStyle = colour;

    let letterXOffset = 0;

    for (const char of text) {
        const letter = letters[char];

        for (let row = 0; row < 5; row++) {
            for (let pixel = 0; pixel < letter[row].length; pixel++) {
                if (letter[row][pixel] === "#") {
                    ctx.fillRect(block * (letterXOffset + pixel), block * row, block, block);
                }
            }
        }

        letterXOffset += letter[0].length + 1;
    }
}

width = getTextLength(height, text);

canvas.width = width;
canvas.style.width = `${width}px`;

drawText(ctx, height, text, textColour);

console.log(canvas.toDataURL());
