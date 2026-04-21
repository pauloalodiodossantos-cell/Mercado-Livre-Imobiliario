const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type PublicUser = {
  id: string;
  email: string;
  role: "BUYER" | "SELLER" | "BROKER" | "ADMIN";
  fullName: string;
  cpfCnpj: string;
};

export type Valuation = {
  modelVersion: string;
  estimatedRentMonthly: string;
  annualRentEstimate: string;
  capRatePct: string;
  irrEstimatePct: string;
  regionalPriceCeiling: string;
  discountVsCeilingPct: string;
  confidence: string;
};

export type Property = {
  id: string;
  propertyType: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  areaM2: number | null;
  bedrooms: number | null;
  parkingSpots: number | null;
};

export type Listing = {
  id: string;
  askingPrice: string;
  status: string;
  publishedAt: string | null;
  property: Property;
  valuation: Valuation | null;
};

export type Offer = {
  id: string;
  listingId: string;
  buyerUserId?: string;
  buyerName?: string;
  offerPrice: string;
  earnestMoney: string;
  status: string;
  createdAt: string;
  listing?: {
    id: string;
    city: string;
    askingPrice: string;
  };
};

export type Pipeline = {
  offer: { id: string; listingId: string; buyerUserId: string; offerPrice: string; earnestMoney: string; status: string; createdAt: string };
  listing: { id: string; askingPrice: string; status: string; property: { addressLine1: string; city: string; state: string }; valuation: { capRatePct: string; irrEstimatePct: string; discountVsCeilingPct: string } | null };
  dueDiligence: { status: string; riskScore: number; summary: string; checks: { checkType: string; status: string; resultSummary: string | null }[] } | null;
  contract: { status: string; bodyMarkdown: string } | null;
  escrow: { status: string; targetAmount: string; fundedAmount: string; provider: string; milestones: { milestoneType: string; status: string }[] } | null;
};

export const api = {
  auth: {
    register: (body: { email: string; password: string; fullName: string; cpfCnpj: string; role: string }) =>
      request<{ user: PublicUser; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
      request<{ user: PublicUser; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => request<{ user: PublicUser }>("/auth/me"),
  },
  listings: {
    list: () => request<{ listings: Listing[] }>("/listings"),
    get: (id: string) => request<{ listing: Listing }>(`/listings/${id}`),
    create: (body: object) => request<{ listing: Listing }>("/listings", { method: "POST", body: JSON.stringify(body) }),
    offers: (listingId: string) => request<{ offers: Offer[] }>(`/listings/${listingId}/offers`),
  },
  offers: {
    mine: () => request<{ offers: Offer[] }>("/offers/mine"),
    createOffer: (listingId: string, body: { offerPrice: number; earnestMoney?: number }) =>
      request<{ offer: Offer }>(`/listings/${listingId}/offers`, { method: "POST", body: JSON.stringify(body) }),
    accept: (offerId: string) => request<{ message: string }>(`/offers/${offerId}/accept`, { method: "POST" }),
    reject: (offerId: string) => request<{ message: string }>(`/offers/${offerId}/reject`, { method: "POST" }),
    pipeline: (offerId: string) => request<Pipeline>(`/offers/${offerId}/pipeline`),
    simulateFunding: (offerId: string) => request<{ message: string }>(`/offers/${offerId}/escrow/simulate-funding`, { method: "POST" }),
  },
};
