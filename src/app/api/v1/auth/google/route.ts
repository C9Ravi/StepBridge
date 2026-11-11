import { NextRequest } from "next/server";
import { GET as googleGet } from "@/app/api/auth/google/route";

export async function GET(req: NextRequest) {
  return googleGet(req);
}
