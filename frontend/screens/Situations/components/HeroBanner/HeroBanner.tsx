import { HeroBannerLayout } from "./HeroBanner.layout";

export interface HeroBannerProps {
  onContinueMission?: () => void;
  onSeePerformance?: () => void;
}

export function HeroBanner(props: HeroBannerProps) {
  return <HeroBannerLayout {...props} />;
}
