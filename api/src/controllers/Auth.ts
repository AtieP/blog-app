import { Response } from "express"
import * as yup from "yup"
import Cognito from "../providers/AWS/Cognito"
import { CognitoIdentityProviderServiceException } from "@aws-sdk/client-cognito-identity-provider"
import { Challenge, Tokens } from "../interfaces/IdentityProvider"
import { GenericRequest } from "../interfaces/Request"


export default class AuthController {
    // controller only in use if not using the hosted ui
    public static async Auth(req: GenericRequest, res: Response) {
        const schema = yup.object({
            username: yup.string().required(),
            password: yup.string().required()
        }).noUnknown().strict()

        let body: yup.InferType<typeof schema>
        try {
            body = await schema.validate(req.body, { abortEarly: false })
        } catch (e) {
            if (e instanceof yup.ValidationError) {
                return res.status(400).json({ errors: e.errors })
            }

            throw e
        }

        try {
            const result = await Cognito.Authenticate(body.username, body.password)
            // typescript moment. no way to check what's the interface of the returned value.
            // check members
            if ((result as Tokens).accessToken) {
                return res.status(200).setHeader("Cache-Control", "no-store").json({
                    tokens: result
                })
            }

            return res.status(200).setHeader("Cache-Control", "no-store").json({ challenge: result })
        } catch (e) {
            if (e instanceof CognitoIdentityProviderServiceException) {
                return res.status(400).json({ error: e.name })
            }

            throw e
        }
    }

    public static async CompleteChallenge(req: GenericRequest, res: Response) {
        const schema = yup.object({
            challengeName: yup.string().required(),
            challengeParams: yup.object({
                USERNAME: yup.string().required()
            }).required(),
            session: yup.string().required()
        })

        let body: yup.InferType<typeof schema>
        try {
            body = await schema.validate(req.body, { abortEarly: false })
        } catch (e) {
            if (e instanceof yup.ValidationError) {
                return res.status(400).json({ errors: e.errors })
            }

            throw e
        }

        const challenge: Challenge = {
            session: body.session,
            challengeName: body.challengeName,
            challengeParameters: body.challengeParams
        }

        try {
            const response = await Cognito.CompleteChallenge(challenge)
            if ((response as Tokens).accessToken) {
                return res.status(200).setHeader("Cache-Control", "no-store").json({
                    tokens: response
                })
            }

            return res.status(200).json({ challenge: response })
        } catch (e) {
            if (e instanceof CognitoIdentityProviderServiceException) {
                return res.status(400).setHeader("Cache-Control", "no-store").json({ error: e.name })
            }

            throw e
        }
    }
}