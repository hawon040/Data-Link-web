# RANPICK

매일 정오, 백석대 학우 한 명과 1:1로 연결되는 모바일 웹.
24시간 동안 각자 20개까지 대화하고, 둘 다 원하면 카카오톡 ID를 교환한다.

- 기획서: [docs/PLANNING.md](docs/PLANNING.md)
- 결정 기록: [docs/DECISIONS.md](docs/DECISIONS.md)
- 법적 검토: [docs/LEGAL.md](docs/LEGAL.md)

## 스택

Next.js 15 (App Router) · Tailwind CSS 4 · Supabase (Auth, Postgres, Realtime, pg_cron) · Vercel

## 시작하기

```bash
npm install
cp .env.example .env.local   # Supabase URL·키 입력
npm run dev                  # http://localhost:3000
```

### Supabase 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/`의 SQL 파일을 날짜 순서대로 하나씩 실행 (또는 `supabase db push`)
3. Database → Extensions에서 `pg_cron` 켜고 매일 매칭 등록
   ```sql
   select cron.schedule('daily-matching', '50 2 * * *', $$select public.run_daily_matching()$$);
   -- 02:50 UTC = 11:50 KST, 정오 발표
   select cron.schedule('noon-push', '0 3 * * *', $$select private.trigger_noon_push()$$);
   -- 03:00 UTC = 12:00 KST, 매칭 발표 알림 (아래 '정오 알림' 설정 필요)
   select cron.schedule('daily-cleanup', '0 19 * * *', $$select private.daily_cleanup()$$);
   -- 19:00 UTC = 04:00 KST, 종료 30일 지난 대화·탈퇴 30일 지난 계정 삭제
   ```
   - 카카오톡 ID 암호화 키는 마이그레이션이 Vault에 `kakao_id_key`로 만든다. **지우거나 바꾸면 저장된 ID를 모두 못 읽는다** (Integrations → Vault에서 확인만)
   - **정오 알림**: Database → Extensions에서 `pg_net`도 켜고, SQL Editor에서 Vault에 두 값을 넣는다
     ```sql
     select vault.create_secret('https://<배포 주소>', 'app_url');
     select vault.create_secret('<.env의 PUSH_CRON_SECRET과 같은 값>', 'push_cron_secret');
     ```
     Vercel 환경변수에 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`·`VAPID_PRIVATE_KEY`·`VAPID_SUBJECT`·`PUSH_CRON_SECRET` 등록
   - **운영자 지정**: 운영자로 쓸 계정으로 가입을 마친 뒤 SQL Editor에서 한 번 실행 (모든 권한 부여). 그 뒤로는 `/admin/users`에서 다른 계정에 권한을 주고 뺀다
     ```sql
     select private.bootstrap_admin('운영자 로그인 이메일');
     ```
4. Authentication → SMTP 설정 (커스텀 SMTP가 있어야 템플릿 수정 가능)
5. Authentication → Sign In / Providers → Email → Email OTP Length를 `6`으로
6. Authentication → Emails → Templates의 **Magic Link**와 **Confirm signup** 본문 (링크 없이 코드만):
   ```html
   <h2>RANPICK 인증 코드</h2>
   <p>아래 6자리 코드를 입력해주세요.</p>
   <h1>{{ .Token }}</h1>
   ```

### Vercel 배포

- 프로젝트: Vercel `big-ding` 팀의 `data-link-web` → https://data-link-web-eta.vercel.app
- `main`에 푸시하면 Production으로 자동 배포된다
- Hobby 플랜은 커밋 작성자가 Vercel 팀 멤버(hawon040)여야 배포된다. 다른 이름으로 작성된 커밋은 배포가 막힌다
- 환경변수를 바꾼 뒤에는 다시 배포해야 적용된다. 대시보드의 Redeploy가 추가 인증을 요구하면 `main`에 커밋을 푸시해도 된다
- Supabase 키(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)는 Vercel의 Supabase 통합이 넣어 준다. 같은 이름으로 직접 추가하지 말 것
- 직접 넣는 값: `NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN`, 정오 알림 키 4개(`NEXT_PUBLIC_VAPID_PUBLIC_KEY`·`VAPID_PRIVATE_KEY`·`VAPID_SUBJECT`·`PUSH_CRON_SECRET`), 포트원 키 3개
- 휴대폰 본인인증은 포트원 실제 연동만 있다 (가짜 인증 모드 없음). 포트원 키 없이는 신규 가입이 본인인증 단계에서 멈춘다

## 디자인 (Figma)

- 원본: [교점 | 백석대 1:1 학우 매칭 모바일 웹](https://www.figma.com/design/j0zSbAXrx4epF4rogj18da)
- 색·폰트 토큰: `src/app/globals.css` (ink, paper, card, lime, orange, muted, chip, mint / Noto Sans KR, Black Han Sans, Archivo 900, Anton)
- 아이콘·도형: `public/figma/` (Figma에서 SVG로 추출)
- 반영된 화면: Figma 46개 전부 (가입 02·13·42·33·14·03·09·15·32, 홈·매칭 04·16·34·43·39·17·35·36·18·10·38, 대화 05·06·19·21·22·40·31·23·37, 교환·후기 07·24·25·26·11·41·12·30, 내 정보 08·27·44·45·28·29)
- Supabase 없이 화면 확인: `npm run dev` 후 `/preview/01` ~ `/preview/46` (Figma 화면 번호와 같음)
- 본인인증은 포트원 V2 · KG이니시스 통합인증(PASS 고정)만 사용. `.env.local`에 포트원 키 3개가 있어야 인증이 열린다

## 구조

```
src/
  app/
    page.tsx              메인 (오늘 신청자 수, 이번 주 친구가 된 쌍)
    signup/               가입: 학교 메일 → 본인인증 → 카톡 ID
    today/                오늘의 학우 + 내일 매칭 신청
    chat/[matchId]/       익명 채팅, 남은 메시지, 카톡 ID 교환, 신고·차단
  lib/
    config.ts             서비스 규칙 상수 (DB settings와 맞출 것)
    supabase/             브라우저·서버 클라이언트
  middleware.ts           세션 갱신, 로그인 필요 경로 보호
