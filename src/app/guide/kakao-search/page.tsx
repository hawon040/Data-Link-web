import KakaoGuideView from "./view";

export default async function KakaoGuidePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  // 내부 경로만 허용
  const backHref = from && from.startsWith("/") && !from.startsWith("//") ? from : "/me";
  return <KakaoGuideView backHref={backHref} />;
}
