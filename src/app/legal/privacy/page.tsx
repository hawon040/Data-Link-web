import { safeBack } from "../legal-doc";
import PrivacyPolicyView from "./view";

export default async function PrivacyPolicyPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <PrivacyPolicyView backHref={safeBack(from, "/")} />;
}
