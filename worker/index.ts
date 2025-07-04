import { GENERATOR_TYPES, GeneratorType } from "../lib/db/schema";
import {
    getGeneratorRepository,
    getPostRepository,
    getWorkerRunRepository,
} from "../lib/repositories";
import { TextPostGenerator } from "./textPostGenerator";
import { ImagePostGenerator } from "./imgPostGenerator";
import { FeedPostGenerator } from "./feedPostGenerator";
import { ImageGenClient } from "../lib/imageGenClient";
import { FsImageRepo } from "../lib/repositories/impl/fsImageRepo";
import { PostGenerator } from "./postGenerator";

const generatorsRepo = getGeneratorRepository();
const postsRepo = getPostRepository();
const runsRepo = getWorkerRunRepository();

const generatorImpls: Record<GeneratorType, PostGenerator> = {
    text: new TextPostGenerator(),
    picture: new ImagePostGenerator(new ImageGenClient(), new FsImageRepo()),
    feed: new FeedPostGenerator(),
};

async function main() {
    const generators = await generatorsRepo.list();

    const start = new Date();
    const runId = await runsRepo.create({
        startedAt: start,
        numGenerators: generators.length,
    });
    console.log(`run id ${runId} started at ${start}`);

    let success = 0;
    let fail = 0;
    let postsMade = 0;
    const failed: number[] = [];

    for (const type of GENERATOR_TYPES) {
        const gens = generators.filter(g => g.type === type);
        console.log(`\nrunning ${type} generator, got ${gens.length} configs`);
        for (const g of gens) {
            const lastRun = await generatorsRepo.getLastRun(g.id);
            const start = new Date();
            console.log(
                `running generator #${g.id} (${g.name}) @ ${start} (last run @ ${lastRun?.startTs ?? "never"}, ${lastRun?.outcome ?? ""})`,
            );
            await generatorsRepo.createRun(g.id, start);
            try {
                const posts = await generatorImpls[type].generatePosts(
                    g.id,
                    g.name,
                    g.config,
                    lastRun?.startTs ?? null,
                );
                console.log(`\tgenerated ${posts.length} posts`);
                if (posts.length > 0) {
                    await postsRepo.createMany(posts);
                }
                postsMade += posts.length;
                success++;
                await generatorsRepo.finishRun(g.id, start, {
                    end: new Date(),
                    posts: posts.length,
                    outcome: "success",
                });
            } catch (e) {
                fail++;
                failed.push(g.id);
                console.log(`\tfailed to run generator: ${e}`);
                await generatorsRepo.finishRun(g.id, start, {
                    end: new Date(),
                    posts: 0,
                    outcome: "error",
                    error: e instanceof Error ? e.message : String(e),
                });
            }
            await runsRepo.update(runId, {
                lastUpdate: new Date(),
                successCount: success,
                failCount: fail,
                failedIds: failed,
                postCount: postsMade,
            });
        }
        await generatorImpls[type].cleanup();
    }

    console.log(`${success} generators succeeded, ${fail} failed: ${failed}`);

    await runsRepo.finish(runId, new Date());
}

main()
    .then(() => console.log("success!"))
    .catch(e => console.error(e));
