import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/laundry/format";
import { useLaundryStore } from "@/store/laundry-store";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan Outlet — LaundryWush" },
      {
        name: "description",
        content:
          "Atur profil outlet, daftar harga layanan kiloan dan satuan, pajak, serta hak akses pengguna laundry.",
      },
      { property: "og:title", content: "Pengaturan Outlet — LaundryWush" },
      {
        property: "og:description",
        content: "Konfigurasi outlet, harga layanan, dan pengguna aplikasi laundry.",
      },
    ],
  }),
  component: SettingsPage,
});

const roleLabel: Record<string, string> = {
  admin: "Admin / Owner",
  kasir: "Kasir",
  operator: "Operator",
};

function SettingsPage() {
  const outlet = useLaundryStore((s) => s.outlet);
  const services = useLaundryStore((s) => s.services);
  const users = useLaundryStore((s) => s.users);
  const updateOutlet = useLaundryStore((s) => s.updateOutlet);
  const upsertService = useLaundryStore((s) => s.upsertService);
  const toggleUserActive = useLaundryStore((s) => s.toggleUserActive);
  const resetDemo = useLaundryStore((s) => s.resetDemo);

  const [draft, setDraft] = useState(outlet);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola profil outlet, harga layanan, dan pengguna.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            resetDemo();
            toast.success("Data demo dikembalikan ke kondisi awal.");
          }}
        >
          <RotateCcw /> Reset data demo
        </Button>
      </div>

      <Tabs defaultValue="outlet">
        <TabsList>
          <TabsTrigger value="outlet">Profil outlet</TabsTrigger>
          <TabsTrigger value="services">Harga layanan</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
        </TabsList>

        <TabsContent value="outlet" className="mt-4">
          <div className="grid gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2">
            <Field label="Nama outlet">
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <Field label="Telepon">
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </Field>
            <Field label="Pajak (%)">
              <Input
                value={String(draft.taxRate)}
                onChange={(e) => setDraft({ ...draft, taxRate: Number(e.target.value) || 0 })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Alamat">
                <Textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Catatan nota">
                <Input
                  value={draft.receiptFooter}
                  onChange={(e) => setDraft({ ...draft, receiptFooter: e.target.value })}
                />
              </Field>
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button
                onClick={() => {
                  updateOutlet(draft);
                  toast.success("Profil outlet diperbarui.");
                }}
              >
                Simpan perubahan
              </Button>
              <Button variant="outline" onClick={() => setDraft(outlet)}>
                Batal
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Estimasi</TableHead>
                  <TableHead className="w-44">Harga</TableHead>
                  <TableHead className="text-right">Aktif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      per {service.unit}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {service.estimatedHours} jam
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-36"
                        value={String(service.pricePerUnit)}
                        onChange={(e) =>
                          upsertService({
                            ...service,
                            pricePerUnit: Number(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRupiah(service.pricePerUnit)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={(checked) =>
                          upsertService({ ...service, isActive: checked })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-sm">{roleLabel[user.role]}</TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => toggleUserActive(user.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
