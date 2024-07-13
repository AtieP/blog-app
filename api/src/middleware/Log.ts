import { NextFunction, Request, Response } from "express";
import log from "../log";



export default async function Log(req: Request, res: Response, next: NextFunction) {
    log.info(`[${req.ip}] ${req.method} ${req.originalUrl}`)
    return next()
}