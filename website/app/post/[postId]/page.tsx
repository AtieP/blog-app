import Post from "@models/PostAttributes"
import Comment from "@models/Comment"
import { notFound } from "next/navigation"
import ButtonToggle from "@components/ButtonToggle"
import { cookies } from "next/headers"
import DeleteCommentButton from "./DeleteCommentButton"
import NewCommentForm from "./NewCommentForm"
import UpdatePostButtonModal from "./UpdatePostButtonModal"
import DeletePostButton from "./DeletePostButton"


export default async function PostPage({ params }: { params: { postId: string } }) {
    const postId = params.postId
    const postResponse = await fetch(
        `${process.env.SERVER_API_URL}/v1/post/${postId}`,
        {
            next: {
                revalidate: 10
            }
        }
    )
    if (postResponse.status === 404) {
        return notFound()
    } else if (postResponse.status !== 200) {
        return <h1>Something wrong happened when retrieving the post. {postResponse.status}</h1>
    }

    const post: Post & { content: string } = await postResponse.json()
    post.creationDate = new Date(post.creationDate)

    const commentsResponse = await fetch(
        `${process.env.SERVER_API_URL}/v1/post/${postId}/comment`,
        {
            next: {
                revalidate: 10
            }
        }
    )
    if (commentsResponse.status === 404) {
        return notFound()
    } else if (postResponse.status !== 200) {
        return <h1>Something wrong happened when retrieving the comments. {commentsResponse.status}</h1>
    }

    const username = cookies().get("username")?.value
    const comments = ((await commentsResponse.json()).comments as Comment[]).map(comment =>
        <div key={comment.commentId} className="relative w-full border-black border rounded-xl p-4 my-4 hover:bg-yellow-100">
            { comment.username === username ? <DeleteCommentButton buttonClass="absolute cursor-pointer right-4 top-4 text-red-500 select-none" buttonText="&#10005;" postId={postId} commentId={comment.commentId} /> : ""}
            <h1 className="text-xl text-blue-950"><a href={`/user/${comment.username}`}>@{comment.username}</a></h1>
            <h1>{new Date(comment.creationDate).toUTCString()}</h1>
            <p className="text-lg">{comment.content.split("\n").map(paragraph => <>{paragraph}<br/></>)}</p>
        </div>
    )
    
    return (
        <div className="mx-auto w-1/2 max-w-1/2 flex flex-col">
            <h1 className="text-7xl">{post.title}</h1>
            <h2 className="text-xl text-blue-950">- by <a href={`/user/${post.username}`}>@{post.username}</a></h2>
            <h2 className="text-xl my-4">{post.creationDate.toUTCString()}</h2>
            {
                post.username === cookies().get("username")?.value ?
                <ButtonToggle buttonText="Options" buttonClass="border bg-gray-400 max-w-fit px-4 py-2 rounded hover:shadow-xl hover:bg-gray-300">
                    <div className="z-1 min-w-[300px] max-w-fit bg-slate-200 my-4 rounded shadow flex flex-col">
                        <UpdatePostButtonModal postId={postId}/>
                        <DeletePostButton postId={postId}/>
                    </div>
                </ButtonToggle> : <></>
            }
            <hr className="border-black my-8 w-full"/>
            <img src={post.captionImage} className="my-8" alt={post.caption} width={1000} height={1000}/>
            <h3 className="text-2xl italic mb-8">{post.caption}</h3>
            <p className="text-lg">{post.content.split("\n").map(paragraph => (<>{paragraph}<br/></>) )}</p>

            <hr className="border-black my-8 w-full"/>
            <h2 className="text-2xl">{comments.length} comment{comments.length !== 1 ? "s" : ""}</h2>
            { cookies().get("username")?.value ?
                <NewCommentForm postId={postId}/>
            : <></> }
            <div className="flex flex-col">
                {comments}
            </div>
        </div>
    )
}
