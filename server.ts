import express, { Express, Response, Request } from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import appointmentRoute from "./routes/appointment";

dotenv.config();

// Initialize express app
const app: Express = express();
const server = http.createServer(app);

// Enable CORS for the Express API
const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    if ( origin === process.env.FRONTEND_URL) {
      // Allow the request if the origin is allowed or if the request is from the same origin
      callback(null, true);
    } else {
      // Reject the request if the origin is not allowed
      callback("You're not allowed to access this site", false);
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT"], // Limit the allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true, // Whether or not to allow credentials (cookies, etc)
};

app.use(express.json());
app.use(cors(corsOptions));


// Test route
app.get("/", (req: Request, res: Response) => {
  res.json({
    msg: "DONE",
  });
});

// Registering the appointment routes
app.use("/appointments", appointmentRoute);

// Initialize Socket.IO with CORS settings for real-time communication
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Frontend URL (Next.js)
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Handle incoming socket connections
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (msg: string) => {
    console.log("Received message:", msg);
    io.emit("chat message", msg); // Broadcast message to all clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start the Express server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// Export the io instance so it can be used in routes
export { io };
