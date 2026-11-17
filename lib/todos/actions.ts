"use server";

import { createClient } from "@/lib/supabase/server";
import { isTodoId, validateTodoTitle } from "./validation";
import type { Todo, TodoResult } from "./types";

const columns = "id,title,completed,created_at";
const connectionError = "요청을 완료하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.";

// 모든 요청에서 현재 회원을 다시 확인
async function authenticatedClient() {
    const supabase = await createClient(true);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { supabase, user };
}

// 현재 회원의 할 일을 등록 순서로 조회
export async function listTodosAction(): Promise<TodoResult<Todo[]>> {
    try {
        const auth = await authenticatedClient();
        if (!auth) return { ok: false, error: "로그인 상태를 확인한 뒤 다시 시도해 주세요." };
        const { data, error } = await auth.supabase.from("todos")
            .select(columns).eq("user_id", auth.user.id)
            .order("created_at", { ascending: false }).order("id", { ascending: false });
        if (error) return { ok: false, error: connectionError };
        return { ok: true, data: data ?? [] };
    } catch {
        return { ok: false, error: connectionError };
    }
}

// 소유 회원은 폼 입력이 아니라 검증한 인증 정보로 지정
export async function createTodoAction(title: unknown): Promise<TodoResult<Todo>> {
    const titleError = validateTodoTitle(title);
    if (titleError) return { ok: false, error: titleError };
    try {
        const auth = await authenticatedClient();
        if (!auth) return { ok: false, error: "로그인한 뒤 다시 시도해 주세요." };
        const { data, error } = await auth.supabase.from("todos")
            .insert({ user_id: auth.user.id, title: (title as string).trim() })
            .select(columns).single();
        if (error || !data) return { ok: false, error: connectionError };
        return { ok: true, data };
    } catch {
        return { ok: false, error: connectionError };
    }
}

// 제목과 완료 여부만 수정하고 실제 변경된 행을 반환
export async function updateTodoAction(
    id: unknown,
    changes: { title?: unknown; completed?: unknown },
): Promise<TodoResult<Todo>> {
    if (!isTodoId(id) || !changes || typeof changes !== "object" || Array.isArray(changes)) {
        return { ok: false, error: "수정할 할 일을 확인해 주세요." };
    }
    const patch: { title?: string; completed?: boolean } = {};
    if ("title" in changes) {
        const titleError = validateTodoTitle(changes.title);
        if (titleError) return { ok: false, error: titleError };
        patch.title = (changes.title as string).trim();
    }
    if ("completed" in changes) {
        if (typeof changes.completed !== "boolean") return { ok: false, error: "완료 상태를 확인해 주세요." };
        patch.completed = changes.completed;
    }
    if (Object.keys(patch).length === 0) return { ok: false, error: "수정할 내용을 입력해 주세요." };
    try {
        const auth = await authenticatedClient();
        if (!auth) return { ok: false, error: "로그인한 뒤 다시 시도해 주세요." };
        const { data, error } = await auth.supabase.from("todos").update(patch)
            .eq("id", id).eq("user_id", auth.user.id).select(columns).single();
        if (error || !data) return { ok: false, error: "할 일을 수정하지 못했습니다. 목록을 다시 확인해 주세요." };
        return { ok: true, data };
    } catch {
        return { ok: false, error: connectionError };
    }
}

// 소유권이 확인된 행을 실제 삭제했을 때만 성공을 반환
export async function deleteTodoAction(id: unknown): Promise<TodoResult<string>> {
    if (!isTodoId(id)) return { ok: false, error: "삭제할 할 일을 확인해 주세요." };
    try {
        const auth = await authenticatedClient();
        if (!auth) return { ok: false, error: "로그인한 뒤 다시 시도해 주세요." };
        const { data, error } = await auth.supabase.from("todos").delete()
            .eq("id", id).eq("user_id", auth.user.id).select("id").single();
        if (error || !data) return { ok: false, error: "할 일을 삭제하지 못했습니다. 목록을 다시 확인해 주세요." };
        return { ok: true, data: data.id };
    } catch {
        return { ok: false, error: connectionError };
    }
}
