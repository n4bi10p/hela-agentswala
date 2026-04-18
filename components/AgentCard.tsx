import Image from "next/image";
import Link from "next/link";

interface AgentCardProps {
  id: number;
  name: string;
  description: string;
  type: string;
  image: string;
  price: number;
  activeCount: number;
  isLive: boolean;
}

export function AgentCard({
  id,
  name,
  description,
  type,
  image,
  price,
  activeCount,
  isLive,
}: AgentCardProps) {
  return (
    <div className="bg-surface-container-lowest border border-white/12 p-6 flex flex-col gap-6 hover:border-white transition-colors group">
      <div className="flex justify-between items-start">
        <div className="font-headline text-3xl uppercase">{name}</div>
        <div
          className={`flex items-center gap-1 font-mono text-[10px] ${
            isLive ? "text-live-signal" : "text-white/20"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLive ? "bg-live-signal" : "bg-white/20"
            }`}
          ></span>
          {isLive ? "LIVE" : "IDLE"}
        </div>
      </div>

      <div className="w-full h-48 bg-black border border-white/5 relative overflow-hidden">
        <img
          alt={description}
          className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
          src={image}
        />
      </div>

      <div>
        <h3 className="font-headline text-2xl mb-2 uppercase">{type}</h3>
        <p className="text-white/60 font-body text-xs leading-relaxed uppercase">
          {description}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="font-mono text-[10px] border border-white/20 px-2 py-1">
          [ {activeCount} ACTIVE ]
        </span>
        <span className="font-mono text-[10px] border border-white/20 px-2 py-1">
          [ {price} HLUSD ]
        </span>
      </div>

      <Link
        href={`/agent/${id}`}
        className="w-full border border-white py-3 font-headline text-xl hover:bg-white hover:text-black transition-colors text-center uppercase"
      >
        [ ACTIVATE ↗ ]
      </Link>
    </div>
  );
}
