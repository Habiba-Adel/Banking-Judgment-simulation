import Image from "next/image";
import type { ContactPreview } from "../../types";

export interface ContactsListProps {
  contacts: ContactPreview[];
  activeCharacterId: string | null;
  onSelectContact: (characterId: string) => void;
}

function ContactAvatar({ name, avatarSrc }: { name: string; avatarSrc?: string }) {
  if (avatarSrc) {
    return (
      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
        <Image src={avatarSrc} alt={name} fill sizes="40px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-500">
      {name.charAt(0)}
    </div>
  );
}

export function ContactsList({ contacts, activeCharacterId, onSelectContact }: ContactsListProps) {
  return (
    <div className="flex h-[477px] w-full lg:w-[451px] flex-col rounded-2xl border border-gray-100 bg-white px-[20px] py-[22px] overflow-y-auto">
      <h3 className="mb-[15px] flex h-[30px] w-full items-center text-lg font-bold text-gray-900 lg:w-[411px]">
        Contacts
      </h3>
      <div className="flex flex-col gap-[10px]">
        {contacts.map((contact) => {
          const isActive = contact.characterId === activeCharacterId;
          return (
            <div
              key={contact.characterId}
              data-testid="contact-item"
              data-character-id={contact.characterId}
              data-unread={contact.unread ? "true" : "false"}
              onClick={() => onSelectContact(contact.characterId)}
              className={[
                "flex h-[100px] w-full flex-shrink-0 cursor-pointer items-start gap-[10px] rounded-lg border-b border-gray-100 px-[24px] py-[12px] transition-colors lg:w-[411px]",
                isActive ? "bg-primary-tint" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <ContactAvatar name={contact.name} avatarSrc={contact.avatarSrc} />
              <div className="flex h-full min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{contact.name}</span>
                  {contact.unread && (
                    <span className="ml-2 flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-[2px] bg-primary text-xs font-bold text-white">
                      1
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="line-clamp-2 text-sm text-gray-500">{contact.lastMessage}</p>
                  <span className="mb-1 flex-shrink-0 whitespace-nowrap text-xs text-gray-400">
                    {contact.lastMessageTime}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}