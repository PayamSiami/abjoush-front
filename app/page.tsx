import CoffeeWizard from "@/components/CoffeeWizard";
import { CoffeeShowcase } from "@/components/coffee-showcase";
import { Testimonials } from "@/components/testimonials";
import { AboutCoffee } from "@/components/about-coffee";
import { ReadMore } from "@/components/read-more";
import { CategoryFilter } from "@/components/category-filter";
import { FAQ } from "@/components/faq";
import { Tags } from "@/components/tags";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getBestSellers, getAllProducts, type StoreProductItem } from "@/lib/store-api";

// Always render fresh data from Django on every request.
export const dynamic = "force-dynamic";

type ShowcaseShelves = {
  bestsellers: StoreProductItem[];
  newest: StoreProductItem[];
  offers: StoreProductItem[];
  popular: StoreProductItem[];
};

/**
 * Fetches the four homepage shelves from Django. If the backend is down the
 * built-in showcase data still renders, so the storefront never goes blank.
 */
async function loadShelves(): Promise<ShowcaseShelves> {
  const empty: ShowcaseShelves = { bestsellers: [], newest: [], offers: [], popular: [] };

  const [bestsellers, all] = await Promise.allSettled([
    getBestSellers(),
    getAllProducts(),
  ]);

  if (bestsellers.status === "fulfilled") {
    empty.bestsellers = bestsellers.value;
  }
  if (all.status === "fulfilled") {
    const products = all.value;
    // Split the catalog across the other shelves by price availability.
    empty.newest = products.slice(-6).reverse();
    empty.offers = products.filter((p) => p.price !== "—").slice(0, 6);
    empty.popular = products.filter((p) => p.gradeType === "nik").slice(0, 6);
  }
  return empty;
}

export default async function Home() {
  const shelves = await loadShelves();

  return (
    <>
      <Header />
      <main className="min-h-screen w-full">
        <CoffeeWizard />
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <CategoryFilter />
          <CoffeeShowcase
            sectionId="products"
            title="پرفروش ترین ها"
            subtitle="قهوه‌ای برای هر سلیقه"
            products={shelves.bestsellers.length ? shelves.bestsellers : undefined}
          />
          <CoffeeShowcase
            title="جدیدترین ها"
            subtitle="قهوه‌ای برای کشف کردن"
            products={shelves.newest.length ? shelves.newest : undefined}
          />
          <CoffeeShowcase
            title="پیشنهاد ویژه"
            subtitle="قهوه‌ای برای علاقه‌مندان"
            products={shelves.offers.length ? shelves.offers : undefined}
          />
          <CoffeeShowcase
            title="محبوب ترین ها"
            subtitle="قهوه‌ای برای هر سلیقه"
            products={shelves.popular.length ? shelves.popular : undefined}
          />
          <Testimonials />
          <AboutCoffee />
          <ReadMore />
          <FAQ />
          <Tags />
        </div>
      </main>
      <Footer />
    </>
  );
}
