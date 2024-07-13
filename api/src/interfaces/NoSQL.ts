
import User from "../models/User"
import PostAttributes from "../models/PostAttributes"
import Comment from "../models/Comment"

export default interface NoSQL {
    Init(): Promise<void>
    QueryUserByName(username: string): Promise<User>
    QueryPostAttributesById(postId: string): Promise<PostAttributes>
    QueryUserPosts(username: string): Promise<PostAttributes[]>
    UpdateUser(username: string, user: Partial<User>): Promise<void>

    // The username argument is used for access control.
    CreatePostAttributes(post: PostAttributes): Promise<void>
    UpdatePostAttributes(username: string, post: Partial<PostAttributes>): Promise<void>
    DeletePostAttributes(username: string, postId: string): Promise<void>
    QueryPostComments(postId: string, offset: number, limit: number): Promise<Comment[]>

    CreateComment(comment: Comment): Promise<void>
    DeleteComment(username: string, postId: string, commentId: string): Promise<void>
}