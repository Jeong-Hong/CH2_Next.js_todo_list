import { createServerClient } from "@supabase/ssr";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// 현재 요청의 인증 쿠키를 갱신하고 화면 접근을 구분
export async function updateSession(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
        return NextResponse.json(
            { error: "Supabase 환경변수 설정이 필요합니다." },
            { status: 503, headers: { "Cache-Control": "private, no-store" } },
        );
    }

    // 갱신한 쿠키를 서버 렌더링 요청과 브라우저 응답에 함께 전달
    let response = NextResponse.next({ request });
    const supabase = createServerClient(url, key, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll(cookiesToSet, headers) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
                Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
            },
        },
    });

    // Auth 서버가 검증한 회원만 로그인 상태로 판단
    const { data: { user }, error } = await supabase.auth.getUser();
    response.headers.set("Cache-Control", "private, no-store");

    // 통신 실패를 로그아웃으로 오인하지 않고 각 화면에서 오류를 표시
    if (error && !isAuthSessionMissingError(error) && error.status !== 401 && error.status !== 403) {
        return response;
    }

    // Server Actions의 POST 요청은 해당 함수의 인증 검사로 처리
    if (request.method !== "GET" && request.method !== "HEAD") {
        return response;
    }

    const path = request.nextUrl.pathname;
    const destination = !user && path === "/"
        ? "/login"
        : user && (path === "/login" || path === "/signup") ? "/" : null;

    if (!destination) return response;

    // 리디렉션에도 인증 쿠키와 캐시 방지 헤더를 보존
    const target = request.nextUrl.clone();
    target.pathname = destination;
    target.search = "";
    const redirectResponse = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    ["cache-control", "expires", "pragma"].forEach((name) => {
        const value = response.headers.get(name);
        if (value) redirectResponse.headers.set(name, value);
    });
    return redirectResponse;
}
