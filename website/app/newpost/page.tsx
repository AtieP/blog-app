"use client"

import Cookies from "js-cookie";
import { FormEvent, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Popup from "@components/Popup";
import { createPortal } from "react-dom"


export default function NewPost() {
    useEffect(() => {
        if (!Cookies.get("accessToken")) {
            redirect(process.env.NEXT_PUBLIC_AUTH_HOSTED_UI)
        }
    })

    const [ error, setError ] = useState("")

    function handleSubmit(event: FormEvent) {
        event.preventDefault()
        event.stopPropagation()

        const evt = event as FormEvent & { target: { elements: any } }

        const title = evt.target.elements.title.value
        const caption = evt.target.elements.caption.value
        const captionImage = evt.target.elements.captionImage.value
        const content = evt.target.elements.content.value
        const button = evt.target.elements.submit

        // disable button and set cursor to loading, to avoid the user
        // from spamming the upload button
        button.disabled = true
        button.classList.add("disabled:bg-gray-500")
        document.body.classList.add("cursor-wait")

        console.log(process.env.NEXT_PUBLIC_API_URL)

        const req = new XMLHttpRequest()
        req.addEventListener("load", () => {
            let response
            try {
                response = JSON.parse(req.responseText)
            } catch (SyntaxError) {
                response = {}
            }
            if (req.status !== 201) {
                button.disabled = false
                button.classList.remove("disabled:bg-gray-500")
                document.body.classList.remove("cursor-wait")

                setError(`(${req.status}) ${response.error}`)
            } else {
                const location = (JSON.parse(req.responseText).location as string).replace("/api/v1/post/", "")
                console.log(location)
                window.location.href = "/post/" + location
            }
        })
        req.open("POST", process.env.NEXT_PUBLIC_API_URL + "/v1/post")
        req.setRequestHeader("Content-Type", "application/json")
        req.setRequestHeader("Authorization", "Bearer " + Cookies.get("accessToken"))
        req.send(JSON.stringify({
            title: title,
            caption: caption,
            captionImage: captionImage,
            content: content
        }))
    }

    return (
        <div className="max-w-1/2 w-1/2 mx-auto">
            <h1 className="text-6xl my-4">Create new post</h1>
            <hr className="border-black my-4"/>
            <form onSubmit={handleSubmit} className="flex flex-col">
                <label>Title</label>
                <input className="border border-black rounded mb-4" name="title" type="text" required maxLength={100}/>
                <label>Caption</label>
                <textarea className="border border-black rounded mb-4" name="caption" required maxLength={200}/>
                <label>Caption image</label>
                <input className="border border-black rounded mb-4" name="captionImage" type="text" required maxLength={256}/>
                <label>Content</label>
                <textarea className="border border-black rounded mb-4" name="content" required maxLength={200000}/>
                <button name="submit" className="bg-classy-3 hover:bg-classy-4 rounded max-w-fit mx-auto px-4 py-2 my-4">Submit</button>
            </form>

            { error ? createPortal(
                <Popup color="red" msg={`An unexpected error occurred: ${error}`}/>, document.body
            ) : "" }
        </div>
    )
}