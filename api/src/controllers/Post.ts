const debug = require("debug")("Controllers:Post")


import { Response } from "express"
import { GenericRequest, PostRequest } from "../interfaces/Request"
import * as yup from "yup"
import DynamoDB from "../providers/AWS/DynamoDB"
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb"
import { randomBytes } from "crypto"
import PostAttributes from "../models/PostAttributes"
import S3 from "../providers/AWS/S3"
import SimpleCache from "../providers/cache/Simple"
import Simple from "../providers/cache/Simple"


export default class PostController {
    public static async create(req: GenericRequest, res: Response) {
        debug("create")

        if (req.rateLimit.limit < req.rateLimit.used) {
            return res.status(429).json({ error: "too many requests, try again later" })
        }

        const schema = yup.object({
            title: yup.string().required().nonNullable().max(100),
            caption: yup.string().required().nonNullable().max(200),
            captionImage: yup.string().url().required().nonNullable().max(256),
            content: yup.string().required().nonNullable().max(200000)
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

        const username = res.locals.username
        const id = randomBytes(6).toString("base64url")
        const newPostAttributes: PostAttributes = {
            postId: id,
            username: username,

            title: body.title,
            caption: body.caption,
            captionImage: body.captionImage,
            creationDate: new Date()
        }

        await DynamoDB.CreatePostAttributes(newPostAttributes)
        await S3.UploadPostContent(id, body.content)
        await SimpleCache.SetPost({ ...newPostAttributes, content: body.content })

        // do not prepopulate the cache only with a single entry
        if (await SimpleCache.QueryUserPosts(username)) {
            await SimpleCache.AddUserPosts(username, [ newPostAttributes ])
        }

        return res.status(201).setHeader("Location", `/api/v1/post/${id}`).json({ message: "post created", location: `/api/v1/post/${id}` })
    }

    public static async update(req: PostRequest, res: Response) {
        debug("update")

        const schema = yup.object({
            title: yup.string().optional().nonNullable().max(100),
            caption: yup.string().optional().nonNullable().max(200),
            captionImage: yup.string().optional().url().nonNullable().max(256),
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

        // avoid update spam with the purpose of consuming DynamoDB WCUs
        const postId = req.params.postId
        const username = res.locals.username
        let oldPostAttributes: PostAttributes = await SimpleCache.GetPost(postId)

        if (oldPostAttributes === null) {
            return res.status(404).json({ error: "post not found" })
        }

        if (oldPostAttributes === undefined) {
            if (req.rateLimit.limit < req.rateLimit.used) {
                return res.status(429).json({ error: "too many requests, try again later" })
            }
            oldPostAttributes = await DynamoDB.QueryPostAttributesById(postId)
            if (oldPostAttributes === null) {
                await SimpleCache.RemovePost(postId)
                return res.status(404).json({ error: "post not found" })
            }

            const postContent = await S3.QueryPostContent(postId)
            await SimpleCache.SetPost({ ...oldPostAttributes, content: postContent })
        }

        if (oldPostAttributes.username !== username) {
            return res.status(403).json({ error: "not owner of post" })
        }

        const updated: Partial<PostAttributes> = {
            postId: req.params.postId,
        }

        if (body.title) {
            updated.title = body.title
        }
        if (body.caption) {
            updated.caption = body.caption
        }
        if (body.captionImage) {
            updated.captionImage = body.captionImage
        }

        await DynamoDB.UpdatePostAttributes(username, updated)
        // 100% in cache
        await SimpleCache.UpdatePost(postId, updated)

        return res.status(200).json({ message: "post updated" })
    }

    public static async delete(req: PostRequest, res: Response) {
        debug("delete")

        // deletion consumes capacity units.
        // avoid spam
        const postId = req.params.postId
        const username = res.locals.username
        let postAttributes: PostAttributes = await SimpleCache.GetPost(postId)

        if (postAttributes === null) {
            return res.status(404).json({ error: "post not found" })
        }

        if (postAttributes === undefined) {
            if (req.rateLimit.limit < req.rateLimit.used) {
                return res.status(429).json({ error: "too many requests, try again later" })
            }
            postAttributes = await DynamoDB.QueryPostAttributesById(postId)
            if (postAttributes === null) {
                await SimpleCache.RemovePost(postId)
                return res.status(404).json({ error: "post not found" })
            }

            const postContent = await S3.QueryPostContent(postId)
            await SimpleCache.SetPost({ ...postAttributes, content: postContent })
        }

        if (postAttributes.username !== username) {
            return res.status(403).json({ error: "not owner of post" })
        }

        // all good. proceed to deletion
        await DynamoDB.DeletePostAttributes(username, postId)
        await S3.DeletePostContent(postId)
        await SimpleCache.RemovePost(postId)
        await SimpleCache.RemoveUserPosts(username, [postId])

        // todo: delete comments. maybe write a worker or something?

        return res.status(200).json({ message: "post deleted" })
    }

    public static async get(req: PostRequest, res: Response) {
        debug("get")

        const postId = req.params.postId
        let post: PostAttributes & { content: string } = await SimpleCache.GetPost(postId)

        if (post === null) {
            return res.status(404).json({ error: "post not found" })
        }

        if (post === undefined) {
            if (req.rateLimit.limit < req.rateLimit.used) {
                return res.status(429).json({ error: "too many requests, try again later" })
            }

            const postAttributes = await DynamoDB.QueryPostAttributesById(postId)
            if (postAttributes === null) {
                await SimpleCache.RemovePost(postId)
                return res.status(404).json({ error: "post not found" })
            }

            const postContent = await S3.QueryPostContent(postId)
            post = { ...postAttributes, content: postContent }
            await SimpleCache.SetPost(post)
        }

        return res.status(200).json(post)
    }

    public static async listComments(req: PostRequest, res: Response) {
        debug("listComments")

        const postId = req.params.postId
        let comments = await SimpleCache.GetPostComments(postId)
        if (!comments) {
            if (req.rateLimit.limit < req.rateLimit.used) {
                return res.status(429).json({ error: "too many requests, try again later" })
            }
            comments = await DynamoDB.QueryPostComments(postId, 0, 100)
            await SimpleCache.AddPostComments(postId, comments)
        }

        const ret = []
        for (const comment of comments) {
            ret.push({
                commentId: comment.commentId,
                postId: comment.postId,
                username: comment.username,
                content: comment.content,
                creationDate: comment.creationDate
            })
        }

        return res.status(200).json({ comments: ret })
    }
}