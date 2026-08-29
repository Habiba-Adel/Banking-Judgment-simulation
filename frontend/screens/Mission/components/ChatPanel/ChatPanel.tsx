import Image from "next/image";
import type { Character, ChatMessage, Choice } from "../../types";

function CharacterAvatar({ name, avatarSrc }: { name: string; avatarSrc?: string }) {
  if (avatarSrc) {
    return (
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
        <Image src={avatarSrc} alt={name} fill className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-500">
      {name.charAt(0)}
    </div>
  );
}

export interface ChatPanelProps {
  character: Character | null;
  messages: ChatMessage[];
  choices: Choice[];
  selectedChoiceId: string | null;
  dateLabel: string;
  onSelectChoice: (choiceId: string) => void;
  onSend: () => void;
}

export function ChatPanel({
  character,
  messages,
  choices,
  selectedChoiceId,
  dateLabel,
  onSelectChoice,
  onSend,
}: ChatPanelProps) {
  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm p-10 h-full min-h-[500px]">
        <div className="relative h-44 w-44 mb-4 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
          <Image src="/empty.png" alt="Messages" width={120} height={120} className="object-contain" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Messages</h3>
        <p className="text-sm text-gray-500">Click on a contact to view messages.</p>
      </div>
    );
  }

  const selectedChoiceText = choices.find((c) => c.id === selectedChoiceId)?.labelText ?? "";

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm h-full min-h-[500px]">
      <div className="flex items-center gap-3 border-b border-gray-100 p-4">
        <CharacterAvatar name={character.name} avatarSrc={character.avatarSrc} />
        <div>
          <div className="text-sm font-semibold text-gray-900">{character.name}</div>
          <div className="text-xs text-gray-400">{character.role}</div>
        </div>
      </div>

      <div className="flex-1 space-y-3 p-4 overflow-y-auto">
        <div className="text-center text-xs text-gray-400">{dateLabel}</div>
        {messages.map((message) => (
          <div key={message.id} className="max-w-md">
            <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2 text-sm text-gray-800">
              {message.text}
            </div>
            <span className="mt-1 block text-sm text-gray-400">{message.timestamp}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 p-4">
        {choices.length > 0 && (
          <div className="mb-3 space-y-1">
            {choices.map((choice) => {
              const isSelected = choice.id === selectedChoiceId;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => onSelectChoice(choice.id)}
                  className={[
                    "block w-full rounded-lg px-3 py-2 text-left text-sm",
                    isSelected ? "bg-primary-tint font-medium text-primary" : "text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span className="font-semibold">{choice.labelKey}:</span> {choice.labelText}
                </button>
              );
            })}
          </div>
        )}

        {choices.length > 0 && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={selectedChoiceText}
              placeholder="Choose your answer"
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={selectedChoiceId === null}
              className={[
                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors",
                selectedChoiceId ? "bg-primary hover:bg-indigo-600" : "cursor-not-allowed bg-gray-300",
              ].join(" ")}
            >
              Send
              <Image src="/send.png" alt="Send" width={24} height={25} className="object-contain" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}