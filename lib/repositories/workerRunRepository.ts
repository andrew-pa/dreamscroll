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

export function workerRunRecordFromJson(obj: {
    startedAt: string;
    endedAt: string | null;
    lastUpdate: string;
    numGenerators: number;
    successCount: number;
    failCount: number;
    postCount: number;
    failedIds: number[];
}): WorkerRunRecord {
    return {
        ...obj,
        numGenerators: obj.numGenerators,
        successCount: obj.successCount,
        failCount: obj.failCount,
        postCount: obj.postCount,
        failedIds: obj.failedIds,
        startedAt: new Date(obj.startedAt),
        endedAt: obj.endedAt ? new Date(obj.endedAt) : null,
        lastUpdate: new Date(obj.lastUpdate),
    } as WorkerRunRecord;
}

export interface IWorkerRunRepository {
    /** Return the most recent run or null if none exist */
    getLast(): Promise<WorkerRunRecord | null>;

    /** List runs ordered by start time descending */
    list(limit: number, offset: number): Promise<WorkerRunRecord[]>;

    /** Start tracking a new run */
    create(run: { startedAt: Date; numGenerators: number }): Promise<number>;

    /** Update an existing run */
    update(
        id: number,
        patch: Partial<Omit<WorkerRunRecord, "startedAt">>,
    ): Promise<void>;

    /** Mark a run as finished */
    finish(id: number, endedAt: Date): Promise<void>;
}
