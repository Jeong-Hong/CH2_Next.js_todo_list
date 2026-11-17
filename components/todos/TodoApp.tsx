"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { createTodoAction, deleteTodoAction, listTodosAction, updateTodoAction } from "@/lib/todos/actions";
import { validateTodoTitle } from "@/lib/todos/validation";
import type { Todo, TodoResult } from "@/lib/todos/types";

type Props = { initialTodos: Todo[]; initialError: string | null };
type Filter = "all" | "active" | "completed";

export default function TodoApp({ initialTodos, initialError }: Props) {
    // DB가 확인한 목록과 아직 저장하지 않은 입력을 분리
    const [todos, setTodos] = useState(initialTodos);
    const [title, setTitle] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [error, setError] = useState(initialError);
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const requestInFlight = useRef(false);

    // 연속 클릭을 즉시 차단하고 실패하면 기존 목록과 입력을 유지
    async function run<T>(request: () => Promise<TodoResult<T>>, onSuccess: (data: T) => void) {
        if (requestInFlight.current) return;
        requestInFlight.current = true;
        setBusy(true);
        setError(null);
        setNotice("");
        try {
            const result = await request();
            if (!result.ok) {
                setError(result.error);
                return;
            }
            onSuccess(result.data);
        } catch {
            setError("요청을 완료하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.");
        } finally {
            requestInFlight.current = false;
            setBusy(false);
        }
    }

    // 제목 검사 후 서버가 저장한 항목만 목록에 추가
    function addTodo(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const titleError = validateTodoTitle(title);
        if (titleError) { setError(titleError); return; }
        void run(() => createTodoAction(title), (todo) => {
            setTodos((current) => [todo, ...current]);
            setTitle("");
            setNotice("할 일을 추가했습니다.");
        });
    }

    // 항목의 순서를 유지하면서 저장 결과로 교체
    function replaceTodo(todo: Todo) {
        setTodos((current) => current.map((item) => item.id === todo.id ? todo : item));
    }

    function saveTitle(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!editingId) return;
        const titleError = validateTodoTitle(editTitle);
        if (titleError) { setError(titleError); return; }
        void run(() => updateTodoAction(editingId, { title: editTitle }), (todo) => {
            replaceTodo(todo);
            setEditingId(null);
            setNotice("할 일을 수정했습니다.");
        });
    }

    // 사용자가 확인한 항목만 삭제 요청
    function removeTodo(todo: Todo) {
        if (!window.confirm(`“${todo.title}” 할 일을 삭제합니다. 계속하시겠습니까?`)) return;
        void run(() => deleteTodoAction(todo.id), (id) => {
            setTodos((current) => current.filter((item) => item.id !== id));
            if (editingId === id) setEditingId(null);
            setNotice("할 일을 삭제했습니다.");
        });
    }

    const visibleTodos = todos.filter((todo) => filter === "all" || (filter === "completed" ? todo.completed : !todo.completed));
    const completedCount = todos.filter((todo) => todo.completed).length;

    return (
        <section aria-label="할 일 관리" className="space-y-6" aria-busy={busy}>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <p>전체 {todos.length}개 · 미완료 {todos.length - completedCount}개 · 완료 {completedCount}개</p>
                <button type="button" disabled={busy} className="rounded border px-3 py-2 disabled:opacity-50"
                    onClick={() => void run(listTodosAction, (items) => {
                        setTodos(items);
                        setNotice("목록을 다시 불러왔습니다.");
                    })}>목록 새로고침</button>
            </div>

            {/* 요청과 입력 오류를 화면 읽기 프로그램에도 전달 */}
            {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
            <p role="status" className="text-sm">{busy ? "처리 중입니다." : notice}</p>

            <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
                <form onSubmit={addTodo} className="space-y-2">
                    <label htmlFor="new-todo" className="block font-medium">새 할 일</label>
                    <div className="flex gap-2">
                        <input id="new-todo" value={title} onChange={(event) => setTitle(event.target.value)}
                            aria-describedby="todo-help" className="min-w-0 flex-1 rounded border px-3 py-2"
                            placeholder="무엇을 해야 하나요?" />
                        <button type="submit" className="rounded bg-foreground px-4 py-2 text-background">추가</button>
                    </div>
                    <p id="todo-help" className="text-sm text-zinc-500 dark:text-zinc-400">앞뒤 공백을 제외하고 1~100글자를 입력합니다.</p>
                </form>

                {/* 필터는 저장된 원본 목록을 변경하지 않음 */}
                <div role="group" aria-label="할 일 필터" className="flex gap-2">
                    {([["all", "전체"], ["active", "미완료"], ["completed", "완료"]] as const).map(([value, label]) => (
                        <button key={value} type="button" aria-pressed={filter === value}
                            onClick={() => setFilter(value)}
                            className={`rounded border px-4 py-2 ${filter === value ? "bg-foreground text-background" : ""}`}>{label}</button>
                    ))}
                </div>

                {visibleTodos.length === 0 ? (
                    <p className="rounded border border-dashed p-8 text-center text-zinc-500 dark:text-zinc-400">
                        {todos.length === 0 ? "등록한 할 일이 없습니다." : "이 필터에 해당하는 할 일이 없습니다."}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {visibleTodos.map((todo) => (
                            <li key={todo.id} className="rounded-lg border p-4">
                                {editingId === todo.id ? (
                                    <form onSubmit={saveTitle} className="space-y-3">
                                        <label htmlFor={`edit-${todo.id}`} className="block text-sm">할 일 수정</label>
                                        <input id={`edit-${todo.id}`} value={editTitle}
                                            onChange={(event) => setEditTitle(event.target.value)}
                                            className="w-full rounded border px-3 py-2" autoFocus />
                                        <div className="flex gap-2">
                                            <button type="submit" className="rounded bg-foreground px-3 py-2 text-background">저장</button>
                                            <button type="button" className="rounded border px-3 py-2" onClick={() => setEditingId(null)}>취소</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex flex-wrap items-start gap-3">
                                        <label className="flex min-w-0 flex-1 items-start gap-3">
                                            <input type="checkbox" checked={todo.completed} className="mt-1 size-5 shrink-0"
                                                aria-label={`${todo.title} 완료`}
                                                onChange={() => void run(() => updateTodoAction(todo.id, { completed: !todo.completed }), (updated) => {
                                                    replaceTodo(updated);
                                                    setNotice("완료 상태를 변경했습니다.");
                                                })} />
                                            <span className={`min-w-0 break-words ${todo.completed ? "text-zinc-500 line-through" : ""}`}>{todo.title}</span>
                                        </label>
                                        <div className="flex gap-2 text-sm">
                                            <button type="button" className="rounded border px-3 py-2" onClick={() => {
                                                setEditingId(todo.id); setEditTitle(todo.title); setError(null);
                                            }} aria-label={`${todo.title} 수정`}>수정</button>
                                            <button type="button" className="rounded border px-3 py-2 text-red-600 dark:text-red-400"
                                                onClick={() => removeTodo(todo)} aria-label={`${todo.title} 삭제`}>삭제</button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </fieldset>
        </section>
    );
}
