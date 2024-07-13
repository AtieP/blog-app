

export interface Tokens {
    accessToken?: string
    idToken?: string
    refreshToken?: string
    expiration?: number
    tokenType?: string
}

export interface Challenge {
    session: string
    challengeName: string
    challengeParameters: Record<string, string>
}

export interface ChallengeParameters {
    [param: string]: string
}


export interface IdentityProvider {
    Init(): Promise<void>

    // either return the username associated with the tokens
    // or null if the token is not valid
    VerifyAccessToken(tokens: Tokens): Promise<string | null>

    // all of the following optional if using the hosted ui
    AdminCreateUser(username: string, password: string): Promise<boolean>
    AdminDeleteUser(username: string): Promise<boolean>

    Authenticate(username: string, password: string): Promise<Tokens | Challenge>
    CompleteChallenge(challenge: Challenge): Promise<Tokens | Challenge>
    RevokeToken(tokens: Tokens): Promise<void>
}
