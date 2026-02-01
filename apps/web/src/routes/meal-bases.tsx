import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { SortingState } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useTranslation } from "react-i18next";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useRestaurant } from "@/context/restaurant-context";
import {
  useCreateMealBase,
  useDeleteMealBase,
  useMealBasesList,
  useUpdateMealBase,
} from "@/hooks/use-meal-bases";
import type { MealBase } from "@/api/meal-bases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/network/LoadingState";
import { ErrorState } from "@/components/network/ErrorState";
import { EmptyState } from "@/components/network/EmptyState";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchFilterDropdown } from "@/components/search/SearchFilterDropdown";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/meal-bases")({
  component: MealBasesPage,
});

type MealBaseFormState = {
  name: string;
  description: string;
  base_price: string;
  is_active: boolean;
  image_asset_id: string;
};

const DEFAULT_FORM: MealBaseFormState = {
  name: "",
  description: "",
  base_price: "",
  is_active: true,
  image_asset_id: "",
};

type StatusOption = {
  labelKey: "mealBases.statusAll" | "mealBases.statusActive" | "mealBases.statusInactive";
  value: "all" | "active" | "inactive";
};

const statusOptions: StatusOption[] = [
  { labelKey: "mealBases.statusAll", value: "all" },
  { labelKey: "mealBases.statusActive", value: "active" },
  { labelKey: "mealBases.statusInactive", value: "inactive" },
];

function MealBasesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, user, loading: authLoading } = useAuth();
  const { selectedRestaurantId } = useRestaurant();

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<{ id: string; name: string } | null>(null);
  const [status, setStatus] = React.useState<(typeof statusOptions)[number]>(statusOptions[0]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingMealBase, setEditingMealBase] = React.useState<MealBase | null>(null);
  const [formState, setFormState] = React.useState<MealBaseFormState>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = React.useState<MealBase | null>(null);
  const [viewingMealBase, setViewingMealBase] = React.useState<MealBase | null>(null);
  const [selectedCategories, setSelectedCategories] = React.useState<{ id: string; name: string }[]>([]);


  const debouncedSearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim());
  }, { wait: 400 });

  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [authLoading, navigate, user]);

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, category, status, sorting]);

  React.useEffect(() => {
    if (!isSheetOpen) {
      setEditingMealBase(null);
      setFormState(DEFAULT_FORM);
      setSelectedCategories([]);
    }
  }, [isSheetOpen]);

  const isActiveFilter = status.value === "all" ? undefined : status.value === "active";

  const mealBasesQuery = useMealBasesList(
    {
      search: search || undefined,
      restaurant_id: selectedRestaurantId ?? undefined,
      category_id: category?.id || undefined,
      is_available: isActiveFilter,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    },
    session?.access_token
  );

  const createMutation = useCreateMealBase(session?.access_token);
  const updateMutation = useUpdateMealBase(session?.access_token);
  const deleteMutation = useDeleteMealBase(session?.access_token);
  const mutationError = createMutation.error || updateMutation.error;
  const mutationErrorMessage = mutationError instanceof Error
    ? mutationError.message
    : t("common.loadError");

  const data = React.useMemo(
    () => mealBasesQuery.data?.meal_bases ?? [],
    [mealBasesQuery.data]
  );
  const total = mealBasesQuery.data?.pagination.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const categories = React.useMemo(() => {
    const unique = new Map<string, string>();
    data.forEach((item) => {
      item.categories.forEach((cat) => {
        if (!unique.has(cat.id)) {
          unique.set(cat.id, cat.name);
        }
      });
    });
    return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const columnHelper = React.useMemo(() => createColumnHelper<MealBase>(), []);
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("mealBases.columns.name"),
        cell: (info) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{info.getValue()}</span>
            {info.row.original.restriction_warnings.length > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              </Badge>
            )}
          </div>
        ),
      }),
      columnHelper.accessor("categories", {
        header: t("mealBases.columns.categories"),
        cell: (info) => {
          const cats = info.getValue();
          if (cats.length === 0) return <span className="text-muted-foreground">-</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {cats.slice(0, 2).map((cat) => (
                <Badge key={cat.id} variant="secondary">
                  {cat.name}
                </Badge>
              ))}
              {cats.length > 2 && (
                <Badge variant="outline">+{cats.length - 2}</Badge>
              )}
            </div>
          );
        },
        enableSorting: false,
      }),
      columnHelper.accessor("base_price", {
        header: t("mealBases.columns.basePrice"),
        cell: (info) => {
          const value = Number(info.getValue());
          return Number.isNaN(value) ? t("common.na") : `$${value.toFixed(2)}`;
        },
      }),
      columnHelper.accessor("is_active", {
        header: t("mealBases.columns.status"),
        cell: (info) => (
          <Badge variant={info.getValue() ? "default" : "secondary"}>
            {info.getValue() ? t("mealBases.statusActive") : t("mealBases.statusInactive")}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: t("mealBases.columns.actions"),
        enableSorting: false,
        cell: (props) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewingMealBase(props.row.original)}
              aria-label={t("mealBases.actions.view")}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => openEditSheet(props.row.original)}
              aria-label={t("mealBases.actions.edit")}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteTarget(props.row.original)}
              aria-label={t("mealBases.actions.delete")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      }),
    ],
    [columnHelper, t]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<MealBase>({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
  });

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const openCreateSheet = () => {
    setEditingMealBase(null);
    setFormState(DEFAULT_FORM);
    setIsSheetOpen(true);
  };

  const openEditSheet = (mealBase: MealBase) => {
    setEditingMealBase(mealBase);
    setFormState({
      name: mealBase.name,
      description: mealBase.description || "",
      base_price: String(mealBase.base_price),
      is_active: mealBase.is_active,
      image_asset_id: mealBase.image_asset_id || "",
    });
    setSelectedCategories(mealBase.categories);
    setIsSheetOpen(true);
  };

  const handleFormChange = (field: keyof MealBaseFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const basePrice = Number(formState.base_price);

    if (!formState.name.trim() || Number.isNaN(basePrice) || basePrice < 0) {
      return;
    }

    if (editingMealBase) {
      await updateMutation.mutateAsync({
        id: editingMealBase.id,
        payload: {
          restaurant_id: selectedRestaurantId!, 
          name: formState.name.trim(),
          description: formState.description.trim() || undefined,
          base_price: basePrice,
          is_active: formState.is_active,
          image_asset_id: formState.image_asset_id.trim() || undefined,
          category_ids: selectedCategories.map((c) => c.id),
        },
      });

    } else {
      if (!selectedRestaurantId) {
        return;
      }
      await createMutation.mutateAsync({
        restaurant_id: selectedRestaurantId,
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        base_price: basePrice,
        is_active: formState.is_active,
        image_asset_id: formState.image_asset_id.trim() || undefined,
        category_ids: selectedCategories.map((c) => c.id),
      });
    }

    setIsSheetOpen(false);
    setFormState(DEFAULT_FORM);
    setEditingMealBase(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (authLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  if (!selectedRestaurantId) {
    return <EmptyState message={t("mealBases.selectRestaurant")} />;
  }

  if (mealBasesQuery.isLoading && data.length === 0) {
    return <LoadingState />;
  }

  if (mealBasesQuery.isError) {
    const message = mealBasesQuery.error instanceof Error
      ? mealBasesQuery.error.message
      : t("common.loadError");
    return <ErrorState message={message} onRetry={() => mealBasesQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("mealBases.title")}</h1>
          <p className="text-muted-foreground">{t("mealBases.subtitle")}</p>
        </div>
        <Button onClick={openCreateSheet}>
          <Plus className="mr-2 size-4" />
          {t("mealBases.new")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t("mealBases.search")}
            className="min-w-[220px]"
          />
          <SearchFilterDropdown
            labelKey="mealBases.category"
            options={categories}
            selected={category}
            onSelect={(value) => setCategory(value)}
            getLabel={(option) => option.name}
            getValue={(option) => option.name}
          />
          <SearchFilterDropdown
            labelKey="mealBases.status"
            options={statusOptions}
            selected={status}
            onSelect={(value) => setStatus(value ?? statusOptions[0])}
            getLabel={(option) => t(option.labelKey)}
            getValue={(option) => option.value}
          />
        </div>

        {data.length === 0 ? (
          <EmptyState message={t("mealBases.empty")} />
        ) : (
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left font-medium">
                        {header.isPlaceholder ? null : (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-2"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && "▲"}
                            {header.column.getIsSorted() === "desc" && "▼"}
                          </button>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {t("mealBases.pagination", {
            page: pagination.pageIndex + 1,
            total: pageCount,
            count: total,
          })}
          {mealBasesQuery.isFetching ? ` · ${t("common.loading")}` : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("mealBases.prev")}
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("mealBases.next")}
          </Button>
        </div>
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingMealBase ? t("mealBases.edit") : t("mealBases.new")}
            </SheetTitle>
            <SheetDescription>{t("mealBases.formDescription")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {mutationError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mutationErrorMessage}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="name">{t("mealBases.form.name")}</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(event) => handleFormChange("name", event.target.value)}
                placeholder={t("mealBases.form.namePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("mealBases.form.description")}</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(event) => handleFormChange("description", event.target.value)}
                placeholder={t("mealBases.form.descriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="basePrice">{t("mealBases.form.basePrice")}</Label>
              <Input
                id="basePrice"
                type="number"
                min={0}
                step={0.01}
                value={formState.base_price}
                onChange={(event) => handleFormChange("base_price", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("mealBases.form.categories")}</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const selected = selectedCategories.some((c) => c.id === cat.id);
                  return (
                    <Badge
                      key={cat.id}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedCategories(selected ? [] : [cat]);
                      }}
                    >
                      {cat.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">{t("mealBases.form.isActive")}</Label>
              <Switch
                id="isActive"
                checked={formState.is_active}
                onCheckedChange={(value) => handleFormChange("is_active", value)}
              />
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingMealBase ? t("mealBases.save") : t("mealBases.create")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* View Detail Dialog */}
      <Dialog open={!!viewingMealBase} onOpenChange={(open) => !open && setViewingMealBase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingMealBase?.name}</DialogTitle>
            <DialogDescription>{viewingMealBase?.description}</DialogDescription>
          </DialogHeader>
          {viewingMealBase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("mealBases.detail.basePrice")}</Label>
                  <p className="text-lg font-semibold">${viewingMealBase.base_price.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("mealBases.detail.status")}</Label>
                  <p>
                    <Badge variant={viewingMealBase.is_active ? "default" : "secondary"}>
                      {viewingMealBase.is_active ? t("mealBases.statusActive") : t("mealBases.statusInactive")}
                    </Badge>
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t("mealBases.detail.categories")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {viewingMealBase.categories.length === 0 ? (
                    <span className="text-sm text-muted-foreground">-</span>
                  ) : (
                    viewingMealBase.categories.map((cat) => (
                      <Badge key={cat.id} variant="secondary">
                        {cat.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              {viewingMealBase.restriction_warnings.length > 0 && (
                <div>
                  <Label className="text-amber-700">{t("mealBases.detail.warnings")}</Label>
                  <div className="mt-2 space-y-2">
                    {viewingMealBase.restriction_warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
                      >
                        <span className="font-medium">{warning.restriction_name}:</span>{" "}
                        {warning.ingredient_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("mealBases.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("mealBases.deleteDescription", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("mealBases.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}