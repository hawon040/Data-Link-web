import SignupStartView from "./view";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <SignupStartView linkError={error === "link"} />;
}
