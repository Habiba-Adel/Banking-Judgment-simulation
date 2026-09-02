import { PlaythroughHistory } from "@/screens/PlaythroughHistory";

export default async function Page({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  return <PlaythroughHistory missionId={missionId} />;
}
