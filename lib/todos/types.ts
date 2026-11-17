// Supabase todos 테이블에서 화면에 전달할 값
export type Todo = {
    id: string;
    title: string;
    completed: boolean;
    created_at: string;
};

// 성공 데이터와 사용자에게 표시할 실패 안내를 구분
export type TodoResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };
