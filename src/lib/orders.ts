import crypto from "node:crypto";
import type { OrderStatus, CheckoutStage, DeliveryStatus } from "@prisma/client";

export function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `ND${ymd}${rand}`;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAYMENT_INITIATED: "Payment initiated",
  PAID: "Successful",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  REFUNDED: "Refunded",
};

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  NOT_DELIVERED: "Not delivered",
  DELIVERED: "Delivered",
  EMAIL_FAILED: "Email failed",
};

export const STAGE_LABEL: Record<CheckoutStage, string> = {
  CART: "Added to cart",
  CHECKOUT_STARTED: "Checkout started",
  DETAILS_ENTERED: "Details entered",
  ORDER_CREATED: "Pending",
  PAYMENT_INITIATED: "Payment initiated",
  PAID: "Successfully paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export const STATUS_TONE: Record<string, string> = {
  PAID: "green",
  DELIVERED: "green",
  PENDING: "amber",
  PAYMENT_INITIATED: "amber",
  ORDER_CREATED: "amber",
  CHECKOUT_STARTED: "slate",
  DETAILS_ENTERED: "slate",
  CART: "slate",
  NOT_DELIVERED: "slate",
  FAILED: "red",
  EMAIL_FAILED: "red",
  CANCELLED: "zinc",
  EXPIRED: "zinc",
  REFUNDED: "violet",
};
