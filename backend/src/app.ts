import express from "express";
import cors from "cors";
import { createChatRoutes } from "./routes/chatRoutes.js";
import { createHealthRoutes } from "./routes/healthRoutes.js";
import type { GlobalState } from "./types/index.js";

export function createApp(state: GlobalState): express.Application {
    const app = express();

    // Middlewares
    app.use(
        cors({
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    );
    app.use(express.json());
    app.options("*", cors());

    // Routes
    app.use(createChatRoutes(state));
    app.use(createHealthRoutes(state));

    return app;
}
