"use client"

import { useEffect, useState } from "react"

export default function Popup({msg, color}: {msg: string, color: string}) {
    return (
        <div className={`fixed right-10 top-10 bg-${color}-600 w-fit h-fit z-1 rounded-3xl shadow-2xl`}>
            <p className="m-2 text-white text-lg">{msg}</p>
        </div>
    )
}
