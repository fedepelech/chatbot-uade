import { Router, Request, Response } from "express";
import type { GlobalState } from "../types/index.js";

export function createHealthRoutes(state: GlobalState): Router {
    const router = Router();

    router.get("/health", (req: Request, res: Response) => {
        res.json({ 
            status: "ok",
            rag: state.ragChain !== null,
            mcp_tools: state.tools.length
        });
    });

    return router;
}
