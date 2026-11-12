import type { Metadata } from "next";
import Link from "next/link";
import { loadDashboardData } from "@/lib/api";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "داشبورد · آبجوش",
  description: "پنل تحلیل بازدیدها، رویدادها و سلامت سیستم",
};

/* Numbers change on every request, so this route is never prerendered. */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialData = await loadDashboardData();

  return (
    <>
      <Header />
      <main className="min-h-screen w-full">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
                داشبورد تحلیلی
              </h1>
              <p className="mt-1 text-sm text-clay">
                داده‌ها از API جنگو در{" "}
                <code className="rounded bg-beige px-1.5 py-0.5 text-xs text-roast">
                  /dashboard/api/
                </code>{" "}
                خوانده می‌شوند.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-latte bg-foam px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-beige-dark"
            >
              بازگشت به فروشگاه
            </Link>
          </div>

          <DashboardView initialData={initialData} />
        </div>
      </main>
      <Footer />
    </>
  );
}
