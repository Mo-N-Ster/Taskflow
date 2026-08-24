import Image from "next/image";
import Link from "next/link";

import taskflowIcon from "@/app/icon.jpeg";

type TaskFlowBrandProps = {
  className?: string;
};

export function TaskFlowBrand({ className = "" }: TaskFlowBrandProps) {
  return (
    <Link
      href="/"
      aria-label="TaskFlow — accueil"
      className={`inline-flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${className}`}
    >
      <Image
        src={taskflowIcon}
        alt=""
        priority
        sizes="44px"
        className="h-11 w-11 rounded-xl border border-cyan-300/30 object-cover shadow-lg shadow-cyan-950/40"
      />
      <span className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-300">
        TaskFlow
      </span>
    </Link>
  );
}
