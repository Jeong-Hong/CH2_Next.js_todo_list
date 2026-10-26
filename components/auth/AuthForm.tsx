"use client";

import Link from "next/link";
import { useActionState, useState, type SubmitEvent } from "react";
import {
    loginAction,
    signupAction,
    type AuthActionState,
} from "@/lib/auth/actions";
import {
    validateEmail,
    validateLoginPassword,
    validateSignupPassword,
    validatePasswordConfirm,
} from "@/lib/auth/validation";

// 페이지에서 전달할 폼의 용도를 정의
type AuthFormProps = {
    mode: 'login' | 'signup';
};

 // 아직 요청하지 않은 폼의 초기 결과를 준비
const initialState: AuthActionState = {
    fieldErrors: {},
    formError: null,
};

export default function AuthForm({ mode }: AuthFormProps) {
    // 폼의 용도에 따라 서버 함수를 선택
    const isSignup = mode === 'signup';
    const action = isSignup ? signupAction : loginAction;
    // 폼의 용도에 맞는 제출 문구를 준비
    const submitLabel = isSignup ? '회원가입' : '로그인';
    const pendingLabel = isSignup ? '가입 중...' : '로그인 중...';
    // 입력값을 화면의 상태로 관리
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // 회원가입의 비밀번호 확인 입력값을 관리
    const [passwordConfirm, setPasswordConfirm] = useState('');
    
    // 브라우저에서 발견한 입력 오류를 관리
    const [clientState, setClientState] =
        useState<AuthActionState | null>(null);

    // 서버 처리 결과와 제출 상태를 연결
    const [state, formAction, pending] = useActionState(
        action,
        initialState,
    );

    // 브라우저 오류가 없으면 서버 처리 결과를 표시
    const displayState = clientState ?? state;

    // 폼 제출 전에 화면의 입력값을 검사
    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        // 요청 중에 들어온 추가 제출을 차단
        if (pending) {
            event.preventDefault();
            return;
        }

        // 폼의 용도에 맞는 입력 규칙을 적용
        const fieldErrors = {
            email: validateEmail(email),
            password: isSignup
                ? validateSignupPassword(password)
                : validateLoginPassword(password),
            passwordConfirm: isSignup
                ? validatePasswordConfirm(password, passwordConfirm)
                : null,
        };

        // 입력 오류가 있으면 서버 제출을 중단
        if (
            fieldErrors.email ||
            fieldErrors.password ||
            fieldErrors.passwordConfirm
        ) {
            event.preventDefault();

            setClientState({
                fieldErrors,
                formError: null,
            });
            
            return;
        }

        // 입력이 통과하면 서버 처리 결과를 표시하도록 전환
        setClientState(null);

    }

    return (
        <form action={formAction}
            onSubmit={handleSubmit}
            noValidate
            className='space-y-4'>
            {/* 요청 중에는 입력값을 변경하지 못하게 함. */}
            <fieldset disabled={pending} className="space-y-4">
                {/* 이메일 입력과 해당 오류를 표시 */}
                <div className="space-y-1">
                    <label htmlFor="email" className="block">
                        이메일
                    </label>
                    <input
                        id='email'
                        name='email'
                        type='email'
                        autoComplete='username'
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        aria-invalid={Boolean(displayState.fieldErrors.email)}
                        aria-describedby='email-error'
                        className="w-full rounded border px-3 py-2"
                        />
                        <p
                            id='email-error'
                            aria-live='polite'
                            className="text-sm text-red-600 dark:text-red-400"
                        >
                            {displayState.fieldErrors.email}
                        </p>
                </div>

                {/* 비밀번호 입력과 해당 오류를 표시 */}
                <div className="space-y-1">
                    <label htmlFor='password' className="block">
                        비밀번호
                    </label>
                    <input
                        id='password'
                        name='password'
                        type='password'
                        autoComplete={isSignup ? 'new-password' : 'current-password'}
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        aria-invalid={Boolean(displayState.fieldErrors.password)}
                        aria-describedby='password-error'
                        className="w-full rounded border px-3 py-2"
                        />
                        <p
                            id='password-error'
                            aria-live='polite'
                            className="text-sm text-red-600 dark:text-red-400"
                        >
                            {displayState.fieldErrors.password}
                        </p>
                </div>
                { /* 회원가입에서만 비밀번호 확인 입력을 표시 */ }
                {isSignup && (
                    <div className="space-y-1">
                        <label htmlFor="passwordConfirm" className="block">
                            비밀번호 확인
                        </label>
                        <input 
                            id="passwordConfirm"
                            name="passwordConfirm"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={passwordConfirm}
                            onChange={(event) => setPasswordConfirm(event.target.value)}
                            aria-invalid={Boolean(displayState.fieldErrors.passwordConfirm)}
                            aria-describedby='passwordConfirm-error'
                            className="w-full rounded border px-3 py-2"
                            />
                            <p
                                id="passwordConfirm-error"
                                aria-live="polite"
                                className="text-sm text-red-600 dark:text-red-400"
                            >
                                {displayState.fieldErrors.passwordConfirm}
                            </p>
                    </div>
                )}
            </fieldset>

            {/* 폼 전체의 처리 오류를 표시 */}
            <p
                role='alert'
                className="text-sm text-red-600 dark:text-red-400"
            >
                {displayState.formError}
            </p>

            {/* 요청 중에는 제출 버튼을 비활성화 */}
            <button
                type='submit'
                disabled={pending}
                className="w-full rounded bg-foreground px-4 py-2 text-background disabled:opacity-50"
            >
                {pending ? pendingLabel : submitLabel}
            </button>

            {/* 로그인과 회원가입 화면 사이의 이동 링크를 표시 */}
            <Link href={isSignup ? '/login' : '/signup'} className="block text-center underline">
                {isSignup ? '로그인' : '회원가입'}
            </Link>
        </form>
    );
}