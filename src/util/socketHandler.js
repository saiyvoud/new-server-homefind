export function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("A user connected");
  
    /// Join a room based on the provided room ID
    socket.on('joinOrderRoom', (orderId) => {
      socket.join(orderId);
      console.log(`user join order: ${orderId}`);
  
      // Handle messages within the room
      socket.on('statusChanged', (data) => {
        // Broadcast the message to all clients in the same room
        io.to(orderId).emit('broadcast', `status changed orderId ${orderId}: ${data}`);
      });
    });
  
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });
}