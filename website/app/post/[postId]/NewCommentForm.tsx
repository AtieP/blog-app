
"use client"


import Cookies from "js-cookie"
import ButtonToggle from "@components/ButtonToggle"
import { FormEvent, useState } from "react"
import { createPortal } from "react-dom"
import Popup from "@components/Popup"


enum NewCommentState {
    NOT_CREATED, CREATED, ERROR
}


export default function NewCommentForm({ postId }: { postId: string }) {

    const [ newCommentState, setNewCommentState ] = useState(NewCommentState.NOT_CREATED)
    const [ errorMsg, setErrorMsg ] = useState("")

    function postNewComment(event: FormEvent) {
        event.preventDefault()
        event.stopPropagation()

        const target = event.target as any
        const button = target.elements.submit
    
        document.body.classList.add("cursor-wait")
        button.disabled = true
        button.classList.add("disabled:bg-gray-500")

        const content = target.elements.content.value
        const req = new XMLHttpRequest()
        req.addEventListener("load", () => {
            document.body.classList.remove("cursor-wait")
            button.disabled = false
            button.classList.remove("disabled:bg-gray-500")

            if (req.status !== 201) {
                let errorMsg
                try {
                    errorMsg = JSON.parse(req.responseText).error
                } catch (e) {
                    errorMsg = ""
                }

                setNewCommentState(NewCommentState.ERROR)
                setErrorMsg(`(${req.status}) ${errorMsg}`)
            } else {
                setNewCommentState(NewCommentState.CREATED)
                window.location.href = `/post/${postId}`
            }
        })
        req.open("POST", process.env.NEXT_PUBLIC_API_URL + `/v1/post/${postId}/comment`)
        req.setRequestHeader("Authorization", "Bearer " + Cookies.get("accessToken"))
        req.setRequestHeader("Content-Type", "application/json")
        req.send(JSON.stringify({ content: content }))
    }

    return <>
        <ButtonToggle buttonText="New comment" buttonClass="border bg-gray-400 hover:bg-gray-300 max-w-fit px-4 py-2 rounded hover:shadow">
        <form className="flex flex-col" onSubmit={postNewComment}>
            <textarea name="content" className="border border-black rounded my-4" required maxLength={1000}></textarea>
            <button name="submit" type="submit" className="border bg-gray-300 hover:bg-gray-200 hover:shadow max-w-fit px-4 py-2 rounded">Submit</button>
        </form>
        </ButtonToggle>
        { newCommentState !== NewCommentState.NOT_CREATED
            ? createPortal(
                <Popup
                    msg={newCommentState === NewCommentState.CREATED ? "Comment created! Please reload the page." : `Error when creating the comment: ${errorMsg}`}
                    color={newCommentState === NewCommentState.CREATED ? "green" : "red"}
                />, document.body
            )
            : <></> 
        }
    </>
}