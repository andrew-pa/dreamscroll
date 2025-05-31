import { GENERATOR_TYPES, GeneratorType } from "../lib/db/schema";
import { getGeneratorRepository, getPostRepository } from "../lib/repositories";
import { CreatePostRecord } from "../lib/repositories/postRepository";
import { TextPostGenerator } from "./textPostGenerator";
import { PicturePostGenerator } from "./imgPostGenerator";
import { ImageGenClient } from "../lib/imageGenClient";
import { FsImageRepo } from "../lib/repositories/impl/fsImageRepo";

const generatorsRepo = getGeneratorRepository();
const postsRepo = getPostRepository();

export interface PostGenerator {
    generatePosts(
        id: number,
        name: string,
        config: unknown,
    ): Promise<CreatePostRecord[]>;
}

const generatorImpls: Record<GeneratorType, PostGenerator> = {
    text: new TextPostGenerator(),
    picture: new PicturePostGenerator(new ImageGenClient(), new FsImageRepo()),
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
    }
}

main()
    .then(() => console.log("success!"))
    .catch(e => console.error(e));
