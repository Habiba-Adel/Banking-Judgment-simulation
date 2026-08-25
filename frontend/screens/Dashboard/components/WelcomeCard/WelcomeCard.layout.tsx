import Image from "next/image";

export interface WelcomeCardLayoutProps {
  userName: string;
  hasProgress: boolean;
}

export function WelcomeCardLayout({ userName, hasProgress }: WelcomeCardLayoutProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8">
      <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
        Hello, {userName} <span aria-hidden>👋</span>
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
        You&rsquo;re inside a bank
      </h1>
      <p className="mt-4 max-w-xl text-gray-500">
        Practice handling realistic compliance dilemmas and see how your decisions affect
        trust, compliance, data protection and reputation.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {hasProgress ? "Continue Simulation" : "Start New Simulation"}
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white">
            <Image
              src="/continue-arrow.png"
              alt=""
              width={38}
              height={34}
              className="object-contain"
            />
          </span>
        </button>
        <button
          type="button"
          className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Read Instructions
        </button>
      </div>
    </div>
  );
}