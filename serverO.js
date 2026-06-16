import { serveDir } from "jsr:@std/http/file-server";

Deno.serve({}, (req) => serveDir(req, { fsRoot: "./web/" }));

// // Multiplayer demo and testing area
// const multiDemo = {
//     clients: [],
// };

// Deno.serve((req) => {
//     if (req.headers.get("upgrade") == "websocket") {
//         let { socket, response } = Deno.upgradeWebSocket(req);

//         // called when the websocket connection is started
//         socket.onopen = (e) => {
//             console.log("a client connected");
//             multiDemo.clients.push(socket);
//             // ... optionally set anything up for the connection
//         };

//         // called when the server receives a message from the client
//         socket.onmessage = (e) => {
//             console.log("data received", e.data);

//             // data = JSON.parse(e.data);

//             for (const client of multiDemo.clients) {
//                 if (client !== socket && client.readyState === 1) {
//                     client.send(e.data);
//                 }
//             }
//         };

//         return response;
//     }

//     // or deal with all 'normal' requests by eg serving a file such as index.html
//     return serveDir(req, { fsRoot: "." }); // could change fsRoot to a subfolder
// });
