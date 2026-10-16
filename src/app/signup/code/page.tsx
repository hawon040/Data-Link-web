import CodeView from "./view";

export default async function CodePage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email = "" } = await searchParams;
  return <CodeView email={email} />;
}
