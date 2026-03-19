import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateApi, withRequestId } from "@/lib/api-utils";

export async function GET() {
  const [user, errorRes] = await authenticateApi();
  if (errorRes) return errorRes;

  // Find all jobs with both scheduledDate and estimatedEnd, grouped by crew
  const jobs = await prisma.job.findMany({
    where: {
      companyId: user.companyId,
      crewId: { not: null },
      scheduledDate: { not: null },
      estimatedEnd: { not: null },
      status: { in: ["active", "scheduled", "paused"] },
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      scheduledDate: true,
      estimatedEnd: true,
      crewId: true,
      crew: { select: { id: true, name: true } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  // Group jobs by crew
  const crewJobs: Record<string, typeof jobs> = {};
  for (const job of jobs) {
    const cid = job.crewId!;
    if (!crewJobs[cid]) crewJobs[cid] = [];
    crewJobs[cid].push(job);
  }

  // Find overlapping pairs
  const conflicts: {
    crew: { id: string; name: string };
    jobs: { id: string; title: string; scheduledDate: string | null; estimatedEnd: string | null }[];
    overlapDays: number;
  }[] = [];

  for (const [, crewJobList] of Object.entries(crewJobs)) {
    for (let i = 0; i < crewJobList.length; i++) {
      for (let j = i + 1; j < crewJobList.length; j++) {
        const a = crewJobList[i];
        const b = crewJobList[j];
        const aStart = a.scheduledDate!.getTime();
        const aEnd = a.estimatedEnd!.getTime();
        const bStart = b.scheduledDate!.getTime();
        const bEnd = b.estimatedEnd!.getTime();

        // Check overlap: A starts before B ends AND B starts before A ends
        if (aStart < bEnd && bStart < aEnd) {
          const overlapStart = Math.max(aStart, bStart);
          const overlapEnd = Math.min(aEnd, bEnd);
          const overlapDays = Math.max(1, Math.ceil((overlapEnd - overlapStart) / 86400000));
          conflicts.push({
            crew: a.crew!,
            jobs: [
              { id: a.id, title: a.title, scheduledDate: a.scheduledDate?.toISOString() ?? null, estimatedEnd: a.estimatedEnd?.toISOString() ?? null },
              { id: b.id, title: b.title, scheduledDate: b.scheduledDate?.toISOString() ?? null, estimatedEnd: b.estimatedEnd?.toISOString() ?? null },
            ],
            overlapDays,
          });
        }
      }
    }
  }

  return withRequestId(NextResponse.json({ conflicts }));
}
