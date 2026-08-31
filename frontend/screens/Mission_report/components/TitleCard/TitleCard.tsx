import { TitleCardLayout } from "./TitleCard.layout";

export interface TitleCardProps {
  category: string;
  title: string;
  description: string;
  highlights: string[];
}

export function TitleCard(props: TitleCardProps) {
  return <TitleCardLayout {...props} />;
}
