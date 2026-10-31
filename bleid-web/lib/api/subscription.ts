import { apiFetch } from "@/lib/api/client";
import type { SubscriptionCheckoutResult, SubscriptionInfo } from "@/types";

export function getSubscriptionStatus() {
  return apiFetch<SubscriptionInfo>("/api/subscriptions/my");
}

export function createSubscriptionCheckout() {
  return apiFetch<SubscriptionCheckoutResult>("/api/subscriptions/checkout", {
    method: "POST",
  });
}

export function verifySubscription(preapprovalId: string) {
  return apiFetch<SubscriptionInfo>("/api/subscriptions/verify", {
    method: "POST",
    body: JSON.stringify({ preapprovalId }),
  });
}

export function cancelSubscription() {
  return apiFetch<{ success: boolean }>("/api/subscriptions/cancel", {
    method: "POST",
  });
}
