import AuthForm from "@/components/auth/AuthForm";

// 로그인 화면에 제목과 입력 폼을 배치
export default function LoginPage() {
    return (
        <main className="mx-auto w-full max-w-md px-6 py-12">
            <h1 className="mb-6 text-2xl font-semibold">
                로그인
            </h1>

            <AuthForm mode="login"/>
        </main>
    );
}