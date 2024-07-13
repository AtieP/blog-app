const debug = require("debug")("Cache:SimpleCache")

import Cache from "../../interfaces/Cache"
import PostAttributes from "../../models/PostAttributes"
import User from "../../models/User"
import Comment from "../../models/Comment"


class SimpleCache implements Cache {
    private postStorage: { [postId: string]: PostAttributes & { content: string } } = {}
    private userStorage: { [username: string]: User } = {}
    private userPostsStorage: { [username: string]: PostAttributes[] } = {}
    private commentStorage: { [postId: string]: Comment[] } = {}

    public async GetUser(username: string): Promise<User | undefined> {
        debug("querying user", username)
        return this.userStorage[username]
    }

    public async SetUser(user: User): Promise<void> {
        debug("setting user", user.username)
        this.userStorage[user.username] = user
    }

    public async UpdateUser(username: string, newUser: Partial<User>): Promise<void> {
        debug("updating user", username)
        this.userStorage[username] = { ...this.userStorage[username], ...newUser }
    }

    public async RemoveUser(username: string): Promise<void> {
        debug("removing user", username)
        this.userStorage[username] = null
    }

    public async GetPost(postId: string): Promise<PostAttributes & { content: string }> {
        debug("querying post", postId)
        return this.postStorage[postId]
    }

    public async SetPost(post: PostAttributes & { content: string }): Promise<void> {
        debug("setting post", post.postId)
        this.postStorage[post.postId] = post
    }

    public async UpdatePost(postId: string, newPost: Partial<PostAttributes & { content: string }>): Promise<void> {
        debug("updating post", postId)
        this.postStorage[postId] = { ...this.postStorage[postId], ...newPost }
        // if the post is in the user storage, update attributes
        this.userPostsStorage[this.postStorage[postId].username] =
            this.userPostsStorage[this.postStorage[postId].username]?.map(p =>
                p.postId === postId ? { ...p, ...newPost } : p
            )
    }

    public async RemovePost(postId: string): Promise<void> {
        debug("removing post", postId)
        this.postStorage[postId] = null
    }

    public async QueryUserPosts(username: string): Promise<PostAttributes[]> {
        debug("querying posts for", username)
        return this.userPostsStorage[username]
    }

    public async AddUserPosts(username: string, posts: PostAttributes[]): Promise<void> {
        debug("adding posts", posts, "for", username)
        this.userPostsStorage[username] ??= []
        this.userPostsStorage[username].push(...posts)
    }

    public async RemoveUserPosts(username: string, posts: string[]): Promise<void> {
        debug("removing posts", posts, "for", username)
        this.userPostsStorage[username] =
            this.userPostsStorage[username]?.filter(v => !posts.includes(v.postId))
    }

    public async AddPostComments(postId: string, comments: Comment[]): Promise<void> {
        debug("adding post comments", comments, "for", postId)
        this.commentStorage[postId] ??= []
        this.commentStorage[postId].push(...comments)
    }

    public async GetPostComments(postId: string): Promise<Comment[]> {
        debug("getting comments for", postId)
        return this.commentStorage[postId]
    }

    public async RemovePostComment(postId: string, commentId: string): Promise<void> {
        debug("removing from post", postId, "comment", commentId)
        this.commentStorage[postId] =
            this.commentStorage[postId]?.filter(comment => comment.commentId !== commentId)
    }

    public async RemovePostComments(postId: string): Promise<void> {
        debug("removing from post", postId, "all comments")
        delete this.commentStorage[postId]
    }
}

export default new SimpleCache()