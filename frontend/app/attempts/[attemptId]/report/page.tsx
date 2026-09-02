import { MissionReport } from "@/screens/Mission_report";

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <MissionReport attemptId={attemptId} />;
}