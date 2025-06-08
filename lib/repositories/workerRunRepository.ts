export interface WorkerRunRecord {
    startedAt: Date;
    endedAt: Date | null;
    lastUpdate: Date;
    numGenerators: number;
    successCount: number;
    failCount: number;
    postCount: number;
    failedIds: number[];
}

export function workerRunRecordFromJson(
    obj: Record<string, unknown>,
): WorkerRunRecord {
    return {
        ...obj,
        startedAt: new Date(obj.startedAt as string),
        endedAt: obj.endedAt ? new Date(obj.endedAt as string) : null,
        lastUpdate: new Date(obj.lastUpdate as string),
    } as WorkerRunRecord;
}

export interface IWorkerRunRepository {
    /** Return the most recent run or null if none exist */
    getLast(): Promise<WorkerRunRecord | null>;

    /** List runs ordered by start time descending */
    list(limit: number, offset: number): Promise<WorkerRunRecord[]>;

    /** Start tracking a new run */
    create(run: { startedAt: Date; numGenerators: number }): Promise<void>;

    /** Update an existing run */
    update(
        startedAt: Date,
        patch: Partial<Omit<WorkerRunRecord, "startedAt">>,
    ): Promise<void>;

    /** Mark a run as finished */
    finish(startedAt: Date, endedAt: Date): Promise<void>;
}
