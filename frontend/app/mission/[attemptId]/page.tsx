import { Mission } from "@/screens/Mission";

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <Mission key={attemptId} attemptId={attemptId} />;
}
