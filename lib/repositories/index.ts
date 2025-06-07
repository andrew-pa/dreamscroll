import { IPostRepository } from "./postRepository";
import { IGeneratorRepository } from "./generatorRepository";
import { IImageRepository } from "./imageRepository";
import { IWorkerRunRepository } from "./workerRunRepository";

export type { IPostRepository } from "./postRepository";
export type {
    IGeneratorRepository,
    GeneratorRecord,
    GeneratorRunRecord,
    RunOutcome,
} from "./generatorRepository";
export type { IWorkerRunRepository, WorkerRunRecord } from "./workerRunRepository";

import { DrizzlePostRepository } from "./impl/drizzlePostRepo";
import { DrizzleGeneratorRepository } from "./impl/drizzleGeneratorRepo";
import { FsImageRepo } from "./impl/fsImageRepo";
import { DrizzleWorkerRunRepository } from "./impl/drizzleWorkerRunRepo";

export function getPostRepository(): IPostRepository {
    return new DrizzlePostRepository();
}

export function getGeneratorRepository(): IGeneratorRepository {
    return new DrizzleGeneratorRepository();
}

export function getImageRepository(): IImageRepository {
    return new FsImageRepo();
}

export function getWorkerRunRepository(): IWorkerRunRepository {
    return new DrizzleWorkerRunRepository();
}
