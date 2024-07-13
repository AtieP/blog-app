import React from "react";


export function generateMetadata(
    { params }: { params: { username: string } } 
) {
    return {
        title: params.username
    }
}


export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    )
}