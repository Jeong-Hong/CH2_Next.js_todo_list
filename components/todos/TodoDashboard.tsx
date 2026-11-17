import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction, refreshAuthAction } from "@/lib/auth/actions";
import LogoutButton from "@/components/auth/LogoutButton";
import TodoApp from "./TodoApp";

// 화면 진입에서도 인증을 확인하고 해당 회원의 목록만 전달
export default async function TodoDashboard() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 인증 서버 장애를 비회원 상태로 확정하지 않음
    if (authError && !isAuthSessionMissingError(authError)) {
        return <section className="space-y-4">
            <p role="alert">로그인 상태를 확인하지 못했습니다. 연결 상태를 확인해 주세요.</p>
            <form action={refreshAuthAction}><button className="rounded border px-4 py-2">다시 확인</button></form>
        </section>;
    }
    if (!user) redirect("/login");

    const { data, error } = await supabase.from("todos")
        .select("id,title,completed,created_at").eq("user_id", user.id)
        .order("created_at", { ascending: false }).order("id", { ascending: false });

    return <div className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <p className="min-w-0 break-all text-sm">{user.email}</p>
            <LogoutButton action={logoutAction} showButton />
        </header>
        {/* 회원이 달라지면 이전 회원의 화면 상태를 재사용하지 않음 */}
        <TodoApp key={user.id} initialTodos={data ?? []}
            initialError={error ? "할 일을 불러오지 못했습니다. 목록 새로고침으로 다시 시도해 주세요." : null} />
    </div>;
}
