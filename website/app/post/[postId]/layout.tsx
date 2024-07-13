import React from "react";


export function generateMetadata(
    { params }: { params: { postId: string } } 
) {
    return {
        title: params.postId
    }
}


export default function PostLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
        </>
    )
}