import bunyan from "bunyan"

export default bunyan.createLogger({
    name: "blog-api",
    src: true,
    streams: [
        {
            level: "info",
            stream: process.stdout
        }
    ]
})
