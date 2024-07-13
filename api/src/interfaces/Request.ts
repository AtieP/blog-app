
import { Request } from "express"


export interface GenericRequest extends Request {
    rateLimit: {
        limit: number
        used: number
        remaining: number
    }
}


export interface UserRequest extends GenericRequest {
    params: {
        username: string
    }
}


export interface PostRequest extends GenericRequest {
    params: {
        postId: string
    }
}


export interface CommentRequest extends PostRequest {
    params: {
        postId: string
        commentId: string
    }
}
