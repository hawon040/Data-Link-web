import ResentView from "./view";

export default async function ResentPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return <ResentView email={email} />;
}
