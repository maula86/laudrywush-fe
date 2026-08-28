import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckSquare, Clock, GripVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupiah, fromNow } from "@/lib/laundry/format";
import { cn } from "@/lib/utils";
import { PRODUCTION_STAGES, STATUS_LABEL, type OrderStatus } from "@/lib/laundry/types";
import { useLaundryStore } from "@/store/laundry-store";

export const Route = createFileRoute("/dashboard/production")({
  head: () => ({
    meta: [
      { title: "Papan Produksi — LaundryWush" },
      {
        name: "description",
        content:
          "Papan kanban produksi laundry: pantau antrian, cuci, kering, setrika, packing, hingga siap diambil.",
      },
      { property: "og:title", content: "Papan Produksi — LaundryWush" },
      {
        property: "og:description",
        content: "Geser order antar tahap produksi laundry dan pantau beban tiap stasiun.",
      },
    ],
  }),
  component: ProductionPage,
});

function ProductionPage() {
  const orders = useLaundryStore((s) => s.orders);
  const moveOrder = useLaundryStore((s) => s.moveOrder);

  const [stageFilter, setStageFilter] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [batchTarget, setBatchTarget] = useState<OrderStatus>("washing");
  const [dragOverStage, setDragOverStage] = useState<OrderStatus | null>(null);

  const activeOrders = useMemo(
    () => orders.filter((o) => PRODUCTION_STAGES.some((s) => s.status === o.status)),
    [orders],
  );

  const visibleStages = useMemo(
    () =>
      stageFilter === "all"
        ? PRODUCTION_STAGES
        : PRODUCTION_STAGES.filter((s) => s.status === stageFilter),
    [stageFilter],
  );

  const toggleSelected = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const applyBatch = () => {
    if (!selected.length) return;
    selected.forEach((id) => moveOrder(id, batchTarget));
    toast.success(`${selected.length} order dipindah ke ${STATUS_LABEL[batchTarget]}.`);
    setSelected([]);
  };

  const handleDrop = (status: OrderStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData("text/plain");
    const order = activeOrders.find((o) => o.id === id);
    if (!order || order.status === status) return;
    moveOrder(id, status);
    toast.success(`${order.orderNumber} → ${STATUS_LABEL[status]}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Papan Produksi</h1>
        <p className="text-sm text-muted-foreground">
          Tarik kartu order ke kolom tujuan, atau pilih beberapa order untuk update massal.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as typeof stageFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tahap</SelectItem>
            {PRODUCTION_STAGES.map((s) => (
              <SelectItem key={s.status} value={s.status}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{selected.length} dipilih</span>
          <Select value={batchTarget} onValueChange={(v) => setBatchTarget(v as OrderStatus)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCTION_STAGES.map((s) => (
                <SelectItem key={s.status} value={s.status}>
                  {s.label}
                </SelectItem>
              ))}
              <SelectItem value="completed">Selesai</SelectItem>
            </SelectContent>
          </Select>
          <Button disabled={selected.length === 0} onClick={applyBatch}>
            <CheckSquare /> Update massal
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          stageFilter === "all" ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" : "max-w-md",
        )}
      >
        {visibleStages.map((stage) => {
          const stageOrders = activeOrders.filter((o) => o.status === stage.status);
          const index = PRODUCTION_STAGES.findIndex((s) => s.status === stage.status);
          const next = PRODUCTION_STAGES[index + 1];

          return (
            <div
              key={stage.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(stage.status);
              }}
              onDragLeave={() => setDragOverStage((prev) => (prev === stage.status ? null : prev))}
              onDrop={handleDrop(stage.status)}
              className={cn(
                "rounded-xl border bg-card p-4 shadow-card transition-colors",
                dragOverStage === stage.status && "border-primary bg-primary/5",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{stage.label}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {stageOrders.length}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                <AnimatePresence initial={false}>
                {stageOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    draggable
                    onDragStart={(e) =>
                      (e as unknown as React.DragEvent).dataTransfer.setData("text/plain", order.id)
                    }
                    className="cursor-grab rounded-lg border bg-surface p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selected.includes(order.id)}
                        onCheckedChange={() => toggleSelected(order.id)}
                        aria-label={`Pilih ${order.orderNumber}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{order.orderNumber}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customerName}
                        </p>
                      </div>
                      <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.items.map((i) => i.serviceName).join(", ")}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3.5" /> {fromNow(order.createdAt)}
                      </span>
                      <span className="font-medium tabular-nums">{formatRupiah(order.total)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => {
                        const target = next?.status ?? "completed";
                        moveOrder(order.id, target);
                        toast.success(`${order.orderNumber} → ${STATUS_LABEL[target]}`);
                      }}
                    >
                      {next ? next.label : "Selesai"} <ArrowRight />
                    </Button>
                  </motion.div>
                ))}
                </AnimatePresence>
                {stageOrders.length === 0 && (
                  <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                    Tarik order ke sini
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Total order aktif: {activeOrders.length} order.
      </p>
    </div>
  );
}
