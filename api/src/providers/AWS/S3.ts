const debug = require("debug")("AWS:S3")

import { DeleteObjectCommand, GetObjectCommand, GetObjectCommandOutput, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import Storage from "../../interfaces/Storage"
import config from "../../config"
import log from "../../log"


class S3 implements Storage {
    private client: S3Client

    public async Init() {
        debug("initializing S3 client")
        this.client = new S3Client({
            region: config.AWS.S3.region,
            credentials: config.AWS.S3.credentials
        })
        log.info("S3 connection initialized")
    }

    public async UploadPostContent(postId: string, data: string): Promise<void> {
        debug("uploading content for post", postId)
        const cmd = new PutObjectCommand({
            Bucket: config.AWS.S3.bucketName,
            Key: `post-content/${postId}`,
            Body: data
        })
        await this.client.send(cmd)
    }

    public async DeletePostContent(postId: string): Promise<void> {
        debug("deleting content for post", postId)
        const cmd = new DeleteObjectCommand({
            Bucket: config.AWS.S3.bucketName,
            Key: `post-content/${postId}`,
        })
        await this.client.send(cmd)
    }

    public async QueryPostContent(postId: string): Promise<string | null> {
        debug("querying post content for", postId)
        const cmd = new GetObjectCommand({
            Bucket: config.AWS.S3.bucketName,
            Key: `post-content/${postId}`
        })

        let output: GetObjectCommandOutput
        try {
            output = await this.client.send(cmd)
        } catch (e) {
            if (e instanceof NoSuchKey) {
                return null
            }

            throw e
        }

        return await output.Body.transformToString()
    }
}


export default new S3()