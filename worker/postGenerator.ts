import { CreatePostRecord } from "@/lib/repositories/postRepository";

export abstract class PostGenerator {
    public abstract generatePosts(
        id: number,
        name: string,
        config: unknown,
    ): Promise<CreatePostRecord[]>;

    public async cleanup(): Promise<void> {}
}
