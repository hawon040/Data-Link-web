# CLAUDE.md

RANPICK — 백석대 학우 1:1 랜덤매칭 모바일 웹. 서비스 이름은 RANPICK ("교점"은 화면 문구에서 '오늘의 만남'이라는 뜻의 단어로만 쓴다). 기획은 `docs/PLANNING.md`, 결정 이유는 `docs/DECISIONS.md`.

## 지켜야 할 규칙

- 매칭 옵션은 "같은 성별만" 하나. "이성만" 옵션이나 성별별 확률 조작을 넣지 않는다.
- 성비는 화면에 공개하지 않는다. 통계는 성별 구분 없는 총합만.
- 실명·학번·전화번호·생년월일은 상대에게 절대 노출하지 않는다. 카카오톡 ID는 `private.contacts`에만 두고 `get_partner_contact()`로만 꺼낸다.
- 랜덤채팅 규제 대응(본인인증·대화 저장·신고)을 약화시키는 변경을 하지 않는다.
- 서비스 규칙 숫자(메시지 20개, 24시간)는 `src/lib/config.ts`와 `private.settings`를 함께 바꾼다.
- 규칙은 클라이언트가 아니라 DB(RLS, 트리거, security definer 함수)에서 강제한다.

## 명령

- `npm run dev` / `npm run build` / `npm run lint`
- 스키마 변경은 `supabase/migrations/`에 새 파일로 추가 (기존 파일 수정 금지)
- 새 RPC 함수는 기본으로 로그인 전(anon) 실행 권한이 없다 (20261019 마이그레이션). 로그인 전에도 필요하면 `grant execute ... to anon`을 명시하고, 서버 전용 함수는 authenticated에서도 revoke 한다

## 디자인

화면 디자인은 Figma에서 작업 중. 현재 UI는 기능 확인용 임시 화면이다.
