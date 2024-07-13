"use client"


import Popup from "@components/Popup"
import User from "@models/User"
import Cookies from "js-cookie"
import { FormEvent, useState } from "react"
import { createPortal } from "react-dom"


export default function UpdateUserButtonModal({ username }: { username: string }) {

    const [ showModal, setShowModal ] = useState(false)
    const [ errorMsg, setErrorMsg ] = useState("")

    function displayModal() {
        setShowModal(true)
    }

    function hideModal() {
        setShowModal(false)
    }

    function updateUser(e: FormEvent) {
        e.stopPropagation()
        e.preventDefault()

        const elements = (e.target as any).elements
        document.body.classList.add("cursor-wait")
        hideModal()

        const req = new XMLHttpRequest()
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
                window.location.href = `/user/${username}`
            }
        })
        req.open("PUT", process.env.NEXT_PUBLIC_API_URL + `/v1/user/${username}`)
        req.setRequestHeader("Content-Type", "application/json")
        req.setRequestHeader("Authorization", "Bearer " + Cookies.get("accessToken"))
        
        const payload: Partial<User> = {}
        if (elements.fullName.value) {
            payload.fullName = elements.fullName.value
        }
        if (elements.profilePicture.value) {
            payload.profilePicture = elements.profilePicture.value
        }
        if (elements.bio.value) {
            payload.bio = elements.bio.value
        }

        req.send(JSON.stringify(payload))
    }

    return (
        <>
            <button onClick={displayModal} className="border bg-gray-400 max-w-fit px-4 py-2 rounded hover:shadow-xl hover:bg-gray-300">Update</button>
            { showModal ? <>
            <div className="z-1 bg-gray-600/30 fixed top-0 left-0 w-screen h-screen"/>
            <div className="z-2 w-1/2 h-fit bg-slate-300 fixed mx-auto top-1/4 rounded-xl border border-black p-4">
                <h1 className="text-3xl">Update post</h1>
                <form className="flex-col flex" onSubmit={updateUser}>
                    <label>Full name</label>
                    <input className="border border-black rounded mb-4" type="text" name="fullName" maxLength={50}></input>
                    <label>Profile picture</label>
                    <input className="border border-black rounded mb-4" type="text" name="profilePicture" maxLength={256}></input>
                    <label>Bio</label>
                    <textarea className="border border-black rounded mb-4" name="bio" maxLength={200}></textarea>
                    <div className="flex flex-row justify-end gap-4">
                        <button className="bg-red-400 hover:bg-red-300 p-2 rounded-xl" onClick={hideModal}>Cancel</button>
                        <button className="bg-slate-500 hover:bg-slate-400 p-2 rounded-xl" type="submit">Update</button>
                    </div>
                </form>
            </div></>
            : <></>}
            { errorMsg ? createPortal(
                <Popup color="red" msg={`Error updating the user: ${errorMsg}`} />
                , document.body) : <></> }
        </>
    )
}