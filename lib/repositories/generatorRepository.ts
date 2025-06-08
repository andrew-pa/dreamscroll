export type { GeneratorType, RunOutcome } from "@/lib/db/schema";
export { GENERATOR_TYPES } from "@/lib/db/schema";
import type { GeneratorType, RunOutcome } from "@/lib/db/schema";

export interface GeneratorRecord {
    id: number;
    name: string;
    type: GeneratorType;
    config: unknown;
}

export interface GeneratorRunRecord {
    generatorId: number;
    startTs: Date;
    endTs?: Date | null;
    posts?: number | null;
    outcome?: RunOutcome | null;
    error?: string | null;
}

export interface IGeneratorRepository {
    list(type?: GeneratorType): Promise<GeneratorRecord[]>;

    create(input: {
        name: string;
        type: GeneratorType;
        config?: unknown;
    }): Promise<GeneratorRecord>;

    update(
        id: number,
        patch: { name?: string; config?: unknown },
    ): Promise<GeneratorRecord>;

    createRun(generatorId: number, start: Date): Promise<void>;

    finishRun(
        generatorId: number,
        start: Date,
        result: {
            end: Date;
            posts: number;
            outcome: RunOutcome;
            error?: string;
        },
    ): Promise<void>;

    getLastRun(id: number): Promise<GeneratorRunRecord | null>;

    /**
     * List any generator errors for the worker run that started at `start`.
     */
    listRunErrors(
        start: Date,
    ): Promise<{ id: number; name: string; error: string }[]>;

    delete(id: number): Promise<void>;
}
