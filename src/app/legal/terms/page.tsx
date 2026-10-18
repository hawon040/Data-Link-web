import { safeBack } from "../legal-doc";
import TermsView from "./view";

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <TermsView backHref={safeBack(from, "/")} />;
}
