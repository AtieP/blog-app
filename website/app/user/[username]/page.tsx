import Post from "@models/PostAttributes"
import User from "@models/User"
import { notFound } from "next/navigation"
import UpdateUserButtonModal from "./UpdateUserButtonModal"

export default async function UserPage({ params }: { params: { username: string } }) {
    const response = await fetch(
        `${process.env.SERVER_API_URL}/v1/user/${params.username}`,
        {
            next: {
                revalidate: 10
            }
        }
    )
    if (response.status === 404) {
        return notFound()
    } else if (response.status !== 200) {
        return <h1>Something wrong happened.</h1>
    }

    const user = await response.json() as (User & { posts: Post[] })
    user.creationDate = new Date(user.creationDate)
    const posts = user.posts.map(p => {
        p.creationDate = new Date(p.creationDate)
        return (
            <div className="w-full rounded-xl border border-gray-800 m-4 p-4 hover:bg-gradient-to-r from-indigo-500 to-emerald-700 transition-colors delay-500" key={p.postId}>
                <a href={`/post/${p.postId}`}>
                    <h1 className="font-bold text-3xl">{p.title}</h1>
                    <h1 className="text-xl">{p.caption}</h1>
                    <h1 className="text-lg italic text-gray-500">{p.creationDate.toUTCString()}</h1>
                </a>
            </div>
        )
    })

    return (
        <div className="mx-auto max-w-1/2 w-1/2">
            <div className="clear-both grid grid-cols-2">
                <img className="rounded-[50%]" src={user.profilePicture} alt={user.username} width={250} height={250}/>
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl">{user.username}</h1>
                    <h1 className="text-4xl">{user.fullName}</h1>
                    <h2 className="text-2xl italic">Joined on {user.creationDate.toUTCString()}</h2>
                    <UpdateUserButtonModal username={user.username} />
                </div>
            </div>

            <p className="my-4 text-lg">{user.bio}</p>

            <hr className="border-black"/>

            <h1 className="text-3xl font-bold my-4">Posts ({posts.length})</h1>
            <div className="flex flex-col">
                {posts}
            </div>
        </div>
    )
}