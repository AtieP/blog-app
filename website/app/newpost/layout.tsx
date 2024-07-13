import React from "react";
import { Metadata } from "next"


export const metadata: Metadata = {
    title: "New post"
}


export default function NewPostLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    )
}