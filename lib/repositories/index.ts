import { IPostRepository } from "./postRepository";
import { IGeneratorRepository } from "./generatorRepository";
import { IImageRepository } from "./imageRepository";

export type { IPostRepository } from "./postRepository";
export type {
    IGeneratorRepository,
    GeneratorRecord,
} from "./generatorRepository";

import { DrizzlePostRepository } from "./impl/drizzlePostRepo";
import { DrizzleGeneratorRepository } from "./impl/drizzleGeneratorRepo";
import { FsImageRepo } from "./impl/fsImageRepo";

export function getPostRepository(): IPostRepository {
    return new DrizzlePostRepository();
}

export function getGeneratorRepository(): IGeneratorRepository {
    return new DrizzleGeneratorRepository();
}

export function getImageRepository(): IImageRepository {
    return new FsImageRepo();
}
