"use server";

import { revalidatePath } from "next/cache";
import { getGeneratorRepository } from "@/lib/repositories";
import {
    GeneratorType,
    GeneratorRecord,
    GeneratorRunRecord,
} from "@/lib/repositories/generatorRepository";

/* ─────────────────────────────────────────────────────────────── *
 *  All writes go through these actions → consistent, testable.    *
 *  They revalidate the “/generators” path so the server page      *
 *  automatically refetches and streams fresh HTML.                *
 * ─────────────────────────────────────────────────────────────── */

export interface GeneratorWithRun extends GeneratorRecord {
    lastRun: GeneratorRunRecord | null;
}

export async function listGenerators(): Promise<GeneratorWithRun[]> {
    const repo = getGeneratorRepository();
    const gens = await repo.list();
    const runs = await Promise.all(gens.map(g => repo.getLastRun(g.id)));
    return gens.map((g, i) => ({ ...g, lastRun: runs[i] ?? null }));
}

export async function createGenerator(name: string, type: GeneratorType) {
    const repo = getGeneratorRepository();
    await repo.create({ name, type });
    revalidatePath("/generators");
}

export async function updateGenerator(
    id: number,
    name: string,
    config: unknown,
) {
    const repo = getGeneratorRepository();
    await repo.update(id, { name, config });
    revalidatePath("/generators");
}

export async function deleteGenerator(id: number) {
    const repo = getGeneratorRepository();
    await repo.delete(id);
    revalidatePath("/generators");
}
