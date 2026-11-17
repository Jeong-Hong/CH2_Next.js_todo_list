import { Suspense } from "react";
import AuthStatus from "@/lib/auth/AuthStatus";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">나의 할 일</h1>
      {/* 요청별 인증 정보는 공용 캐시 밖에서 확인 */}
      <Suspense fallback={<p role="status">로그인 상태를 확인합니다.</p>}>
        <AuthStatus />
      </Suspense>
    </main>
  );
}
