// DB와 같은 코드 포인트 기준으로 제목을 검사
export function validateTodoTitle(value: unknown): string | null {
    if (typeof value !== "string" || !value.trim()) {
        return "할 일을 입력해 주세요.";
    }
    if ([...value.trim()].length > 100) {
        return "할 일은 100글자 이하로 입력해 주세요.";
    }
    return null;
}

// 잘못된 식별자를 DB 요청 전에 차단
export function isTodoId(value: unknown): value is string {
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
