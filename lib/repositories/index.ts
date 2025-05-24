import { IPostRepository } from "./postRepository";
import { DrizzlePostRepository } from "./drizzlePostRepo";
import { IGeneratorRepository } from "./generatorRepository";

export type { IPostRepository } from "./postRepository";
export type {
    IGeneratorRepository,
    GeneratorRecord,
} from "./generatorRepository";

export function getPostRepository(): IPostRepository {
    return new DrizzlePostRepository();
}

const store: GeneratorRecord[] = [];

export function getGeneratorRepository(): IGeneratorRepository {
    return {
        /* list all, sorted for deterministic order */
        async list() {
            return [...store].sort((a, b) => a.name.localeCompare(b.name));
        },

        /* create a new generator */
        async create({ name, type, config = {} }) {
            const g: GeneratorRecord = {
                id: name,
                name,
                type,
                config,
                lastRun: null,
            };
            store.push(g);
            return g;
        },

        /* partial update */
        async update(id, patch) {
            const idx = store.findIndex(g => g.id === id);
            if (idx === -1) throw new Error("Generator not found");

            if (patch.name !== undefined) store[idx].name = patch.name;
            if (patch.config !== undefined) store[idx].config = patch.config;

            return { ...store[idx] };
        },

        /* hard‑delete */
        async delete(id) {
            const idx = store.findIndex(g => g.id === id);
            if (idx === -1) throw new Error("Generator not found");
            store.splice(idx, 1);
        },
    };
}
