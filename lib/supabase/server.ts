import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";

// 현재 요청에 사용할 서버용 Supabase 클라이언트를 준비
export async function createClient(canWriteCookies = false) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase 프로젝트 URL 또는 공개키가 없습니다.");
    }

    const cookieStore = await cookies();
// Supabase가 현재 요청의 쿠키를 읽을 방법을 등록
    const cookieMethods: CookieMethodsServer = {
        getAll() {
            return cookieStore.getAll();
        },
    };
// 쿠키 쓰기가 허용되면 저장 기능을 추가
    if (canWriteCookies) {
        cookieMethods.setAll = (cookiesToSet) => {
            // Supabase가 전달한 쿠키를 응답에 반영
            cookiesToSet.forEach(({ name, value, options}) => {
                cookieStore.set(name, value, options);
            });
        };
    }
// 쿠키 처리 설정이 연결된 서버용 클라이언트를 반환
    return createServerClient(supabaseUrl, supabaseKey, {
        cookies: cookieMethods,
    });
}