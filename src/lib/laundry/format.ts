import { format, formatDistanceToNowStrict } from "date-fns";
import { id } from "date-fns/locale";

export const formatRupiah = (value: number) =>
  "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);

export const formatShortRupiah = (value: number) => {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}rb`;
  return formatRupiah(value);
};

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);

export const formatDate = (value: string | Date) =>
  format(new Date(value), "d MMMM yyyy", { locale: id });

export const formatDateTime = (value: string | Date) =>
  format(new Date(value), "d MMM yyyy, HH:mm", { locale: id });

export const formatTime = (value: string | Date) => format(new Date(value), "HH:mm");

export const formatDayShort = (value: string | Date) =>
  format(new Date(value), "EEE", { locale: id });

export const fromNow = (value: string | Date) =>
  formatDistanceToNowStrict(new Date(value), { locale: id, addSuffix: true });

export const isSameDay = (a: string | Date, b: string | Date) =>
  format(new Date(a), "yyyy-MM-dd") === format(new Date(b), "yyyy-MM-dd");
