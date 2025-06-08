import { db } from "@/lib/db";
import {
    generators,
    GeneratorType,
    generatorRuns,
    RunOutcome,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import {
    IGeneratorRepository,
    GeneratorRecord,
    GeneratorRunRecord,
} from "../generatorRepository";

/** Concrete Drizzle implementation */
export class DrizzleGeneratorRepository implements IGeneratorRepository {
    async list(type?: GeneratorType): Promise<GeneratorRecord[]> {
        if (type) {
            const r = await db
                .select()
                .from(generators)
                .where(eq(generators.type, type))
                .all();
            return r as GeneratorRecord[];
        }
        const r = await db.select().from(generators).all();
        return r as GeneratorRecord[];
    }

    async get(id: number): Promise<GeneratorRecord | null> {
        const r = await db
            .select()
            .from(generators)
            .where(eq(generators.id, id))
            .limit(1)
            .all();
        return (r[0] as GeneratorRecord | undefined) ?? null;
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

    async createRun(generatorId: number, start: Date): Promise<void> {
        await db.insert(generatorRuns).values({
            generatorId,
            startTs: start,
        });
    }

    async finishRun(
        generatorId: number,
        start: Date,
        result: {
            end: Date;
            posts: number;
            outcome: RunOutcome;
            error?: string;
        },
    ): Promise<void> {
        await db
            .update(generatorRuns)
            .set({
                endTs: result.end,
                posts: result.posts,
                outcome: result.outcome,
                error: result.error,
            })
            .where(
                and(
                    eq(generatorRuns.generatorId, generatorId),
                    eq(generatorRuns.startTs, start),
                ),
            )
            .run();
    }

    async getLastRun(id: number): Promise<GeneratorRunRecord | null> {
        const r = await db
            .select()
            .from(generatorRuns)
            .where(eq(generatorRuns.generatorId, id))
            .orderBy(desc(generatorRuns.startTs))
            .limit(1)
            .all();
        return (r[0] as GeneratorRunRecord | undefined) ?? null;
    }

    async listRunErrors(start: Date) {
        const rows = await db
            .select({
                id: generatorRuns.generatorId,
                name: generators.name,
                error: generatorRuns.error,
            })
            .from(generatorRuns)
            .innerJoin(generators, eq(generatorRuns.generatorId, generators.id))
            .where(
                and(
                    eq(generatorRuns.startTs, start),
                    eq(generatorRuns.outcome, "error"),
                ),
            )
            .all();
        return rows as { id: number; name: string; error: string }[];
    }

    async delete(id: number): Promise<void> {
        await db.delete(generators).where(eq(generators.id, id)).run();
    }
}
