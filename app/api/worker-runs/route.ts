import { NextRequest, NextResponse } from "next/server";
import {
    getWorkerRunRepository,
    getGeneratorRepository,
} from "@/lib/repositories";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(
        parseInt(searchParams.get("limit") ?? "20", 10),
        100,
    );
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const withErrors = searchParams.get("withErrors") === "1";

    const repo = getWorkerRunRepository();
    const genRepo = getGeneratorRepository();
    const page = await repo.list(limit, offset);

    let errors:
        | Record<string, { id: number; name: string; error: string }[]>
        | undefined;
    if (withErrors && page.length > 0) {
        errors = {};
        for (const run of page) {
            const rows = await genRepo.listRunErrors(run.startedAt);
            if (rows.length) {
                errors[run.startedAt.getTime()] = rows;
            }
        }
    }

    return NextResponse.json({
        page,
        errors,
        next: page.length < limit ? null : offset + page.length,
    });
}
