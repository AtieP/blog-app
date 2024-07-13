"use client"

import { useState } from "react"


export default function ButtonToggle({
    children, buttonText, buttonClass
}: { 
    children?: React.ReactNode, buttonText: string, buttonClass?: string
}) {
    const [ show, setShow ] = useState(false)

    return (
        <>
            <button onClick={() => setShow(!show)} className={buttonClass}>{ buttonText } </button>
            { show ? children : "" }
        </>
    )
}
