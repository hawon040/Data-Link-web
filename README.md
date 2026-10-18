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
2. SQL Editor에서 `supabase/migrations/20261015000000_init.sql` 실행 (또는 `supabase db push`)
3. Database → Extensions에서 `pg_cron` 켜고 매일 매칭 등록
   ```sql
   select cron.schedule('daily-matching', '50 2 * * *', $$select public.run_daily_matching()$$);
   -- 02:50 UTC = 11:50 KST, 정오 발표
   ```
4. Authentication → URL Configuration → Site URL을 앱 주소로 (`http://localhost:3000`, 배포 후엔 배포 주소)
5. Authentication → SMTP 설정 (커스텀 SMTP가 있어야 템플릿 수정 가능)
6. Authentication → Emails → Templates의 **Magic Link**와 **Confirm signup** 본문:
   ```html
   <h2>RANPICK 로그인</h2>
   <p>아래 버튼을 누르면 로그인됩니다. 링크는 한 번만 쓸 수 있어요.</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">로그인</a></p>
   ```

## 디자인 (Figma)

- 원본: [교점 | 백석대 1:1 학우 매칭 모바일 웹](https://www.figma.com/design/j0zSbAXrx4epF4rogj18da)
- 색·폰트 토큰: `src/app/globals.css` (ink, paper, card, lime, orange, muted, chip, mint / Noto Sans KR, Black Han Sans, Archivo 900, Anton)
- 아이콘·도형: `public/figma/` (Figma에서 SVG로 추출)
- 반영된 화면: Figma 46개 전부 (가입 02·13·42·33·14·03·09·15·32, 홈·매칭 04·16·34·43·39·17·35·36·18·10·38, 대화 05·06·19·21·22·40·31·23·37, 교환·후기 07·24·25·26·11·41·12·30, 내 정보 08·27·44·45·28·29)
- Supabase 없이 화면 확인: `npm run dev` 후 `/preview/01` ~ `/preview/46` (Figma 화면 번호와 같음)
- 본인인증을 포트원 없이 테스트하려면 `IDENTITY_MOCK=1`, `NEXT_PUBLIC_IDENTITY_MOCK=1`

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

## 남은 작업

- [ ] 포트원 통합 본인인증 연동 (`/api/identity` + 서버에서 profiles 생성)
- [ ] 프로필 작성 화면 (닉네임, 학과, 학년, 관심사, 소개)
- [ ] Figma 나머지 화면 반영 (02·03 인증, 08 내 정보, 09~46 상태 화면)
- [ ] Web Push 알림 (정오 매칭 발표)
- [ ] 카카오톡 ID 암호화 (Supabase Vault)
- [ ] 후기 화면, 신고 사유 선택 UI
- [ ] 학교 메일 도메인 확인 (`NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN`)
