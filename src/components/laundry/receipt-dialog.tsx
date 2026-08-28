import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/laundry/format";
import { PAYMENT_LABEL, type Order, type OutletSettings } from "@/lib/laundry/types";

export function ReceiptDialog({
  order,
  outlet,
  open,
  onOpenChange,
}: {
  order: Order | null;
  outlet: OutletSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const trackingUrl =
    typeof window !== "undefined" && order
      ? `${window.location.origin}${order.qrCode ?? `/tracking/${order.orderNumber}`}`
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nota Order</DialogTitle>
          <DialogDescription>
            Preview nota untuk dicetak dan diberikan ke pelanggan.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="rounded-xl border bg-surface p-5 text-sm">
            <div className="text-center">
              <p className="font-bold">{outlet.name}</p>
              <p className="text-xs text-muted-foreground">{outlet.address}</p>
              <p className="text-xs text-muted-foreground">{outlet.phone}</p>
            </div>
            <div className="my-3 border-t border-dashed" />
            <div className="space-y-1 text-xs">
              <Row label="No. Nota" value={order.orderNumber} />
              <Row label="Tanggal" value={formatDateTime(order.createdAt)} />
              <Row label="Pelanggan" value={order.customerName} />
              <Row label="Estimasi" value={formatDateTime(order.estimatedCompletion)} />
            </div>
            <div className="my-3 border-t border-dashed" />
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.serviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.quantity)} × {formatRupiah(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">{formatRupiah(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="my-3 border-t border-dashed" />
            <div className="space-y-1 text-xs">
              <Row label="Subtotal" value={formatRupiah(order.subtotal)} />
              {order.discount > 0 && (
                <Row label="Diskon" value={`- ${formatRupiah(order.discount)}`} />
              )}
              {order.tax > 0 && <Row label="Pajak" value={formatRupiah(order.tax)} />}
              <Row label="Pembayaran" value={PAYMENT_LABEL[order.paymentMethod]} />
            </div>
            <div className="mt-2 flex items-center justify-between border-t pt-2 font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatRupiah(order.total)}</span>
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
              {trackingUrl && (
                <QRCodeSVG value={trackingUrl} size={104} bgColor="transparent" level="M" />
              )}
              <p className="text-center text-[11px] text-muted-foreground">
                Scan untuk cek status cucian
              </p>
              <p className="text-center text-[11px] text-muted-foreground">
                {outlet.receiptFooter}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={() => window.print()}>
            <Printer /> Cetak Nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
