'use server';

import { redirect } from 'next/navigation';
import { refresh } from 'next/cache';
import type { LogoutState } from '@/components/auth/LogoutButton';
import { createClient } from '@/lib/supabase/server';
import {
    validateEmail,
    validateLoginPassword,
    validateSignupPassword,
    validatePasswordConfirm,
} from '@/lib/auth/validation';

// 폼에 반환할 오류 결과의 구조를 정의
export type AuthActionState = {
    fieldErrors: {
        email?: string | null;
        password?: string | null;
        passwordConfirm?: string | null;
    };
    formError: string | null;
};

// 폼에서 문자열 입력값만 읽음
function readFormString(formData: FormData, name: string): string {
    const value = formData.get(name);

    return typeof value === "string" ? value : "";
}

// 입력값을 검사한 뒤 Supabase에 로그인을 요청
export async function loginAction(
    _previousState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    // 로그인 요청에 사용할 입력값을 준비
    const email = readFormString(formData, "email").trim();
    const password = readFormString(formData, "password");

    //서버에서도 이메일과 비밀번호를 검사
    const fieldErrors = {
        email: validateEmail(email),
        password: validateLoginPassword(password),
    };

    // 입력 오류가 있으면 인증 요청을 보내지 않음
    if (fieldErrors.email || fieldErrors.password) {
        return {
            fieldErrors,
            formError: null,
        };
    }
    
    try {
        // 인증 쿠키를 저장할 수 있는 클라이언트를 준비
        const supabase = await createClient(true);

        // 이메일과 비밀번호로 로그인을 요청
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // 인증 실패를 화면에 표시할 안내로 바꿈
        if (error) {
            let formError =
            '로그인 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';

            if (error.status === 429) {
                formError = '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
            } else if (error.code === 'invalid_credentials') {
                formError = '이메일 또는 비밀번호가 올바르지 않습니다.';
            }

            return {
                fieldErrors: {},
                formError,
            };
        }
    } catch {
        // 요청 처리 중 발생한 예외를 실패 결과로 반환
        return {
            fieldErrors: {},
            formError:
            '로그인 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
        };
    }

    // 로그인에 성공하면 첫 화면으로 이동
    redirect("/")
}

// 입력값을 검사한 뒤 Supabase에 회원가입을 요청
export async function signupAction(
    _previousState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    // 회원가입 요청에 사용할 입력값을 준비
    const email = readFormString(formData, "email").trim();
    const password = readFormString(formData, "password");
    const passwordConfirm = readFormString(formData, "passwordConfirm");

    // 서버에서도 회원가입 입력 규칙을 검사
    const fieldErrors = {
        email: validateEmail(email),
        password: validateSignupPassword(password),
        passwordConfirm: validatePasswordConfirm(password, passwordConfirm),
    };

    // 입력 오류가 있으면 회원가입 요청을 보내지 않음
    if (
        fieldErrors.email ||
        fieldErrors.password ||
        fieldErrors.passwordConfirm
    ) {
        return {
            fieldErrors,
            formError: null,
        };
    }
    
    try {
        // 인증 쿠키를 저장할 수 있는 클라이언트를 준비
        const supabase = await createClient(true);

        // 이메일과 비밀번호로 회원가입을 요청
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        // 가입 실패를 화면에 표시할 안내로 바꿈
        if (error) {
            let formError =
                '회원가입을 완료하지 못했습니다. 입력 정보를 확인하거나 잠시 후 다시 시도해 주세요.';
            
            if (error.status === 429) {
                formError = '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
            }
            
            return {
                fieldErrors: {},
                formError,
            };
        }

        // 로그인 상태가 없으면 첫 화면으로 이동하지 않음
        if (!data.session) {
            return {
                fieldErrors: {},
                formError:
                '로그인 상태를 받지 못했습니다. 이메일 인증 설정을 확인하거나 로그인해 주세요.'
            };
        }
    } catch {
        // 요청 처리 중 발생한 예외를 실패 결과로 반환
        return {
            fieldErrors: {},
            formError:
            '회원가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        };
    }

    // 가입 후 로그인 상태를 받으면 첫 화면으로 이동
    redirect("/");
}

// 현재 요청의 세션을 로그아웃
export async function logoutAction(
    _previousState: LogoutState,
    _formData: FormData,
): Promise<LogoutState> {
    // 오류가 발생 했을 때 반환할 문구를 준비
    let formError : string | null = null;

    try {
        // 인증 쿠키를 변경할 수 있는 클라이언트를 준비
        const supabase = await createClient(true);

        // 다른 세션을 유지하고 현재 세션만 종료
        const { error } = await supabase.auth.signOut({
            scope: 'local',
        });

        // 로그아웃 오류를 화면에 표시할 문구로 바꿈
        if (error) {
            formError = "로그아웃 요청을 완료하지 못했습니다. 현재 로그인 상태를 다시 확인해 주세요."
        }
    } catch {
        // 요청 처리 중 발생한 에외를 실패 안내로 바꿈
        formError = "로그아웃 요청을 완료하지 못했습니다. 현재 로그인 상태를 다시 확인해 주세요."
    }

    // 성공 여부와 관계없이 현재 화면의 서버 결과를 갱신
    refresh();

    // 성공하면 이전 오류를 지우고 실패하면 안내를 표시
    return {
        formError,
    };
}

// 인증 상태 확인을 다시 요청
export async function refreshAuthAction(): Promise<void> {
    refresh();
}