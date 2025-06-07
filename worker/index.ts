import { GENERATOR_TYPES, GeneratorType } from "../lib/db/schema";
import type { GeneratorRecord } from "../lib/repositories";
import {
    getGeneratorRepository,
    getPostRepository,
    getWorkerRunRepository,
} from "../lib/repositories";
import { TextPostGenerator } from "./textPostGenerator";
import { ImagePostGenerator } from "./imgPostGenerator";
import { ImageGenClient } from "../lib/imageGenClient";
import { FsImageRepo } from "../lib/repositories/impl/fsImageRepo";
import { PostGenerator } from "./postGenerator";

const generatorsRepo = getGeneratorRepository();
const postsRepo = getPostRepository();
const runsRepo = getWorkerRunRepository();

const generatorImpls: Record<GeneratorType, PostGenerator> = {
    text: new TextPostGenerator(),
    picture: new ImagePostGenerator(new ImageGenClient(), new FsImageRepo()),
};

async function main() {
    const lists: Record<GeneratorType, GeneratorRecord[]> = {
        text: [],
        picture: [],
    };
    let total = 0;
    for (const t of GENERATOR_TYPES) {
        const gens = await generatorsRepo.list(t);
        lists[t] = gens;
        total += gens.length;
    }

    const start = new Date();
    await runsRepo.create({ startedAt: start, numGenerators: total });

    let success = 0;
    let fail = 0;
    let postsMade = 0;
    const failed: number[] = [];

    for (const type of GENERATOR_TYPES) {
        const gens = lists[type];
        console.log(`\nrunning ${type} generator, got ${gens.length} configs`);
        for (const g of gens) {
            const start = new Date();
            console.log(`running generator #${g.id} (${g.name}) @ ${start}`);
            await generatorsRepo.createRun(g.id, start);
            try {
                const posts = await generatorImpls[type].generatePosts(
                    g.id,
                    g.name,
                    g.config,
                );
                await generatorsRepo.finishRun(g.id, start, {
                    end: new Date(),
                    posts: posts.length,
                    outcome: "success",
                });
                await postsRepo.createMany(posts);
                postsMade += posts.length;
                success++;
                await runsRepo.update(start, {
                    lastUpdate: new Date(),
                    successCount: success,
                    postCount: postsMade,
                });
                console.log(`\tgenerated ${posts.length} posts`);
            } catch (e) {
                fail++;
                failed.push(g.id);
                await runsRepo.update(start, {
                    lastUpdate: new Date(),
                    failCount: fail,
                    failedIds: [...failed],
                });
                console.log(`\tfailed to run generator: ${e}`);
                await generatorsRepo.finishRun(g.id, start, {
                    end: new Date(),
                    posts: 0,
                    outcome: "error",
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        await generatorImpls[type].cleanup();
    }

    await runsRepo.finish(start, new Date());
}

main()
    .then(() => console.log("success!"))
    .catch(e => console.error(e));
