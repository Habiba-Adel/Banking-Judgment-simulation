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
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white py-[22px] px-[20px] shadow-sm w-full lg:w-[451px] h-[813px] overflow-y-auto">
      <h3 className="flex items-center w-full lg:w-[411px] h-[30px] mb-[15px] text-lg font-bold text-gray-900">
        Contacts
      </h3>
      <div className="flex flex-col gap-[10px]">
        {contacts.map((contact) => {
          const isActive = contact.characterId === activeCharacterId;
          return (
            <div
              key={contact.characterId}
              onClick={() => onSelectContact(contact.characterId)}
              className={[
                "flex items-start gap-[10px] w-full lg:w-[411px] h-[100px] rounded-lg border-b border-gray-100 py-[12px] px-[24px] flex-shrink-0 cursor-pointer transition-colors",
                isActive ? "bg-primary-tint" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <ContactAvatar name={contact.name} avatarSrc={contact.avatarSrc} />
              <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{contact.name}</span>
                  {contact.unread && (
                    <span className="ml-2 flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-[2px] bg-primary text-xs font-bold text-white">
                      1
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between gap-2 mt-1">
                  <p className="text-sm text-gray-500 line-clamp-2">{contact.lastMessage}</p>
                  <span className="flex-shrink-0 whitespace-nowrap text-xs text-gray-400 mb-1">
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