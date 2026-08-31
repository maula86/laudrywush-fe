import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { useSessionUser } from "@/lib/api/auth-store";
import { ApiError } from "@/lib/api/client";
import { useOutlet, useUpdateOutlet } from "@/lib/api/hooks/use-outlet";
import { useServices, useUpdateService } from "@/lib/api/hooks/use-services";
import {
  useCreateUser,
  useToggleUserActive,
  useUsers,
  userApiErrorMessage,
} from "@/lib/api/hooks/use-users";
import { ROLES, type Outlet, type Role, type UpdateOutletRequest } from "@/lib/api/types";
import { formatRupiah } from "@/lib/laundry/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

type OutletDraft = {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  receiptFooter: string;
};
type ServicePriceDrafts = Record<string, string>;
type NewUserDraft = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
};
type MutableOutletPatch = {
  -readonly [Key in keyof UpdateOutletRequest]: UpdateOutletRequest[Key];
};

const emptyUserDraft = (): NewUserDraft => ({
  name: "",
  email: "",
  password: "",
  phone: "",
  role: "kasir",
});

const toOutletDraft = (outlet: Outlet): OutletDraft => ({
  name: outlet.name,
  address: outlet.address,
  phone: outlet.phone,
  email: outlet.email,
  taxRate: outlet.taxRate,
  receiptFooter: outlet.receiptFooter,
});

const apiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
};

const buildOutletPatch = (
  draft: OutletDraft,
  current: Outlet,
  role: string | undefined,
): UpdateOutletRequest => {
  const patch: MutableOutletPatch = {};

  if (draft.phone !== current.phone) patch.phone = draft.phone;
  if (draft.receiptFooter !== current.receiptFooter) patch.receiptFooter = draft.receiptFooter;

  if (role === "kasir") return patch;

  if (draft.name !== current.name) patch.name = draft.name;
  if (draft.address !== current.address) patch.address = draft.address;
  if (draft.email !== current.email) patch.email = draft.email;
  if (draft.taxRate !== current.taxRate) patch.taxRate = draft.taxRate;

  return patch;
};

