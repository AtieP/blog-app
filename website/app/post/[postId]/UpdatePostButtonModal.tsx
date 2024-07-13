"use client"


import Popup from "@components/Popup"
import Cookies from "js-cookie"
import { FormEvent, useState } from "react"
import { createPortal } from "react-dom"


export default function UpdatePostButtonModal({ postId }: { postId: string }) {
    const [ showModal, setShowModal ] = useState(false)
    const [ errorMsg, setErrorMsg ] = useState("")

    function displayModal() {
        setShowModal(true)
    }

    function hideModal() {
        setShowModal(false)
    }

    function updatePost(evt: FormEvent) {
        evt.stopPropagation()
        evt.preventDefault()

        const target = evt.target as any
        hideModal()
        document.body.classList.add("cursor-wait")

        const req = new XMLHttpRequest()
        req.open("PUT", process.env.NEXT_PUBLIC_API_URL + `/v1/post/${postId}`)
        req.addEventListener("load", () => {
            document.body.classList.remove("cursor-wait")
            if (req.status !== 200) {
                let errorMsg
                try {
                    errorMsg = JSON.parse(req.responseText).error
                } catch (e) {
                    errorMsg = ""
                }

                setErrorMsg(`(${req.status}) ${errorMsg}`)
            } else {
                window.location.href = `/post/${postId}`
            }
        })
        req.setRequestHeader("Content-Type", "application/json")
        req.setRequestHeader("Authorization", "Bearer " + Cookies.get("accessToken"))
        
        const payload: any = {}
        const title = target.elements.title.value
        const caption = target.elements.caption.value
        const captionImage = target.elements.captionImage.value
        if (title) {
            payload.title = title
        }
        if (caption) {
            payload.caption = caption
        }
        if (captionImage) {
            payload.captionImage = captionImage
        }

        req.send(JSON.stringify(payload))
    }

    return (
        <>
            <button onClick={displayModal} className="m-2 p-4 cursor-pointer text-xl text-left hover:bg-slate-100">Update</button>
            {
                showModal ?
                <>
                    <div className="z-2 fixed top-0 left-0 h-screen w-screen bg-gray-600/30 blur-sm"></div>
                    <div className="z-3 w-1/2 h-fit bg-slate-300 fixed mx-auto top-1/4 rounded-xl border border-black p-4">
                        <h1 className="text-3xl">Update post</h1>
                        <form className="flex-col flex" onSubmit={updatePost}>
                            <label>Title</label>
                            <input className="border border-black rounded mb-4" type="text" name="title" maxLength={100}></input>
                            <label>Caption</label>
                            <textarea className="border border-black rounded mb-4" name="caption" maxLength={200}></textarea>
                            <label>Caption image</label>
                            <input className="border border-black rounded mb-4" type="text" name="captionImage" maxLength={256}></input>
                            <div className="flex flex-row justify-end gap-4">
                                <button className="bg-red-400 hover:bg-red-300 p-2 rounded-xl" onClick={hideModal}>Cancel</button>
                                <button className="bg-slate-500 hover:bg-slate-400 p-2 rounded-xl" type="submit">Update</button>
                            </div>
                        </form>
                    </div>
                </>
                : <></>
            }
            { errorMsg ? createPortal(
                <Popup color="red" msg={`Error updating the post: ${errorMsg}`} />
                , document.body) : <></> }
        </>
    )
}