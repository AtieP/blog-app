"use client"


import Popup from "@components/Popup"
import Cookies from "js-cookie"
import { FormEvent, useState } from "react"
import { createPortal } from "react-dom"


export default function DeleteCommentButton({ postId }: { postId: string }) {
    const [ showDeleteModal, setShowDeleteModal ] = useState(false)
    const [ errorMsg, setErrorMsg ] = useState("")

    function showModal() {
        setShowDeleteModal(true)
    }

    function hideModal() {
        setShowDeleteModal(false)
    }

    function deletePost(event: FormEvent) {
        event.stopPropagation()
        event.preventDefault()

        hideModal()
        document.body.classList.add("cursor-wait")

        const req = new XMLHttpRequest()
        req.addEventListener("load", () => {
            document.body.classList.remove("cursor-wait")
            console.log(req)
            if (req.status !== 200) {
                let errorMsg
                try {
                    errorMsg = JSON.parse(req.responseText).error
                } catch (e) {
                    errorMsg = ""
                }

                setErrorMsg(`(${req.status}) ${errorMsg}`)
            } else {
                window.location.href = "/"
            }
        })
        req.open("DELETE", process.env.NEXT_PUBLIC_API_URL + `/v1/post/${postId}`)
        req.setRequestHeader("Authorization", "Bearer " + Cookies.get("accessToken"))
        req.send()
    }

    return ( <>
        <button className="m-2 p-4 cursor-pointer text-xl text-left hover:bg-slate-100 text-red-500" onClick={showModal}>Delete</button>
        { showDeleteModal ? 
            <>
            <div className="z-2 fixed top-0 left-0 h-screen w-screen bg-gray-600/30 blur-sm"></div>
                <div className="z-3 w-1/2 h-fit bg-slate-300 fixed mx-auto top-1/4 rounded-xl border border-black p-4">
                    <h1 className="text-3xl">Update post</h1>
                    <form className="flex-col flex" onSubmit={deletePost}>
                        <h1>Delete post?</h1>
                        <div className="flex flex-row justify-end gap-4">
                            <button className="bg-slate-500 hover:bg-slate-400 p-2 rounded-xl" onClick={hideModal}>Cancel</button>
                            <button className="bg-red-400 hover:bg-red-300 p-2 rounded-xl" type="submit">Delete</button>
                        </div>
                    </form>
                </div>
            </>
            : <></>
        }
        { errorMsg ?
            createPortal(
                <Popup msg={`Error when deleting the post: ${errorMsg}`} color="red"/>, document.body
            )
            : <></>
        }
        </>
    )
}