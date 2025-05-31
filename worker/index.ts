import { GENERATOR_TYPES, GeneratorType } from "../lib/db/schema";
import { getGeneratorRepository, getPostRepository } from "../lib/repositories";
import { TextPostGenerator } from "./textPostGenerator";
import { ImagePostGenerator } from "./imgPostGenerator";
import { ImageGenClient } from "../lib/imageGenClient";
import { FsImageRepo } from "../lib/repositories/impl/fsImageRepo";
import { PostGenerator } from "./postGenerator";

const generatorsRepo = getGeneratorRepository();
const postsRepo = getPostRepository();

const generatorImpls: Record<GeneratorType, PostGenerator> = {
    text: new TextPostGenerator(),
    picture: new ImagePostGenerator(new ImageGenClient(), new FsImageRepo()),
};

async function main() {
    for (const type of GENERATOR_TYPES) {
        console.log(`\nrunning ${type} generator`);
        const gens = await generatorsRepo.list(type);
        console.log(`got ${gens.length} generator configs`);
        for (const g of gens) {
            const runTime = new Date();
            console.log(`running generator #${g.id} (${g.name}) @ ${runTime}`);
            try {
                const posts = await generatorImpls[type].generatePosts(
                    g.id,
                    g.name,
                    g.config,
                );
                await generatorsRepo.recordRun(g.id, runTime);
                console.log(`\tgenerated ${posts.length} posts`);
                await postsRepo.createMany(posts);
            } catch (e) {
                console.log(`\tfailed to run generator: ${e}`);
            }
        }
        await generatorImpls[type].cleanup();
    }
}

main()
    .then(() => console.log("success!"))
    .catch(e => console.error(e));
