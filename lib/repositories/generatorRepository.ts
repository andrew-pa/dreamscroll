export const GENERATOR_TYPES = [
    'text', 'picture'
] as const;
export type GeneratorType = typeof GENERATOR_TYPES[number];

export interface GeneratorRecord {
    id: string;
    name: string;
    type: GeneratorType;
    config: unknown;
    lastRun: Date | null;
}

export interface IGeneratorRepository {
    list(): Promise<GeneratorRecord[]>;

    create(input: { name: string; type: GeneratorType, config?: unknown }): Promise<GeneratorRecord>;

    update(
        id: string,
        patch: { name?: string; config?: unknown },
    ): Promise<GeneratorRecord>;

    delete(id: string): Promise<void>;
}
