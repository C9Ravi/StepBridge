import { NextRequest } from "next/server";
import { GET as googleCallbackGet } from "@/app/api/auth/callback/google/route";

export async function GET(req: NextRequest) {
  return googleCallbackGet(req);
}
