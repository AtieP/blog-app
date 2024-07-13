import { NextFunction, Request, Response } from "express";
import Cognito from "../providers/AWS/Cognito";


export default async function Auth(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        return res
            .status(401)
            .setHeader("WWW-Authenticate", "Bearer")
            .json({ error: "credentials required" })
    }

    const authHeader = req.headers.authorization.split(" ")
    if (authHeader[0] !== "Bearer") {
        return res
            .status(400)
            .setHeader("WWW-Authenticate", "Bearer error=\"invalid_request\" error_description=\"The token type is not valid\"")
            .json({ error: "The token type is not valid" })
    }

    const jwt = authHeader[1]
    const username = await Cognito.VerifyAccessToken({ accessToken: jwt })
    if (username === null) {
        return res
            .status(401)
            .setHeader("WWW-Authenticate", "Bearer error=\"invalid_token\" error_description=\"Invalid access token\"")
            .send({ error: "Invalid access token" })
    }
    res.locals.username = username
    return next()
}
