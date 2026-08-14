import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const token = process.env.SATURATION_API_TOKEN;
  const projectId = process.env.BIDBOOK_PROJECT_ID;

  if (!token || !projectId) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({ projectId });
}
