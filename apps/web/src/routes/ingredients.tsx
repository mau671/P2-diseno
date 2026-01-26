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
import { Pencil, Plus, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import {
  useCreateIngredient,
  useDeleteIngredient,
  useIngredientsList,
  useUpdateIngredient,
} from "@/hooks/use-ingredients";
import type { Ingredient } from "@/api/ingredients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/ingredients")({
  component: IngredientsPage,
});

type IngredientFormState = {
  name: string;
  category: string;
  unit_price: string;
  stock: string;
  is_active: boolean;
};

const DEFAULT_FORM: IngredientFormState = {
  name: "",
  category: "",
  unit_price: "",
  stock: "",
  is_active: true,
};

type StatusOption = {
  labelKey: "ingredients.statusAll" | "ingredients.statusActive" | "ingredients.statusInactive";
  value: "all" | "active" | "inactive";
};

const statusOptions: StatusOption[] = [
  { labelKey: "ingredients.statusAll", value: "all" },
  { labelKey: "ingredients.statusActive", value: "active" },
  { labelKey: "ingredients.statusInactive", value: "inactive" },
];

function IngredientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, user, loading: authLoading } = useAuth();

  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<(typeof statusOptions)[number]>(statusOptions[0]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 });

  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
  const [formState, setFormState] = React.useState<IngredientFormState>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = React.useState<Ingredient | null>(null);

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
      setEditingIngredient(null);
      setFormState(DEFAULT_FORM);
    }
  }, [isSheetOpen]);

  const sortKey = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";
  const isActiveFilter = status.value === "all" ? null : status.value === "active";

  const ingredientsQuery = useIngredientsList(
    {
      search: search || undefined,
      category: category || undefined,
      is_active: isActiveFilter,
      page: pagination.pageIndex + 1,
      page_size: pagination.pageSize,
      sort: sortKey,
      order: sortKey ? sortOrder : undefined,
    },
    session?.access_token
  );

  const createMutation = useCreateIngredient(session?.access_token);
  const updateMutation = useUpdateIngredient(session?.access_token);
  const deleteMutation = useDeleteIngredient(session?.access_token);
  const mutationError = createMutation.error || updateMutation.error;
  const mutationErrorMessage = mutationError instanceof Error
    ? mutationError.message
    : t("common.loadError");

  const data = React.useMemo(
    () => ingredientsQuery.data?.items ?? [],
    [ingredientsQuery.data]
  );
  const total = ingredientsQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const categories = React.useMemo(() => {
    const unique = new Set<string>();
    data.forEach((item) => unique.add(item.category));
    return Array.from(unique);
  }, [data]);

  const columnHelper = React.useMemo(() => createColumnHelper<Ingredient>(), []);
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("ingredients.columns.name"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("category", {
        header: t("ingredients.columns.category"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("unit_price", {
        header: t("ingredients.columns.unitPrice"),
        cell: (info) => {
          const value = Number(info.getValue());
          return Number.isNaN(value) ? t("common.na") : value.toFixed(2);
        },
      }),
      columnHelper.accessor("stock", {
        header: t("ingredients.columns.stock"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("is_active", {
        header: t("ingredients.columns.status"),
        cell: (info) => (info.getValue() ? t("ingredients.statusActive") : t("ingredients.statusInactive")),
      }),
      columnHelper.display({
        id: "actions",
        header: t("ingredients.columns.actions"),
        enableSorting: false,
        cell: (props) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => openEditSheet(props.row.original)}
              aria-label={t("ingredients.actions.edit")}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteTarget(props.row.original)}
              aria-label={t("ingredients.actions.delete")}
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
  const table = useReactTable<Ingredient>({
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
    setEditingIngredient(null);
    setFormState(DEFAULT_FORM);
    setIsSheetOpen(true);
  };

  const openEditSheet = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormState({
      name: ingredient.name,
      category: ingredient.category,
      unit_price: ingredient.unit_price,
      stock: String(ingredient.stock),
      is_active: ingredient.is_active,
    });
    setIsSheetOpen(true);
  };

  const handleFormChange = (field: keyof IngredientFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const unitPrice = Number(formState.unit_price);
    const stock = Number(formState.stock);

    if (!formState.name.trim() || !formState.category.trim() || Number.isNaN(unitPrice) || Number.isNaN(stock)) {
      return;
    }

    if (editingIngredient) {
      await updateMutation.mutateAsync({
        id: editingIngredient.id,
        payload: {
          name: formState.name.trim(),
          category: formState.category.trim(),
          unit_price: unitPrice,
          stock,
          is_active: formState.is_active,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: formState.name.trim(),
        category: formState.category.trim(),
        unit_price: unitPrice,
        stock,
        is_active: formState.is_active,
      });
    }

    setIsSheetOpen(false);
    setFormState(DEFAULT_FORM);
    setEditingIngredient(null);
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

  if (ingredientsQuery.isLoading && data.length === 0) {
    return <LoadingState />;
  }

  if (ingredientsQuery.isError) {
    const message = ingredientsQuery.error instanceof Error
      ? ingredientsQuery.error.message
      : t("common.loadError");
    return <ErrorState message={message} onRetry={() => ingredientsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("ingredients.title")}</h1>
          <p className="text-muted-foreground">{t("ingredients.subtitle")}</p>
        </div>
        <Button onClick={openCreateSheet}>
          <Plus className="mr-2 size-4" />
          {t("ingredients.new")}
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder={t("ingredients.search")}
            className="min-w-[220px]"
          />
          <SearchFilterDropdown
            labelKey="ingredients.category"
            options={categories}
            selected={category}
            onSelect={(value) => setCategory(value)}
            getLabel={(option) => option}
            getValue={(option) => option}
          />
          <SearchFilterDropdown
            labelKey="ingredients.status"
            options={statusOptions}
            selected={status}
            onSelect={(value) => setStatus(value ?? statusOptions[0])}
            getLabel={(option) => t(option.labelKey)}
            getValue={(option) => option.value}
          />
        </div>

        {data.length === 0 ? (
          <EmptyState message={t("ingredients.empty")} />
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
          {t("ingredients.pagination", {
            page: pagination.pageIndex + 1,
            total: pageCount,
            count: total,
          })}
          {ingredientsQuery.isFetching ? ` · ${t("common.loading")}` : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("ingredients.prev")}
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("ingredients.next")}
          </Button>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingIngredient ? t("ingredients.edit") : t("ingredients.new")}
            </SheetTitle>
            <SheetDescription>{t("ingredients.formDescription")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4">
            {mutationError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mutationErrorMessage}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="name">{t("ingredients.form.name")}</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(event) => handleFormChange("name", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t("ingredients.form.category")}</Label>
              <Input
                id="category"
                value={formState.category}
                onChange={(event) => handleFormChange("category", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">{t("ingredients.form.unitPrice")}</Label>
              <Input
                id="unitPrice"
                type="number"
                min={0}
                value={formState.unit_price}
                onChange={(event) => handleFormChange("unit_price", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">{t("ingredients.form.stock")}</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                value={formState.stock}
                onChange={(event) => handleFormChange("stock", event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">{t("ingredients.form.isActive")}</Label>
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
              {editingIngredient ? t("ingredients.save") : t("ingredients.create")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("ingredients.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("ingredients.deleteDescription", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("ingredients.actions.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
