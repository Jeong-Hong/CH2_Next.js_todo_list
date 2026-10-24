import { createBrowserClient } from "@supabase/ssr";

// 브라우저에서 사용할 Supabase 클라이언트를 준비
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase 프로젝트 URL 또는 공개키가 없습니다.");
    }

    return createBrowserClient(supabaseUrl, supabaseKey);
}