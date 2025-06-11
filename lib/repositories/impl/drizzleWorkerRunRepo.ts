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
    }): Promise<number> {
        const res = await db.insert(workerRuns).values({
            startedAt: run.startedAt,
            lastUpdate: run.startedAt,
            numGenerators: run.numGenerators,
            successCount: 0,
            failCount: 0,
            postCount: 0,
            failedIds: [],
        }).returning({id: workerRuns.id});
        return res[0].id;
    }

    async update(
        id: number,
        patch: Partial<Omit<WorkerRunRecord, "startedAt">>,
    ): Promise<void> {
        const changes: Partial<WorkerRunRecord> = { ...patch };
        console.log("update", id, changes);
        await db
            .update(workerRuns)
            .set(changes)
            .where(eq(workerRuns.id, id))
            .execute();
        const readback = await db.select()
            .from(workerRuns)
            .where(eq(workerRuns.id, id))
            .all();
        console.log('readback', readback);
    }

    async finish(id: number, endedAt: Date): Promise<void> {
        await db
            .update(workerRuns)
            .set({ endedAt, lastUpdate: endedAt })
            .where(eq(workerRuns.id, id));
    }
}
