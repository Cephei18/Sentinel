import Link from "next/link";
import { ConnectButton } from "@/components/wallet/connect-button";
import { BRAND } from "@/lib/brand";

/** App chrome — brand + primary nav + wallet button. */
export function Navbar() {
  return (
    <header className="border-border/60 bg-background/70 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-brand text-brand-foreground grid size-7 place-items-center rounded-full text-sm">
            {BRAND.glyph}
          </span>
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground hidden text-sm sm:block"
          >
            Operations
          </Link>
          <Link href="/graph" className="text-muted hover:text-foreground hidden text-sm sm:block">
            Org graph
          </Link>
          <Link href="/docs" className="text-muted hover:text-foreground hidden text-sm sm:block">
            Docs
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
