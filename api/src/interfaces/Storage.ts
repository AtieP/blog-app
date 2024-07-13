

export default interface Storage {
    Init(): Promise<void>

    UploadPostContent(postId: string, data: string): Promise<void>
    DeletePostContent(postId: string): Promise<void>
    QueryPostContent(postId: string): Promise<string | null>
}