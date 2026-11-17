# 회원 전용 Todo 리스트

Next.js App Router와 Supabase로 구현한 프론트엔드 응용 과제입니다.

저장소: https://github.com/Jeong-Hong/CH2_Next.js_todo_list

## 구현 범위

- 이메일·비밀번호 회원가입, 로그인, 현재 브라우저 로그아웃
- 쿠키 기반 로그인 유지와 Proxy의 인증 갱신·접근 제어
- 회원별 할 일 추가·조회·제목 수정·완료 전환·삭제
- 전체·미완료·완료 필터와 최신 등록 순서
- 제목의 앞뒤 공백 제거와 1~100 코드 포인트 제한
- 삭제 확인, 빈 목록, 조회 실패·재시도, 중복 제출 차단
- 실패 시 입력 내용과 기존 목록 보존
- Supabase Auth의 회원 정보 관리와 todos 테이블의 RLS 소유권 검사

비회원 할 일, 소셜 로그인, 비밀번호 재설정, 별도 전역 상태 라이브러리는 포함하지 않습니다.
Vercel 프로젝트 생성·연결·배포는 이번 작업 범위에서 제외합니다.

## 기술 구성

- Next.js 16.4.6 · React 19 · TypeScript
- Tailwind CSS 4
- `@supabase/supabase-js` · `@supabase/ssr`
- Server Components의 초기 조회와 Server Actions의 인증·CRUD

## 로컬 실행

Node.js 24에서 확인했습니다.

1. 패키지를 설치합니다.

   ```bash
   npm ci
   ```

2. `.env.example`을 `.env.local`로 복사합니다.
3. Supabase 대시보드의 프로젝트 URL과 **Publishable key**를 `.env.local`에 입력합니다.
4. 아래 DB 구성과 Auth 설정을 확인합니다.
5. 개발 서버를 실행합니다.

   ```bash
   npm run dev
   ```

6. http://localhost:3000 에 접속합니다.

`.env.local`은 Git에서 제외합니다. Service role key와 Secret key는 사용하지 않습니다.
`NEXT_PUBLIC_` 변수는 브라우저에도 노출되는 공개 설정입니다.

## Supabase 준비

### DB 구성

새 Supabase 프로젝트에서는 SQL Editor에서 아래 파일을 순서대로 실행합니다.
이미 적용한 DB에서는 다시 실행하지 않습니다.

1. `supabase/sql/001_create_todos.sql` — 테이블과 RLS 활성화
2. `supabase/sql/002_validate_todo_title.sql` — 제목 길이·공백 제약
3. `supabase/sql/003_authorize_todos.sql` — 회원 권한과 소유권 정책

| 필드 | 자료형 | 역할 |
|---|---|---|
| `id` | uuid | 할 일 식별자 |
| `user_id` | uuid | `auth.users.id`를 참조하는 소유 회원 |
| `title` | text | 할 일 제목 |
| `completed` | boolean | 완료 여부 |
| `created_at` | timestamptz | 등록 시각 |

RLS를 끄지 않습니다. 로그인한 회원은 자기 데이터만 CRUD할 수 있도록 정책을 구성합니다.
앱의 Server Actions도 매 요청에서 회원을 검증합니다.
비밀번호는 Supabase Auth가 관리하며 앱 테이블에 저장하지 않습니다.

### Auth 설정

- 이메일·비밀번호 로그인을 활성화합니다.
- 현재 회원가입 흐름은 학습용 **Confirm email 비활성화** 설정을 전제로 합니다.
- 회원가입 비밀번호는 영문·숫자를 포함한 최소 8글자·최대 UTF-8 72바이트로 검사합니다.
- Supabase Auth에도 최소 길이와 요구 문자 설정을 맞춥니다.
- 이메일 확인이 켜져 있으면 자동 로그인하지 않습니다. 화면이 인증 설정 확인을 안내합니다.
- 공개 서비스에서 이메일 확인을 사용하려면 이메일 확인 콜백을 별도로 구현해야 합니다.

## 파일 역할

| 경로 | 책임 |
|---|---|
| `app/login`, `app/signup` | 인증 화면 |
| `components/auth` | 입력 폼과 로그아웃 버튼 |
| `lib/auth` | 인증 Server Actions와 입력 검사 |
| `proxy.ts`, `lib/supabase/proxy.ts` | 인증 쿠키 갱신과 접근 제어 |
| `lib/supabase/server.ts` | 요청별 서버 클라이언트 |
| `lib/todos` | 할 일 타입·검증·CRUD Server Actions |
| `components/todos/TodoDashboard.tsx` | 회원 확인·초기 DB 조회 |
| `components/todos/TodoApp.tsx` | 할 일 입력·목록·필터·오류 처리 |
| `supabase/sql` | 테이블·제약·권한 구성 |

## 작업 브랜치

각 작업 브랜치는 앞선 완료 커밋에 의존하여 순차적으로 분기합니다.
독립 PR용 브랜치가 아니라 작업 단계별 기준점입니다.

1. `feat/auth` — 기존 인증 작업 마무리
2. `feat/auth-proxy` — 회원 전용 접근과 인증 갱신
3. `feat/todo-actions` — 회원별 CRUD 서버 처리
4. `feat/todo-ui` — 할 일 화면과 필터
5. `fix/next-security` — Next.js 16.4.6 보안 패치
6. `docs/submission` — 실행·검증·제출 문서

`main`은 최종 제출본입니다.

## 검증 결과와 한계

- TypeScript `tsc --noEmit --incremental false` 통과
- 제목·식별자 경계값과 서버 소유권 지정·비회원 차단의 격리 검사 통과
- 로컬 모의 Supabase와 실제 Next.js·Chrome을 연결한 격리 브라우저 검사 통과
  - 가입·쿠키·회원 전용 이동·로그아웃
  - CRUD·새로고침 유지·필터·수정 취소·삭제 취소
  - 실패 시 입력 보존·재시도·요청 중 제출 차단·모바일 가로 넘침 확인
- Next.js 보안 패치 후 `npm audit --omit=dev`에서 운영 의존성 취약점 0건 확인

**실제 Supabase 검증은 미완료입니다.** 기존 로컬 설정의 프로젝트가 `ENOTFOUND`로 연결되지 않았습니다.
모의 서버의 결과는 실제 Supabase 저장·RLS·토큰 만료 후 갱신을 보장하지 않습니다.
프로젝트 연결 복구 후 실제 계정 A·B와 비회원의 CRUD 허용·차단을 확인해야 합니다.
원격 DB를 변경하거나 기존 사용자 데이터를 삭제하지 않았습니다.

이 프로젝트의 기존 검사 합의에 따라 lint·프로덕션 build는 이번에 실행하지 않았습니다.
따라서 Vercel 배포 가능 여부까지 검증한 상태는 아닙니다.

## 참고 교안

개인 노션의 「프론트엔드 응용 (React/Next.js)」에서 아래 내용을 참고했습니다.

- 7장 2강: Supabase DB 연동·CRUD
- 7장 3강: Supabase Auth·쿠키 동기화·RLS
- 7장 4강: 환경변수 보안·GitHub 업로드·Vercel 배포 준비

교안의 Middleware는 현재 Next.js의 `proxy.ts` 규칙에 맞췄습니다.
교안 예제의 `is_completed` 대신 기존 DB의 `completed` 필드를 유지합니다.
개인 노션 원문과 이미지·자격정보는 저장소에 포함하지 않습니다.
