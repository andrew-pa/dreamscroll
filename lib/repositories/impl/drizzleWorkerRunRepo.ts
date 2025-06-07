import { db } from "@/lib/db";
import { workerRuns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import type {
    IWorkerRunRepository,
    WorkerRunRecord,
} from "../workerRunRepository";

export class DrizzleWorkerRunRepository implements IWorkerRunRepository {
    async getLast(): Promise<WorkerRunRecord | null> {
        const row = await db
            .select()
            .from(workerRuns)
            .orderBy(desc(workerRuns.startedAt))
            .limit(1)
            .get();
        return (row ?? null) as WorkerRunRecord | null;
    }

    async list(limit: number, offset: number): Promise<WorkerRunRecord[]> {
        const rows = await db
            .select()
            .from(workerRuns)
            .orderBy(desc(workerRuns.startedAt))
            .limit(limit)
            .offset(offset)
            .all();
        return rows as WorkerRunRecord[];
    }

    async create(run: {
        startedAt: Date;
        numGenerators: number;
    }): Promise<void> {
        await db.insert(workerRuns).values({
            startedAt: run.startedAt,
            lastUpdate: run.startedAt,
            numGenerators: run.numGenerators,
            successCount: 0,
            failCount: 0,
            postCount: 0,
            failedIds: [],
        });
    }

    async update(
        startedAt: Date,
        patch: Partial<Omit<WorkerRunRecord, "startedAt">>,
    ): Promise<void> {
        const changes: Partial<WorkerRunRecord> = { ...patch };
        await db
            .update(workerRuns)
            .set(changes)
            .where(eq(workerRuns.startedAt, startedAt));
    }

    async finish(startedAt: Date, endedAt: Date): Promise<void> {
        await db
            .update(workerRuns)
            .set({ endedAt, lastUpdate: endedAt })
            .where(eq(workerRuns.startedAt, startedAt));
    }
}
