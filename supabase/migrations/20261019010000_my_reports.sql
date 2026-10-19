-- 내가 한 신고 목록 (내 정보 → 개인정보 관리 → 신고 내역)
-- 신고 대상의 정보는 돌려주지 않는다. 날짜·사유·내가 쓴 설명만.

create or replace function public.my_reports()
returns table (reported_at timestamptz, reason public.report_reason, detail text)
language sql stable security definer set search_path = public as $$
  select r.created_at, r.reason, r.detail
    from public.reports r
   where r.reporter_id = (select auth.uid())
   order by r.created_at desc;
$$;

revoke execute on function public.my_reports() from public, anon;
grant execute on function public.my_reports() to authenticated;
