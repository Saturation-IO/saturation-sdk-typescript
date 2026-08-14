import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const token = process.env.SATURATION_API_TOKEN;

  if (!token) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json({ hosted: true });
}
