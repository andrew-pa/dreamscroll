import { getWorkerRunRepository } from "@/lib/repositories";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const repo = getWorkerRunRepository();
    const run = await repo.getLast();
    return NextResponse.json(run);
}
