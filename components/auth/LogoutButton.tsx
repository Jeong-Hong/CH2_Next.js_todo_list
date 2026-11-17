'use client'

import { useActionState } from "react";

// 로그아웃 실패 시 화면에 반환할 결과를 정의

export type LogoutState = {
    formError: string | null;
};

// 서버에서 전달받을 로그아웃 함수의 형태를 정의
type LogoutButtonProps = {
    showButton: boolean;
    action: (
        previousState: LogoutState,
        formData: FormData,
    ) => Promise<LogoutState>;
};

// 아직 요청하지 않은 버튼의 초기 결과를 준비
const initialState: LogoutState = {
    formError: null,
};

export default function LogoutButton({ action, showButton }: LogoutButtonProps) {
    // 로그아웃 함수와 처리 결과를 폼에 연결
    const [state, formAction, pending] = useActionState(
        action,
        initialState,
    );

    return (
        <form action={formAction} className="space-y-2">
            {/* 요청 중에는 추가 제출을 막음 */}
            {showButton && (
                <button
                    type='submit'
                    disabled={pending}
                    className="rounded border px-4 py-2 disabled:opacity-50"
                >
                    {pending ? "로그아웃 중..." : "로그아웃"}
                </button>
            )}

            {/* 로그아웃 실패 안내를 표시 */}
            <p
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
            >
                {state.formError}
            </p>
        </form>
    );
}