import type { CatalogBase } from "@/api/catalog";
import { Card, CardContent } from "@/components/ui/card";

function moneyCRC(value: number) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value);
}

export function BaseCard({ base }: { base: CatalogBase }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-[16/9] w-full bg-muted">
        {base.image_url ? (
          <img
            src={base.image_url}
            alt={base.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{base.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{base.cuisine_type}</p>
          </div>

          <div className="shrink-0 text-sm font-medium">
            {moneyCRC(Number(base.base_price ?? 0))}
          </div>
        </div>

        {base.description ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {base.description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
