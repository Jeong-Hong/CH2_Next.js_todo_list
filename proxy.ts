import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// 인증 대상 화면에서 세션을 갱신
export async function proxy(request: NextRequest) {
    return updateSession(request);
}

export const config = {
    matcher: ["/", "/login", "/signup"],
};
