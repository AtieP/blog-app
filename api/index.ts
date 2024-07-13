import config from "./src/config"
import ApiRoute from "./src/routes/Api"
import DynamoDB from "./src/providers/AWS/DynamoDB"
import log from "./src/log"
import express, { ErrorRequestHandler, NextFunction } from "express"
import Cognito from "./src/providers/AWS/Cognito"
import S3 from "./src/providers/AWS/S3"


(async () => {
    await DynamoDB.Init()
    await Cognito.Init()
    await S3.Init()
    
    const app = express()
    app.set("trust proxy", 1)
    ApiRoute.mount(app)

    const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
        log.error(err)
        return res.status(500).json({ error: "Internal server error" })
    }
    app.use(errorHandler)
    
    app.listen(config.API.PORT, config.API.IP, () => {
        log.info(`Listening on ${config.API.IP}:${config.API.PORT}`)
    })
})()
