import User from "../models/User"
import PostAttributes from "../models/PostAttributes"
import Comment from "../models/Comment"

export default interface Cache {

    // A undefined returned on Get* means that the object is not present in the cache.
    // A null returned on Get* means that the object is on the cache but marked
    // as deleted or inexistent.
    // The reasoning for this is to avoid useless calls into the database.

    GetUser(username: string): Promise<User | undefined | null>
    SetUser(user: User): Promise<void>
    UpdateUser(username: string, newUser: Partial<User>): Promise<void>
    RemoveUser(username: string): Promise<void>

    GetPost(postId: string): Promise<PostAttributes & { content: string } | undefined | null>
    SetPost(post: PostAttributes & { content: string }): Promise<void>
    UpdatePost(postId: string, newPost: Partial<PostAttributes & { content: string }>): Promise<void>
    RemovePost(postId: string): Promise<void>

    QueryUserPosts(username: string): Promise<PostAttributes[]>
    AddUserPosts(username: string, posts: PostAttributes[]): Promise<void>
    RemoveUserPosts(username: string, posts: string[]): Promise<void>

    AddPostComments(postId: string, comments: Comment[]): Promise<void>
    GetPostComments(postId: string): Promise<Comment[]>
    RemovePostComment(postId: string, commentId: string): Promise<void>
    RemovePostComments(postId: string): Promise<void>
}
