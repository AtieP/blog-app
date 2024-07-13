
import express, { Application, Request, Response, NextFunction } from "express"


import AuthController from "../controllers/Auth"
import CommentController from "../controllers/Comment"
import PostController from  "../controllers/Post"
import UserController from "../controllers/User"
import Auth from "../middleware/Auth"
import config from "../config"
import Log from "../middleware/Log"
import cors from "cors"
import RateLimit from "../middleware/RateLimit"


class ApiRoute {
    public static mount(app: Application) {
        if (config.API.corsOrigin) {
            app.use(cors({ origin: config.API.corsOrigin }))
        }

        app.use(Log)

        app.get("/api/v1/user/:username", RateLimit("5s", 1), UserController.get)
        app.delete("/api/v1/user/:username", RateLimit("10s", 1), Auth, UserController.delete)
        app.put("/api/v1/user/:username", RateLimit("10s", 1), Auth, express.json({ limit: "1kb" }), UserController.update)

        app.get("/api/v1/post/:postId", RateLimit("5s", 1), PostController.get)
        app.post("/api/v1/post", RateLimit("1m", 1), express.json({ limit: "3mb" }), Auth, PostController.create)
        app.delete("/api/v1/post/:postId", RateLimit("10s", 1), Auth, PostController.delete)
        app.put("/api/v1/post/:postId", RateLimit("1m", 1), Auth, express.json({ limit: "1kb" }), PostController.update)

        app.get("/api/v1/post/:postId/comment", RateLimit("10s", 1), PostController.listComments)
        app.post("/api/v1/post/:postId/comment", RateLimit("1m", 1), Auth, express.json({ limit: "2kb" }), CommentController.create)
        app.delete("/api/v1/post/:postId/comment/:commentId", RateLimit("10s", 1), Auth, CommentController.delete)
    }
}


export default ApiRoute
