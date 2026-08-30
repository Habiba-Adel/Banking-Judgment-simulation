export interface JourneyStep {
  index: number;
  title: string;
  description: string;
}

export interface BehaviorMetricInfo {
  key: string;
  iconSrc: string;
  label: string;
  description: string;
}

export interface CastMember {
  id: string;
  name: string;
  role: string;
  avatarSrc?: string;
  isPlayer?: boolean;
}
