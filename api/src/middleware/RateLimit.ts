import { NextFunction, Request, Response } from "express"
import { rateLimit } from "express-rate-limit"
import config from "../config"
import { GenericRequest } from "../interfaces/Request"



function timestringToMs(time: string) {
    const regex = /((?<m>\d+)m)?((?<s>\d+)s)?/
    const match = time.match(regex).groups as { m: string, s: string }
    return ((Number(match.m) || 0) * 60 + (Number(match.s) || 0)) * 1000
}



export default function RateLimit(window: string, limit: number) {
    if (!config.API.rateLimit) {
        return ( req: GenericRequest, res: Response, next: NextFunction ) => {
            req.rateLimit = { limit: Infinity, remaining: Infinity, used: 0 }
            return next()
        }
    }

    return rateLimit({
        windowMs: timestringToMs(window),
        limit: limit,

        // to avoid a user from spamming requests from multiple devices
        keyGenerator: (req: Request, res: Response) => res.locals.username || req.ip,

        // since it would be interesting not to rate limit on cache hits, but to rate limit
        // cache misses, let the handler for rate limits be nothing and make the controllers
        // handle rate limits by themselves by accessing req.rateLimit.limit, req.rateLimit.used and req.rateLimit.remaining
        // this way, this function is only used to track the amount of requests done
        // in a time interval
        handler: ( req: Request, res: Response, next: NextFunction ) => { return next() },

        legacyHeaders: false,
        standardHeaders: false
    })
}
