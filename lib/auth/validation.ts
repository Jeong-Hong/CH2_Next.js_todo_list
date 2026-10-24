// 이메일의 기본 형식을 검사
export function validateEmail(email: string): string | null {
    // 앞뒤 공백을 제거한 값으로 검사
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
        return "이메일을 입력해 주세요."
    }

    const emailPattern = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
        return "이메일 형식을 확인해 주세요";
    }

    return null;
}

// 로그인 비밀번호는 입력 여부만 검사
export function validateLoginPassword(password: string): string | null {
    if (!password) {
        return "비밀번호를 입력해 주세요"
    }

    return null;
}

// 회원가입 비밀번호의 길이와 필수 문자를 검사
export function validateSignupPassword(password: string): string | null {
    //공통으로 필요한 지빌번호 입력 여부를 먼저 검사
    const requiredError = validateLoginPassword(password);

    if (requiredError) {
        return requiredError;
    }

    // 최소 길이는 코드 포인트 기준으로 검사
    const characterCount = [...password].length;

    if (characterCount < 8) {
        return "비밀번호는 8글자 이상 입력해 주세요.";
    }

    // 최대 크기는 UTF-8 바이트 기준으로 검사
    const byteLength = new TextEncoder().encode(password).length;

    if (byteLength > 72) {
        return "비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요."
    }

    // 영문과 숫자를 각각 하나 이상 포함하는지 검사
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return "비밀번호에 영문과 숫자를 각각 하나 이상 포함해 주세요.";
    }
    
    return null;
}

// 비밀번호 확인 값이 원래 비밀번호와 같은지 검사
export function validatePasswordConfirm(
    password: string,
    passwordConfirm: string,
): string | null {
    if (!passwordConfirm) {
        return "비밀번호 확인을 입력해 주세요.";
    }

    if (password !== passwordConfirm) {
        return "비밀번호가 일치하지 않습니다.";
    }

    return null;
}