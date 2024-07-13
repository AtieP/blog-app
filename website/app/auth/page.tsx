"use client"

import Cookies, { CookieAttributes } from "js-cookie"
import { useEffect } from "react"
import jwt from "jsonwebtoken"

export default function Auth() {
    useEffect(() => {
        // for some reason, Cognito passes the implicit grant as a hash
        // and not as normal query parameters. because of this, i had
        // to use client components and install a separate library for cookies.
        // but hey, at least, this all works
        const params = new URLSearchParams(window.location.hash.substring(1))
        const expiration = Number(params.get("expires_in"))
        const cookieParams: CookieAttributes = { expires: expiration / (1/3600) * (1/24), sameSite: "strict", path: "/" }
        const accessToken = params.get("access_token")
        Cookies.set("accessToken", accessToken, cookieParams)
        const payload = jwt.decode(accessToken, { complete: true, json: true }).payload
        Cookies.set("username", ( payload as object & { username: string } ).username, cookieParams)
        window.location.replace("/")
    })

    return <></>
}