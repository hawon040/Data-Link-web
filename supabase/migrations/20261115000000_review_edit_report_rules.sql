-- 후기 수정 · 신고 사유 추가 · 연락처 신고 기한
--   * 후기는 다시 골라 바꿀 수 있다 (본인 후기만)
--   * 신고 사유에 '부적절한 프로필 사진' 추가 (프로필 사진 기능이 생겨서)
--   * '카카오톡 ID가 본인 것이 아님' 신고는 교환 마감(대화 종료 + 24시간) 뒤 7일까지만 받는다
--     (화면 문구 "7일 내 신고 가능"을 DB에서 강제)

alter type public.report_reason add value if not exists 'photo';

create policy reviews_update on public.reviews for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_match_member(match_id));

alter policy reports_insert on public.reports
  with check (
    reporter_id = (select auth.uid())
    and exists (
      select 1 from public.matches m
      where m.id = reports.match_id
        and ((m.user_a = (select auth.uid()) and m.user_b = reports.reported_id)
          or (m.user_b = (select auth.uid()) and m.user_a = reports.reported_id))
        and (reports.reason::text <> 'fake_contact' or now() <= m.expires_at + interval '8 days')
    )
  );
