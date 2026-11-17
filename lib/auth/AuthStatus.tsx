import Link from "next/link";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { logoutAction, refreshAuthAction } from "./actions";
import { createClient } from "../supabase/server";
import LogoutButton from "@/components/auth/LogoutButton";

// 현재 요청의 인증 상태를 확인해 화면에 표시
export default async function AuthStatus() {
    // 요청 쿠키를 읽는 서버용 클라이언트 준비
    const supabase = await createClient();

    // Supabase Auth에서 회원 정보를 확인
    const { data, error} = await supabase.auth.getUser();

    // 세션 없음과 인증 상태 확인 실패를 구분
    const hasAuthError = error !== null && !isAuthSessionMissingError(error);

    // 확인에 실패하면 회원 정보를 표시하지 않음
    const user = hasAuthError ? null : data.user;

    return (
        <section className="space-y-4">
            <div className="space-y-3">
                {/* 조회 실패는 재확인 방법을 표시*/}
                {hasAuthError && (
                    <div className="space-y-2">
                        <p role="alert">
                            로그인 상태를 확인하지 못했습니다.
                        </p>
                        <form action={refreshAuthAction}>
                            <button
                                type='submit'
                                className="rounded border px-4 py-2"
                                >
                                    다시 확인
                            </button>
                        </form>
                    </div>
                )}

                {/* 확인된 정보를 표시 */}
                {!hasAuthError && user &&(
                    <div className="space-y-1">
                        <p>로그인 상태입니다.</p>
                        <p>{user.email ?? "이메일 정보 없음"}</p>
                    </div>
                )}

                {/* 비회원에게 인증 화면의 항목을 표시 */}
                {!hasAuthError && !user && (
                    <div className="space-y-2">
                        <p>로그인하지 않은 상태 입니다.</p>
                        <div className="flex gap-4">
                            <Link href='/login' className="underline">
                            로그인
                            </Link>
                            <Link href='/signup' className="underline">
                            회원가입
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* 인증 상태가 바뀌어도 로그아웃 결과 표시를 유지 */}
            <LogoutButton
                action={logoutAction}
                showButton={Boolean(user)}/>
        </section>
    )
}