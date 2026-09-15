"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Palette, Plus, Power, UserX } from "lucide-react";
import {
  Button,
  Chip,
  DataGrid,
  Drawer,
  DrawerSection,
  EmptyState,
  SearchInput,
  Tabs,
  Toolbar,
  useToast,
  type GridColumn,
} from "@/components/admin/ui";
import VehicleFormDialog, { type VehicleFormValues } from "./VehicleFormDialog";

export interface VehicleRow {
  id: string;
  category_id: string | null;
  plate_number: string | null;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  image_url: string | null;
  is_active: boolean;
  vehicle_categories: { name: string } | null;
}

type Tab = "active" | "inactive" | "all";

const emptyForm = (categoryId: string): VehicleFormValues => ({
  category_id: categoryId,
  plate_number: "",
  brand: "Mercedes-Benz",
  model: "Vito Tourer",
  year: String(new Date().getFullYear()),
  color: "",
  image_url: "",
});

/** Araçlar: the physical fleet. docs/admin-tasarim.md, bölüm 5.6. */
export default function VehiclesScreen({
  vehicles,
  categories,
}: {
  vehicles: VehicleRow[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<VehicleFormValues | null>(null);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({ active: vehicles.filter((v) => v.is_active).length, inactive: vehicles.filter((v) => !v.is_active).length, all: vehicles.length }),
    [vehicles]
  );

  const rows = useMemo(() => {
    const query = q.trim().toLocaleLowerCase("tr-TR");
    return vehicles
      .filter((v) => (tab === "active" ? v.is_active : tab === "inactive" ? !v.is_active : true))
      .filter(
        (v) =>
          !query ||
          `${v.brand} ${v.model} ${v.plate_number ?? ""}`.toLocaleLowerCase("tr-TR").includes(query)
      )
      .sort((a, b) => (a.plate_number ?? "").localeCompare(b.plate_number ?? ""));
  }, [vehicles, tab, q]);

  const open = vehicles.find((v) => v.id === openId) ?? null;
  const refresh = () => router.refresh();

  const toggle = async (v: VehicleRow) => {
    setTogglingId(v.id);
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: "vehicles", action: "toggle", id: v.id }),
    });
    setTogglingId(null);
    if (res.ok) {
      toast(v.is_active ? "Araç pasife alındı." : "Araç aktifleştirildi.");
      refresh();
    } else {
      toast("İşlem yapılamadı.", "error");
    }
  };

  const columns: GridColumn<VehicleRow>[] = [
    {
      key: "vehicle",
      header: "Araç",
      width: "minmax(180px,1.3fr)",
      area: "body",
      cell: (v) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-adm-sm border border-adm-line-2 bg-adm-surface-2">
            {v.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.image_url} alt="" className="h-full w-full object-contain" />
            ) : (
              <Car size={16} aria-hidden="true" className="text-adm-faint" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold">
              {v.brand} {v.model}
            </div>
            <div className="truncate text-xs text-adm-muted">{v.color || "—"}</div>
          </div>
        </div>
      ),
    },
    { key: "plate", header: "Plaka", width: "120px", area: "top-start", cell: (v) => <span className="font-mono text-[13px] font-semibold">{v.plate_number || "—"}</span> },
    { key: "category", header: "Araç tipi", width: "minmax(120px,1fr)", area: "foot-start", cell: (v) => <span className="truncate text-[13px]">{v.vehicle_categories?.name ?? "—"}</span> },
    { key: "year", header: "Yıl", width: "70px", area: "foot-end", cell: (v) => <span className="text-[13px] text-adm-ink-2">{v.year ?? "—"}</span> },
    {
      key: "status",
      header: "Durum",
      width: "100px",
      area: "top-end",
      cell: (v) => (
        <Chip tone={v.is_active ? "green" : "neutral"} plain>
          {v.is_active ? "Aktif" : "Pasif"}
        </Chip>
      ),
    },
  ];

  return (
    <>
      <div className="mb-5 mt-3 flex flex-wrap items-end gap-4">
        <h1 className="text-[21px] font-bold tracking-[-0.02em] min-[761px]:text-2xl">Araçlar</h1>
        <Button
          variant="primary"
          icon={Plus}
          compact
          className="ms-auto"
          onClick={() => setCreating(true)}
          disabled={categories.length === 0}
        >
          Araç ekle
        </Button>
      </div>

      <Tabs
        label="Araç listesi"
        value={tab}
        onChange={setTab}
        items={[
          { key: "active", label: "Aktif", count: counts.active },
          { key: "inactive", label: "Pasif", count: counts.inactive },
          { key: "all", label: "Tümü" },
        ]}
      />
      <Toolbar>
        <SearchInput value={q} onChange={setQ} placeholder="Plaka, marka veya model" />
      </Toolbar>

      <DataGrid
        label="Araçlar"
        columns={columns}
        rows={rows}
        rowKey={(v) => v.id}
        onRowClick={(v) => setOpenId(v.id)}
        activeKey={openId}
        empty={<EmptyState compact icon={Car} title="Araç bulunamadı" />}
      />

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        label="Araç"
        top={
          open && (
            <>
              <span className="font-mono text-[13px] font-semibold">{open.plate_number || "Plakasız"}</span>
              <Chip tone={open.is_active ? "green" : "neutral"} plain>
                {open.is_active ? "Aktif" : "Pasif"}
              </Chip>
            </>
          )
        }
        title={open && `${open.brand} ${open.model}`}
        meta={open?.vehicle_categories?.name}
        footer={
          open && (
            <>
              <Button
                icon={open.is_active ? UserX : Power}
                loading={togglingId === open.id}
                onClick={() => toggle(open)}
              >
                {open.is_active ? "Pasife al" : "Aktifleştir"}
              </Button>
              <Button
                variant="primary"
                className="ms-auto"
                onClick={() =>
                  setEditing({
                    id: open.id,
                    category_id: open.category_id ?? categories[0]?.id ?? "",
                    plate_number: open.plate_number ?? "",
                    brand: open.brand,
                    model: open.model,
                    year: open.year ? String(open.year) : "",
                    color: open.color ?? "",
                    image_url: open.image_url ?? "",
                  })
                }
              >
                Düzenle
              </Button>
            </>
          )
        }
      >
        {open && (
          <DrawerSection title="Görsel">
            {open.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.image_url} alt="" className="max-h-48 rounded-adm border border-adm-line-2 object-contain" />
            ) : (
              <p className="flex items-center gap-2 text-[13px] text-adm-muted">
                <Palette size={14} aria-hidden="true" />
                Görsel yüklenmedi
              </p>
            )}
          </DrawerSection>
        )}
      </Drawer>

      {(creating || editing) && (
        <VehicleFormDialog
          initial={editing ?? emptyForm(categories[0]?.id ?? "")}
          categories={categories}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </>
  );
}
