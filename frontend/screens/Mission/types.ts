export type MissionMetricKey = "compliance" | "reputationRisk" | "responsibleBanking";

export interface MissionMetric {
  id: MissionMetricKey;
  label: string;
  value: number;
  changeLabel: string; // e.g. "+2%"
}

export interface SituationPressure {
  level: "Low" | "Moderate" | "Medium-High" | "High";
  time: "Low" | "Medium" | "High";
  expectation: "Low" | "Medium" | "High";
}

export interface MissionInfo {
  category: string;
  title: string;
  description: string;
  goalText: string;
}

export interface StepSummary {
  index: number; // 1-5
  label: string;
  status: "done" | "current" | "upcoming";
}

export interface Character {
  id: string;
  name: string;
  role: string;
  avatarSrc?: string;
}

export interface ChatMessage {
  id: string;
  characterId: string;
  text: string;
  timestamp: string; // display string, e.g. "11:12 am"
}

export interface Choice {
  id: string;
  labelKey: string; // "A" | "B" | "C" | "D"
  labelText: string;
}

export interface ContactPreview {
  characterId: string;
  name: string;
  role?: string;
  avatarSrc?: string;
  lastMessage: string;
  lastMessageTime: string;
  unread?: boolean;
}

export interface MissionData {
  mission: MissionInfo;
  pressure: SituationPressure;
  metrics: MissionMetric[];
  steps: StepSummary[];
  contacts: ContactPreview[];
  activeCharacter: Character;
  messages: ChatMessage[];
  choices: Choice[];
  selectedChoiceId: string | null;
  dateLabel: string;
}
