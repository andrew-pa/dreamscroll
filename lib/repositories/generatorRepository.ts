export type { GeneratorType } from "@/lib/db/schema";
export { GENERATOR_TYPES } from "@/lib/db/schema";
import type { GeneratorType } from "@/lib/db/schema";

export interface GeneratorRecord {
    id: number;
    name: string;
    type: GeneratorType;
    config: unknown;
    lastRun: Date | null;
}

export interface IGeneratorRepository {
    list(): Promise<GeneratorRecord[]>;

    create(input: {
        name: string;
        type: GeneratorType;
        config?: unknown;
    }): Promise<GeneratorRecord>;

    update(
        id: number,
        patch: { name?: string; config?: unknown },
    ): Promise<GeneratorRecord>;

    delete(id: number): Promise<void>;
}
