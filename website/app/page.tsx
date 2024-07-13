"use server"

import { cookies } from "next/headers"

export default async function Root() {

    const usernameCookie = cookies().get("username")

    return (
        <div className="max-w-[75%] mx-auto">
            <h1 className="text-6xl">{usernameCookie ? `Welcome back, ${usernameCookie.value}!` : "Welcome to this site!"}</h1>
        </div>
    )
}