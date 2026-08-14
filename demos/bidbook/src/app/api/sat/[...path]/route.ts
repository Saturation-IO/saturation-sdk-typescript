import { NextRequest, NextResponse } from "next/server";

const API_ORIGIN = process.env.SATURATION_API_URL ?? "http://localhost:4300";

function isAllowed(path: string[]): boolean {
  if (path.length === 2 && path[0] === "v1" && path[1] === "me") return true;
  if (path[0] !== "v1" || path[1] !== "projects") return false;

  return (
    path.length === 2 ||
    path.length === 3 ||
    (path.length === 5 && path[3] === "budget" && path[4] === "document") ||
    (path.length === 4 && path[3] === "comments")
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const hostedToken = process.env.SATURATION_API_TOKEN;

  if (!isAllowed(path)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const authorization = hostedToken
    ? `Bearer ${hostedToken}`
    : request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = new URL(`/${path.join("/")}`, API_ORIGIN);
  target.search = request.nextUrl.search;

  const response = await fetch(target, {
    headers: { authorization, accept: "application/json" },
    cache: "no-store",
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
