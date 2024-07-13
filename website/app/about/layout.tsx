import React from "react";
import { Metadata } from "next"


export const metadata: Metadata = {
    title: "About"
}


export default function AboutLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    )
}