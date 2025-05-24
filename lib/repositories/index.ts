import { IPostRepository } from "./postRepository";
import { DrizzlePostRepository } from "./drizzlePostRepo";
import { IGeneratorRepository } from "./generatorRepository";
import { DrizzleGeneratorRepository } from "./drizzleGeneratorRepo";

export type { IPostRepository } from "./postRepository";
export type {
    IGeneratorRepository,
    GeneratorRecord,
} from "./generatorRepository";

export function getPostRepository(): IPostRepository {
    return new DrizzlePostRepository();
}

export function getGeneratorRepository(): IGeneratorRepository {
    return new DrizzleGeneratorRepository();
}