supabase/migrations/      스키마, RLS, 매칭 함수, 메시지 규칙, ID 교환
docs/                     기획·결정·법적 검토
```

## 핵심 규칙 (DB에서 강제)

| 규칙 | 위치 |
| --- | --- |
| 하루 한 번 1:1 매칭, 성별 무관 + "같은 성별만" 옵션 | `run_daily_matching()` |
| 각자 메시지 20개 / 24시간 | `private.enforce_message_rules()` 트리거 |
| 교환 전 전화번호·오픈채팅 링크 가림 | 같은 트리거 |
| 둘 다 동의해야 카톡 ID 공개 | `choose_exchange()`, `get_partner_contact()` |
| 성별·상태·인증 정보는 사용자가 못 바꿈 | 컬럼 권한 + RLS |
| 신고 3명 누적 시 자동 정지 | `private.auto_suspend()` |
| 매칭 결과는 정오(발표 시각) 전에는 당사자에게도 안 보임 | `match_announced()` + RLS |
| 카카오톡 ID는 암호문으로만 저장 (키는 Vault `kakao_id_key`) | `private.encrypt_kakao()` / `decrypt_kakao()` |

## 남은 작업

- [x] 포트원 통합 본인인증 연동 (`/api/identity` + 서버에서 profiles 생성) — 키 발급 후 실제 인증 테스트 필요
- [x] 프로필 작성 화면 (닉네임, 학과, 학년, 관심사, 소개)
- [x] Figma 나머지 화면 반영 (46개 전부)
- [x] Web Push 알림 (정오 매칭 발표 — DB pg_cron이 12:00에 `/api/push/noon` 호출) — VAPID 키·Vault 설정 후 실기기 테스트 필요
- [x] 카카오톡 ID 암호화 (Supabase Vault 키 + pgcrypto, `20261103001749_encrypt_kakao_id.sql`)
- [x] 후기 화면, 신고 사유 선택 UI
- [x] 운영자 화면 `/admin` — 일반 계정에 권한(신고 열람·정지·사진 삭제·공지·권한 관리)을 붙이는 방식, 처리 기록 `private.admin_log`
- [x] 공지·문의 화면 `/notices` (`NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_KAKAO_CHANNEL_URL`)
- [x] 홈 화면 아이콘 (`/icons/*` 코드로 생성한 임시 아이콘 — Figma 아이콘 나오면 교체)
- [x] 학교 메일 도메인 확인 — `bu.ac.kr`로 실제 가입·인증 확인 (2026-11-03)
- [x] 후기 다시 고르기, '카카오톡 ID가 본인 것이 아님' 신고 7일 기한 (`20261115000000_review_edit_report_rules.sql`)
