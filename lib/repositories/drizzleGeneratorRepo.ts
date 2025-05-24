import { db } from "@/lib/db";
import { generators, GeneratorType } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { IGeneratorRepository, GeneratorRecord } from "./generatorRepository";

/** Concrete Drizzle implementation */
export class DrizzleGeneratorRepository implements IGeneratorRepository {
    async list(): Promise<GeneratorRecord[]> {
        return (await db.select().from(generators).all()) as GeneratorRecord[];
    }

    async create(input: {
        name: string;
        type: GeneratorType;
        config?: unknown;
    }): Promise<GeneratorRecord> {
        const [row] = await db
            .insert(generators)
            .values({
                name: input.name,
                type: input.type,
                config: input.config ?? {},
                lastRun: null,
            })
            .returning(); // supported by SQLite ≥ 3.35 and Drizzle ≥ 0.30 :contentReference[oaicite:3]{index=3}

        if (!row) throw new Error("Failed to create generator");
        return row;
    }

    async update(
        id: number,
        patch: { name?: string; config?: unknown },
    ): Promise<GeneratorRecord> {
        const changes: Partial<GeneratorRecord> = {};
        if (patch.name !== undefined) changes.name = patch.name;
        if (patch.config !== undefined) changes.config = patch.config;

        const [row] = await db
            .update(generators)
            .set(changes)
            .where(eq(generators.id, id))
            .returning();

        if (!row) throw new Error(`Generator ${id} not found`);
        return row;
    }

    async delete(id: number): Promise<void> {
        await db.delete(generators).where(eq(generators.id, id)).run();
    }
}
