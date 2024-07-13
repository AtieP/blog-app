const debug = require("debug")("AWS:Cognito")

import { AdminCreateUserCommand, AdminInitiateAuthCommand, AdminRespondToAuthChallengeCommand, ChallengeNameType, ChallengeResponse, CognitoIdentityProviderClient, CognitoIdentityProviderServiceException, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { Challenge, IdentityProvider, Tokens } from "../../interfaces/IdentityProvider"
import config from "../../config"
import log from "../../log"
import { createHmac } from "crypto"
import { CognitoJwtVerifier } from "aws-jwt-verify"
import { CognitoJwtVerifierSingleUserPool } from "aws-jwt-verify/cognito-verifier"


function calculateHMAC(username: string): string {
    return createHmac("sha256", config.AWS.Cognito.clientSecret.api)
        .update(username + config.AWS.Cognito.clientIds.api)
        .digest("base64")
}


class Cognito implements IdentityProvider {
    private client: CognitoIdentityProviderClient
    private verifier = CognitoJwtVerifier.create({
        userPoolId: config.AWS.Cognito.userPoolId,
        clientId: Object.values(config.AWS.Cognito.clientIds)
    })

    public async Init(): Promise<void> {
        debug("initializing client")
        this.client = new CognitoIdentityProviderClient({
            credentials: config.AWS.Cognito.credentials,
            region: config.AWS.Cognito.region,
        })
        log.info("Cognito connection initialized")
    }

    public async AdminCreateUser(username: string, password: string): Promise<boolean> {
        debug("creating user", username)
        return false
    }

    public async AdminDeleteUser(username: string): Promise<boolean> {
        return false
    }

    public async Authenticate(username: string, password: string): Promise<Tokens | Challenge> {
        debug("authenticating user", username)

        const cmd = new AdminInitiateAuthCommand({
            AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
            AuthParameters: {
                "USERNAME": username,
                "PASSWORD": password,
                "SECRET_HASH": calculateHMAC(username)
            },
            ClientId: config.AWS.Cognito.clientIds.api,
            UserPoolId: config.AWS.Cognito.userPoolId
        })

        const response = await this.client.send(cmd)
        const authenticationResult = response.AuthenticationResult
        if (authenticationResult) {
            return {
                accessToken: authenticationResult.AccessToken,
                idToken: authenticationResult.IdToken,
                refreshToken: authenticationResult.RefreshToken,
                expiration: authenticationResult.ExpiresIn,
                tokenType: authenticationResult.TokenType
            } as Tokens
        }

        return {
            challengeName: response.ChallengeName,
            challengeParameters: response.ChallengeParameters,
            session: response.Session
        } as Challenge
    }

    public async CompleteChallenge(challenge: Challenge): Promise<Tokens | Challenge> {
        debug("completing challenge for", challenge.challengeParameters.USERNAME)

        const cmd = new AdminRespondToAuthChallengeCommand({
            UserPoolId: config.AWS.Cognito.userPoolId,
            ClientId: config.AWS.Cognito.clientIds.api,
            ChallengeName: challenge.challengeName as ChallengeNameType,
            ChallengeResponses: {
                ...challenge.challengeParameters,
                "SECRET_HASH": calculateHMAC(challenge.challengeParameters.USERNAME)
            },
            Session: challenge.session
        })

        const response = await this.client.send(cmd)
        const authenticationResult = response.AuthenticationResult
        if (authenticationResult) {
            return {
                accessToken: authenticationResult.AccessToken,
                idToken: authenticationResult.IdToken,
                refreshToken: authenticationResult.RefreshToken,
                expiration: authenticationResult.ExpiresIn,
                tokenType: authenticationResult.TokenType
            } as Tokens
        }

        return {
            challengeName: response.ChallengeName,
            challengeParameters: response.ChallengeParameters,
            session: response.Session
        } as Challenge
    }

    public async RevokeToken(tokens: Tokens): Promise<void> {

    }

    public async VerifyAccessToken(tokens: Tokens): Promise<string | null> {
        debug("verifying access tokens")

        let payload
        try {
            payload = await this.verifier.verify(tokens.accessToken, { tokenUse: "access" })
        } catch (e) {
            return null
        }

        // now verify that the token has not been revoked
        try {
            await this.client.send(new GetUserCommand({ AccessToken: tokens.accessToken }))
        } catch (e) {
            if (e instanceof CognitoIdentityProviderServiceException) {
                return null
            }

            throw e
        }

        return payload.username as string // trust me
    }
}

export default new Cognito()