import { Navbar } from "@/components/layout/navbar";
import { DocsSidebar, DocsMobileNav } from "@/components/docs/docs-sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-4 py-10">
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-24">
            <DocsSidebar />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-6 lg:hidden">
            <DocsMobileNav />
          </div>
          <div className="max-w-2xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
