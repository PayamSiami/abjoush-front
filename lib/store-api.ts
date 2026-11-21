/**
 * Typed client for the Django store and coffee-wizard API.
 *
 * Uses the same dual-transport pattern as `api.ts`: direct Django URL in Server
 * Components (SSR needs an absolute origin), same-origin proxy in the browser.
 */

import type { BrewMethod, Origin } from "./content";

const PROXY_PATH = "/api";
const DJANGO_ORIGIN = process.env.DJANGO_API_ORIGIN ?? "http://127.0.0.1:8000";

const API_BASE =
  typeof window === "undefined" ? `${DJANGO_ORIGIN}${PROXY_PATH}` : PROXY_PATH;

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  weight: string;
  price: number | null;
  grade: string;
  gradeType: "nik" | "motevaset";
  image: string;
}

export interface StoreProductItem {
  id: number;
  name: string;
  weight: string;
  price: string;
  grade: string;
  gradeType: "nik" | "motevaset";
  image: string;
  type: string;
}

export interface ApiTaste {
  id: number;
  name: string;
  slug: string;
  image: string;
  rating: number;
}

export interface ApiConsumption {
  id: number;
  label: string;
  range: string;
  hint: string;
  image: string;
  rating: number;
}

export interface WizardOptions {
  methods: BrewMethod[];
  origins: Origin[];
  tastes: ApiTaste[];
  consumption: ApiConsumption[];
}

export interface RecommendPayload {
  robusta: number;
  taste_slug?: string;
  method_slug?: string;
  consumption_id?: number;
}

export interface RecommendResult {
  blend: {
    robusta: number;
    arabica: number;
    label: string;
  };
  method: BrewMethod | null;
  taste: ApiTaste | null;
  consumption: ApiConsumption | null;
  origins: Origin[];
}

export class StoreApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpoint?: string
  ) {
    super(message);
    this.name = "StoreApiError";
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

/** Formats an API product to the string values expected by ProductCard. */
export function formatProduct(product: ApiProduct): StoreProductItem {
  return {
    id: product.id,
    name: product.name,
    weight: product.weight || "—",
    price:
      product.price != null
        ? product.price.toLocaleString("fa-IR")
        : "—",
    grade: product.grade,
    gradeType: product.gradeType,
    image: product.image,
    type: product.type,
  };
}

async function getJson<T>(endpoint: string): Promise<T> {
  const [path, query = ""] = endpoint.split("?");
  const slashed = path.endsWith("/") ? path : `${path}/`;
  // The browser proxy must not send the trailing slash or Next and Django
  // bounce the request between 308 and 301.
  const normalized =
    typeof window !== "undefined" ? slashed.replace(/\/$/, "") : slashed;
  const suffix = query ? `?${query}` : "";

  const url = `${API_BASE}${normalized.startsWith("/") ? normalized : `/${normalized}`}${suffix}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new StoreApiError(
        `Store API request to ${endpoint} failed: ${res.statusText}`,
        res.status,
        endpoint
      );
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof StoreApiError) throw err;
    throw new StoreApiError(
      `Network failure fetching ${endpoint}: ${
        err instanceof Error ? err.message : String(err)
      }`,
      undefined,
      endpoint
    );
  }
}

/* ─── API Methods ───────────────────────────────────────────────────────── */

export async function getBestSellers(): Promise<StoreProductItem[]> {
  const data = await getJson<{ products: ApiProduct[] }>("/bestsellers/");
  return data.products.map(formatProduct);
}

export async function getAllProducts(bestsellerOnly = false): Promise<StoreProductItem[]> {
  const endpoint = bestsellerOnly ? "/products/?bestseller=1" : "/products/";
  const data = await getJson<{ products: ApiProduct[] }>(endpoint);
  return data.products.map(formatProduct);
}

export async function getWizardOptions(): Promise<WizardOptions> {
  return getJson<WizardOptions>("/wizard/options/");
}

export async function postRecommend(
  payload: RecommendPayload
): Promise<RecommendResult> {
  const endpoint = "/recommend";
  const path = typeof window !== "undefined" ? endpoint : `${endpoint}/`;
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new StoreApiError(
      `Recommend request failed: ${res.statusText}`,
      res.status,
      endpoint
    );
  }

  return (await res.json()) as RecommendResult;
}