function SettingsPage() {
  const user = useSessionUser();
  const outletQuery = useOutlet();
  const updateOutletMutation = useUpdateOutlet();
  const servicesQuery = useServices({ includeInactive: user?.role === "admin" });
  const updateServiceMutation = useUpdateService();
  const isAdmin = user?.role === "admin";
  const usersQuery = useUsers();
  const createUserMutation = useCreateUser();
  const toggleUserActiveMutation = useToggleUserActive();

  const [draft, setDraft] = useState<OutletDraft | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<ServicePriceDrafts>({});
  const [userDraft, setUserDraft] = useState<NewUserDraft>(emptyUserDraft);
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);

  useEffect(() => {
    if (!outletQuery.data) return;
    setDraft(toOutletDraft(outletQuery.data));
  }, [outletQuery.data]);

  useEffect(() => {
    setPriceDrafts((currentDrafts) => {
      const nextDrafts: ServicePriceDrafts = {};
      for (const service of services) {
        nextDrafts[service.id] = currentDrafts[service.id] ?? String(service.pricePerUnit);
      }
      return nextDrafts;
    });
  }, [services]);

  const outlet = outletQuery.data;
  const isKasir = user?.role === "kasir";
  const outletFieldsDisabled = isKasir || updateOutletMutation.isPending;

  const saveOutlet = async () => {
    if (!outlet || !draft) return;

    const patch = buildOutletPatch(draft, outlet, user?.role);
    if (Object.keys(patch).length === 0) {
      toast.info("Tidak ada perubahan profil outlet.");
      return;
    }

    try {
      await updateOutletMutation.mutateAsync(patch);
      toast.success("Profil outlet diperbarui.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const resetOutletDraft = () => {
    if (!outlet) return;
    setDraft(toOutletDraft(outlet));
  };

  const saveServicePrice = async (serviceId: string, currentPrice: number) => {
    const rawPrice = priceDrafts[serviceId];
    if (rawPrice === undefined) return;

    const price = Math.max(0, Number(rawPrice) || 0);
    setPriceDrafts((currentDrafts) => ({ ...currentDrafts, [serviceId]: String(price) }));
    if (price === currentPrice) return;

    try {
      await updateServiceMutation.mutateAsync({ id: serviceId, body: { pricePerUnit: price } });
      toast.success("Harga layanan diperbarui.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
      setPriceDrafts((currentDrafts) => ({ ...currentDrafts, [serviceId]: String(currentPrice) }));
    }
  };

  const toggleServiceActive = async (serviceId: string, isActive: boolean) => {
    try {
      await updateServiceMutation.mutateAsync({ id: serviceId, body: { isActive } });
      toast.success(isActive ? "Layanan diaktifkan." : "Layanan dinonaktifkan.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const submitNewUser = async () => {
    if (createUserMutation.isPending) return;

    const name = userDraft.name.trim();
    const email = userDraft.email.trim();
    const phone = userDraft.phone.trim();

    if (!name || !email) {
      toast.error("Nama dan email pengguna wajib diisi.");
      return;
    }
    // The backend enforces a minimum of 8 characters; check first for a clearer message.
    if (userDraft.password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        name,
        email,
        password: userDraft.password,
        role: userDraft.role,
        ...(phone ? { phone } : {}),
      });
      toast.success(`Pengguna ${name} dibuat.`);
      setUserDraft(emptyUserDraft());
    } catch (error) {
      toast.error(userApiErrorMessage(error));
    }
  };

  const toggleUser = async (userId: string, nextActive: boolean) => {
    if (toggleUserActiveMutation.isPending) return;

    try {
      await toggleUserActiveMutation.mutateAsync(userId);
      toast.success(nextActive ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan.");
    } catch (error) {
      toast.error(userApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola profil outlet, harga layanan, dan pengguna.
          </p>
        </div>
      </div>

      <Tabs defaultValue="outlet">
        <TabsList>
          <TabsTrigger value="outlet">Profil outlet</TabsTrigger>
          <TabsTrigger value="services">Harga layanan</TabsTrigger>
          <TabsTrigger value="users">Pengguna</TabsTrigger>
        </TabsList>

        <TabsContent value="outlet" className="mt-4">
          {outletQuery.isLoading ? (
            <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground shadow-card">
              Memuat profil outlet…
            </div>
          ) : outletQuery.isError ? (
            <div className="rounded-xl border bg-card p-5 text-sm text-destructive shadow-card">
              {apiErrorMessage(outletQuery.error)}
            </div>
          ) : draft ? (
            <div className="grid gap-4 rounded-xl border bg-card p-5 shadow-card sm:grid-cols-2">
              {isKasir && (
                <p className="sm:col-span-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Peran kasir hanya dapat mengubah telepon dan catatan nota outlet.
                </p>
              )}
              <Field label="Nama outlet">
                <Input
                  value={draft.name}
                  disabled={outletFieldsDisabled}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Telepon">
                <Input
                  value={draft.phone}
                  disabled={updateOutletMutation.isPending}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <Input
                  value={draft.email}
                  disabled={outletFieldsDisabled}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </Field>
              <Field label="Pajak (%)">
                <Input
                  value={String(draft.taxRate)}
                  disabled={outletFieldsDisabled}
                  onChange={(e) => setDraft({ ...draft, taxRate: Number(e.target.value) || 0 })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Alamat">
                  <Textarea
                    rows={2}
                    value={draft.address}
                    disabled={outletFieldsDisabled}
                    onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Catatan nota">
                  <Input
                    value={draft.receiptFooter}
                    disabled={updateOutletMutation.isPending}
                    onChange={(e) => setDraft({ ...draft, receiptFooter: e.target.value })}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button onClick={() => void saveOutlet()} disabled={updateOutletMutation.isPending}>
                  Simpan perubahan
                </Button>
                <Button
                  variant="outline"
                  onClick={resetOutletDraft}
                  disabled={updateOutletMutation.isPending}
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : null}
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
                {servicesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      Memuat layanan…
                    </TableCell>
                  </TableRow>
                ) : servicesQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-destructive">
                      {apiErrorMessage(servicesQuery.error)}
                    </TableCell>
                  </TableRow>
                ) : services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      Belum ada layanan.
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((service) => (
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
                          value={priceDrafts[service.id] ?? String(service.pricePerUnit)}
                          disabled={updateServiceMutation.isPending}
                          onChange={(e) =>
                            setPriceDrafts((currentDrafts) => ({
                              ...currentDrafts,
                              [service.id]: e.target.value,
                            }))
                          }
                          onBlur={() => void saveServicePrice(service.id, service.pricePerUnit)}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatRupiah(Number(priceDrafts[service.id]) || service.pricePerUnit)}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={service.isActive}
                          disabled={updateServiceMutation.isPending}
                          onCheckedChange={(checked) =>
                            void toggleServiceActive(service.id, checked)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          {!isAdmin ? (
            <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground shadow-card">
              Hanya admin yang dapat mengelola pengguna. Hubungi admin outlet untuk menambah atau
              menonaktifkan akun staf.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-5 shadow-card">
                <h2 className="text-sm font-semibold">Tambah pengguna</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Nama">
                    <Input
                      value={userDraft.name}
                      disabled={createUserMutation.isPending}
                      onChange={(e) => setUserDraft({ ...userDraft, name: e.target.value })}
                      placeholder="Sari Kasir"
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      autoComplete="off"
                      value={userDraft.email}
                      disabled={createUserMutation.isPending}
                      onChange={(e) => setUserDraft({ ...userDraft, email: e.target.value })}
                      placeholder="nama@laundrywush.local"
                    />
                  </Field>
                  <Field label="Password (min. 8 karakter)">
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={userDraft.password}
                      disabled={createUserMutation.isPending}
                      onChange={(e) => setUserDraft({ ...userDraft, password: e.target.value })}
                    />
                  </Field>
                  <Field label="Nomor HP (opsional)">
                    <Input
                      value={userDraft.phone}
                      disabled={createUserMutation.isPending}
                      onChange={(e) => setUserDraft({ ...userDraft, phone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                    />
                  </Field>
                  <Field label="Peran">
                    <Select
                      value={userDraft.role}
                      disabled={createUserMutation.isPending}
                      onValueChange={(value) => {
                        const nextRole = ROLES.find((role) => role === value);
                        if (nextRole) setUserDraft({ ...userDraft, role: nextRole });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabel[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-end">
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => void submitNewUser()}
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? "Menyimpan…" : "Tambah pengguna"}
                    </Button>
                  </div>
                </div>
              </div>

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
                    {usersQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground">
                          Memuat pengguna…
                        </TableCell>
                      </TableRow>
                    ) : usersQuery.isError ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-destructive">
                          {userApiErrorMessage(usersQuery.error)}
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-muted-foreground">
                          Belum ada pengguna.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((staff) => {
                        // Deactivating your own account would lock you out immediately, because
                        // the backend revalidates the session on every request.
                        const isSelf = staff.id === user?.id;

                        return (
                          <TableRow key={staff.id}>
                            <TableCell className="font-medium">
                              {staff.name}
                              {isSelf && (
                                <span className="ml-2 text-xs text-muted-foreground">(Anda)</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {staff.email}
                            </TableCell>
                            <TableCell className="text-sm">{roleLabel[staff.role]}</TableCell>
                            <TableCell className="text-right">
                              <Switch
                                checked={staff.isActive}
                                disabled={isSelf || toggleUserActiveMutation.isPending}
                                aria-label={`Ubah status ${staff.name}`}
                                onCheckedChange={(checked) => void toggleUser(staff.id, checked)}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
