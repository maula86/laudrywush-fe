import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckSquare, Clock, GripVertical } from "lucide-react";
import { useEffect, useMemo, useState, type DragEvent } from "react";
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
import {
  orderApiErrorMessage,
  useOrderViewModels,
  useUpdateOrderStatus,
} from "@/lib/api/hooks/use-orders";
import { formatRupiah, fromNow } from "@/lib/laundry/format";
import { PRODUCTION_STAGES, STATUS_LABEL, type Order, type OrderStatus } from "@/lib/laundry/types";
import { cn } from "@/lib/utils";

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

const getLegalNextStatus = (status: OrderStatus): OrderStatus | undefined => {
  const currentIndex = PRODUCTION_STAGES.findIndex((stage) => stage.status === status);
  if (currentIndex === -1) return undefined;

  return PRODUCTION_STAGES[currentIndex + 1]?.status ?? "completed";
};

const canMoveToStatus = (order: Order, target: OrderStatus): boolean =>
  order.status === target || getLegalNextStatus(order.status) === target;

function ProductionPage() {
  const ordersQuery = useOrderViewModels();
  const updateStatusMutation = useUpdateOrderStatus();

  const [stageFilter, setStageFilter] = useState<"all" | OrderStatus>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [dragOverStage, setDragOverStage] = useState<OrderStatus | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const activeOrders = useMemo(
    () =>
      ordersQuery.orders.filter((order) =>
        PRODUCTION_STAGES.some((s) => s.status === order.status),
      ),
    [ordersQuery.orders],
  );

  const visibleStages = useMemo(
    () =>
      stageFilter === "all"
        ? PRODUCTION_STAGES
        : PRODUCTION_STAGES.filter((stage) => stage.status === stageFilter),
    [stageFilter],
  );

  const activeOrderIds = useMemo(
    () => new Set(activeOrders.map((order) => order.id)),
    [activeOrders],
  );

  const draggedOrder = useMemo(
    () => activeOrders.find((order) => order.id === draggedOrderId),
    [activeOrders, draggedOrderId],
  );

  const isLoading = ordersQuery.isLoading || ordersQuery.customersQuery.isLoading;
  const selectedOrders = selected
    .map((id) => activeOrders.find((order) => order.id === id))
    .filter((order): order is Order => order !== undefined);
  const isUpdating = updateStatusMutation.isPending || isBatchUpdating;

  useEffect(() => {
    setSelected((current) => current.filter((id) => activeOrderIds.has(id)));
  }, [activeOrderIds]);

  const toggleSelected = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const moveOrder = async (order: Order, target: OrderStatus) => {
    if (isUpdating || order.status === target) return;

    try {
      await updateStatusMutation.mutateAsync({ id: order.id, status: target });
      toast.success(`${order.orderNumber} → ${STATUS_LABEL[target]}`);
    } catch (error) {
      toast.error(orderApiErrorMessage(error));
    }
  };

  const applyBatch = async () => {
    if (!selectedOrders.length || isUpdating) return;

    setIsBatchUpdating(true);
    const movableOrders = selectedOrders
      .map((order) => ({ order, target: getLegalNextStatus(order.status) }))
      .filter(
        (entry): entry is { order: Order; target: OrderStatus } => entry.target !== undefined,
      );

    const results = await Promise.allSettled(
      movableOrders.map(({ order, target }) =>
        updateStatusMutation.mutateAsync({ id: order.id, status: target }),
      ),
    );

    const succeededOrderIds = new Set(
      results
        .map((result, index) => {
          if (result.status !== "fulfilled") return undefined;
          return movableOrders[index]?.order.id;
        })
        .filter((id): id is string => id !== undefined),
    );
    const failures = results.filter((result) => result.status === "rejected");

    setSelected((current) => current.filter((id) => !succeededOrderIds.has(id)));
    setIsBatchUpdating(false);

    if (failures.length === 0) {
      toast.success(`${succeededOrderIds.size} order dimajukan satu tahap.`);
      return;
    }

    toast.error(
      `${succeededOrderIds.size} berhasil, ${failures.length} gagal. ${orderApiErrorMessage(failures[0]?.reason)}`,
    );
  };

  const handleDrop = (status: OrderStatus) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOverStage(null);
    setDraggedOrderId(null);

    const id = event.dataTransfer.getData("text/plain");
    const order = activeOrders.find((activeOrder) => activeOrder.id === id);
    if (!order) return;
    if (order.status === status) return;

    if (!canMoveToStatus(order, status)) {
      toast.error("Order harus dipindahkan satu tahap demi satu tahap.");
      return;
    }

    void moveOrder(order, status);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Papan Produksi</h1>
        <p className="text-sm text-muted-foreground">
          Tarik kartu order ke tahap berikutnya, atau pilih beberapa order untuk dimajukan satu
          tahap.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-card">
        <Select
          value={stageFilter}
          onValueChange={(value) => {
            if (value === "all") {
              setStageFilter(value);
              return;
            }

            const stage = PRODUCTION_STAGES.find((item) => item.status === value);
            if (stage) {
              setStageFilter(stage.status);
            }
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tahap</SelectItem>
            {PRODUCTION_STAGES.map((stage) => (
              <SelectItem key={stage.status} value={stage.status}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{selected.length} dipilih</span>
          <Button
            disabled={selected.length === 0 || isUpdating}
            onClick={() => {
              void applyBatch();
            }}
          >
            <CheckSquare /> Majukan tahap
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          Memuat order produksi…
        </p>
      )}

      {ordersQuery.isError && (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-destructive shadow-card">
          {orderApiErrorMessage(ordersQuery.error)}
        </p>
      )}

      {!isLoading && !ordersQuery.isError && activeOrders.length === 0 && (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground shadow-card">
          Belum ada order aktif di papan produksi.
        </p>
      )}

      {!isLoading && !ordersQuery.isError && activeOrders.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            stageFilter === "all" ? "md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6" : "max-w-md",
          )}
        >
          {visibleStages.map((stage) => {
            const stageOrders = activeOrders.filter((order) => order.status === stage.status);
            const index = PRODUCTION_STAGES.findIndex(
              (productionStage) => productionStage.status === stage.status,
            );
            const next = PRODUCTION_STAGES[index + 1];
            const canDropHere = draggedOrder ? canMoveToStatus(draggedOrder, stage.status) : false;

            return (
              <div
                key={stage.status}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStage(canDropHere ? stage.status : null);
                }}
                onDragLeave={() =>
                  setDragOverStage((prev) => (prev === stage.status ? null : prev))
                }
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
                        onDragStartCapture={(event: DragEvent<HTMLDivElement>) => {
                          setDraggedOrderId(order.id);
                          event.dataTransfer.setData("text/plain", order.id);
                        }}
                        onDragEnd={() => {
                          setDraggedOrderId(null);
                          setDragOverStage(null);
                        }}
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
                          {order.items.map((item) => item.serviceName).join(", ")}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-3.5" /> {fromNow(order.createdAt)}
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatRupiah(order.total)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                          disabled={isUpdating}
                          onClick={() => {
                            const target = next?.status ?? "completed";
                            void moveOrder(order, target);
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
      )}

      <p className="text-xs text-muted-foreground">
        Total order aktif: {activeOrders.length} order.
      </p>
    </div>
  );
}
