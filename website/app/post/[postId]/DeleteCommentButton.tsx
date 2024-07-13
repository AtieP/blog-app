"use client"

import Cookies from "js-cookie"
import { useState } from "react"
import { createPortal } from "react-dom"
import Popup from "@components/Popup"


enum CommentState {
    EXISTS, DELETED, DELETION_ERROR
}


export default function DeleteCommentButton({
    buttonClass, buttonText, postId, commentId
}: { buttonClass: string, buttonText: string, postId: string, commentId: string }) {

    const [ commentState, setCommentState ] = useState(CommentState.EXISTS)
    const [ errorMsg, setErrorMsg ] = useState("")

    function deleteComment(evt) {
        evt.preventDefault()
        evt.stopPropagation()

        evt.target.disable = true
        document.body.classList.add("cursor-wait")

        const req = new XMLHttpRequest()
        req.addEventListener("load", () => {
            document.body.classList.remove("cursor-wait")

            if (req.status === 200) {
                setCommentState(CommentState.DELETED)
            } else {
                let errorMsg
                try {
                    console.log(JSON.parse(req.responseText))
                    errorMsg = JSON.parse(req.responseText).error
                } catch (e) {
                    errorMsg = ""
                }
                setErrorMsg(`(${req.status}) ${errorMsg}`)
                setCommentState(CommentState.DELETION_ERROR)
            }
        })
        req.open("DELETE", process.env.NEXT_PUBLIC_API_URL + `/v1/post/${postId}/comment/${commentId}`)
        req.setRequestHeader("Authorization", "Bearer " + Cookies.get("accessToken"))
        req.send()
    }

    return (
        <>
            <button onClick={deleteComment} className={buttonClass}>{buttonText}</button>
            { commentState !== CommentState.EXISTS
            ? createPortal(
                commentState === CommentState.DELETED ?
                    <Popup msg="Comment deleted successfully" color="green"/>
                    :
                    <Popup msg={`Error when deleting the comment: ${errorMsg}. Please try again later.`} color="red"/>
                , document.body)
            : <></>}
        </>
    )
}