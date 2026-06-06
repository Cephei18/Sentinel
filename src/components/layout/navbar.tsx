import Link from "next/link";
import { ConnectButton } from "@/components/wallet/connect-button";

/** App chrome — brand + primary nav + wallet button. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-sm text-white">
            B
          </span>
          Base Pay
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/dashboard" className="hidden text-sm text-muted hover:text-foreground sm:block">
            Dashboard
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
