import { WebSocketServer } from "ws";
import { client } from "@repo/db/client";

const server = new WebSocketServer({
  port: 3002,
});

server.on("connection", async (socket) => {
  await client.user.create({
    data: {
      username: `user-${Math.floor(Math.random() * 1000).toString()}`,
      password: `pass-${Math.floor(Math.random() * 1000).toString()}`,
    },
  });
  console.log("User created");

  socket.send("hello");
});
