'use server';

import { revalidatePath } from 'next/cache';
import { getGeneratorRepository } from '@/lib/repositories';
import { GeneratorType } from '@/lib/repositories/generatorRepository';

/* ─────────────────────────────────────────────────────────────── *
 *  All writes go through these actions → consistent, testable.    *
 *  They revalidate the “/generators” path so the server page      *
 *  automatically refetches and streams fresh HTML.                *
 * ─────────────────────────────────────────────────────────────── */

export async function listGenerators() {
    const repo = getGeneratorRepository();
    return await repo.list();
}

export async function createGenerator(name: string, type: GeneratorType) {
    const repo = getGeneratorRepository();
    await repo.create({ name, type });
    revalidatePath('/generators');
}

export async function updateGenerator(
  id: string,
  name: string,
  config: unknown,
) {
    const repo = getGeneratorRepository();
    await repo.update(id, { name, config });
    revalidatePath('/generators');
}

export async function deleteGenerator(id: string) {
    const repo = getGeneratorRepository();
    await repo.delete(id);
    revalidatePath('/generators');
}

