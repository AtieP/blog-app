/**
 * @type {import("next").NextConfig}
 */
module.exports = {
    headers: () => [
        // let the server cache everything
        {
            source: "/user/:username",
            headers: [
                {
                    key: "Cache-Control",
                    value: "no-store"
                }
            ]
        },
        {
            source: "/post/:postId",
            headers: [
                {
                    key: "Cache-Control",
                    value: "no-store"
                }
            ]
        }
    ]
}