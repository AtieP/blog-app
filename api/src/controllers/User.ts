const debug = require("debug")("Controllers:User")

import { Response } from "express"
import DynamoDB from "../providers/AWS/DynamoDB"
import { UserRequest } from "../interfaces/Request"
import SimpleCache from "../providers/cache/Simple"
import * as yup from "yup"
import User from "../models/User"

class UserController {
    public static async delete(req: UserRequest, res: Response) {
        const username = req.params.username
        return res.status(501).json({ error: "not implemented" })
    }

    public static async get(req: UserRequest, res: Response) {
        const username = req.params.username
        let user = await SimpleCache.GetUser(username)
        let posts = await SimpleCache.QueryUserPosts(username)

        if (user === null) {
            return res.status(404).json({ error: "user not found" })
        }

        if (user === undefined) {
            if (req.rateLimit.limit < req.rateLimit.used) {
                return res.status(429).json({ error: "too many requests, try again later" })
            }
            user = await DynamoDB.QueryUserByName(username)
            if (user === null) {
                await SimpleCache.RemoveUser(username)
                return res.status(404).json({ error: "user not found" })
            }
            await SimpleCache.SetUser(user)
        }

        if (!posts) {
            posts = await DynamoDB.QueryUserPosts(username)
            await SimpleCache.AddUserPosts(username, posts)
        }

        return res.status(200).json({
            username: user.username,
            fullName: user.fullName,
            creationDate: user.creationDate,
            profilePicture: user.profilePicture,
            bio: user.bio,
            posts: posts
        })
    }

    public static async update(req: UserRequest, res: Response) {
        const username = res.locals.username
        if (username !== req.params.username) {
            // WHAT
            return res.status(403).json({ error: "not your own user" })
        }

        if (req.rateLimit.limit < req.rateLimit.used) {
            return res.status(429).json({ error: "too many requests, try again later" })
        }

        const schema = yup.object({
            fullName: yup.string().optional().nullable().max(50),
            profilePicture: yup.string().optional().url().nullable().max(256),
            bio: yup.string().optional().nullable().max(200)
        })

        let body: yup.InferType<typeof schema>
        try {
            body = await schema.validate(req.body, { abortEarly: false })
        } catch (e) {
            if (e instanceof yup.ValidationError) {
                return res.status(400).json({ error: e.errors })
            }

            throw e
        }

        let user = await SimpleCache.GetUser(username)
        if (user === null) {
            // cannot be??? anyways
            return res.status(404).json({ error: "user not found" })
        }

        if (user === undefined) {
            user = await DynamoDB.QueryUserByName(username)
            if (!user) {
                await SimpleCache.RemoveUser(username)
                return res.status(404).json({ error: "user not found" })
            }

            await SimpleCache.SetUser(user)
        }

        const updatedUser: Partial<User> = {}
        if (body.bio !== undefined) {
            updatedUser.bio = body.bio === null ? "" : body.bio
        }

        if (body.fullName !== undefined) {
            updatedUser.fullName = body.fullName === null ? "" : body.fullName
        }

        if (body.profilePicture !== undefined) {
            updatedUser.profilePicture = body.profilePicture === null ? "" : body.profilePicture
        }

        await DynamoDB.UpdateUser(username, updatedUser)
        await SimpleCache.UpdateUser(username, updatedUser)
        return res.status(200).json({ message: "user updated" })
    }
}


export default UserController
