const debug = require("debug")("Controller:Comment")

import { Response } from "express"
import { PostRequest, CommentRequest } from "../interfaces/Request"
import DynamoDB from "../providers/AWS/DynamoDB"
import Comment from "../models/Comment"
import { randomBytes } from "crypto"
import * as yup from "yup"
import SimpleCache from "../providers/cache/Simple"


export default class CommentController {
    public static async create(req: PostRequest, res: Response) {
        debug("create")

        if (req.rateLimit.limit < req.rateLimit.used) {
            return res.status(429).json({ error: "too many requests, try again later" })
        }
        const commentId = randomBytes(4).toString("base64url")
        const schema = yup.object({
            content: yup.string().required().nonNullable().max(1000)
        }).noUnknown().strict()

        let body: yup.InferType<typeof schema>
        try {
            body = await schema.validate(req.body, { abortEarly: false })
        } catch (e) {
            if (e instanceof yup.ValidationError) {
                return res.status(400).json({ error: e.errors })
            }

            throw e
        }

        const comment: Comment = {
            commentId: commentId,
            postId: req.params.postId,
            username: res.locals.username,
            content: body.content,
            creationDate: new Date()
        }

        await DynamoDB.CreateComment(comment)

        // do not prepopulate the cache only with a single entry
        if (await SimpleCache.GetPostComments(req.params.postId)) {
            await SimpleCache.AddPostComments(req.params.postId, [comment])
        }

        return res.status(201).json(comment)
    }

    public static async delete(req: CommentRequest, res: Response) {
        debug("delete")

        if (req.rateLimit.limit < req.rateLimit.used) {
            return res.status(429).json({ error: "too many requests, try again later" })
        }

        const postId = req.params.postId
        const commentId = req.params.commentId
        const username = res.locals.username
        let comments = await SimpleCache.GetPostComments(postId)
        if (!comments) {
            comments = await DynamoDB.QueryPostComments(postId, 0, 100)
            await SimpleCache.AddPostComments(postId, comments)
        }

        const [ comment ] = comments.filter(comment => comment.commentId === commentId)
        if (!comment) {
            return res.status(404).json({ error: "comment not found" })
        }

        if (comment.username !== username) {
            return res.status(403).json({ error: "not owner of comment" })
        }

        await DynamoDB.DeleteComment(username, postId, commentId)
        await SimpleCache.RemovePostComment(postId, commentId)
        return res.status(200).json({ message: "comment deleted" })
    }
}