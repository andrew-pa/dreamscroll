import { IPostRepository } from "./postRepository";
import { DrizzlePostRepository } from "./drizzlePostRepo";

export type { IPostRepository } from "./postRepository";

export function getPostRepository(): IPostRepository {
    return new DrizzlePostRepository();
}
