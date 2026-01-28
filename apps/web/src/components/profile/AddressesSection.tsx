import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/use-addresses";
import { useCities, useCountries, useRegions } from "@/hooks/use-locations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddressesSection() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const addressesQuery = useAddresses(accessToken);
  const createAddress = useCreateAddress(accessToken);
  const deleteAddress = useDeleteAddress(accessToken);
  const setDefaultAddress = useSetDefaultAddress(accessToken);

  const countriesQuery = useCountries();
  const [countryId, setCountryId] = React.useState<string>("");
  const regionsQuery = useRegions(countryId);
  const [regionId, setRegionId] = React.useState<string>("");
  const citiesQuery = useCities(regionId);
  const [cityId, setCityId] = React.useState<string>("");

  const [formState, setFormState] = React.useState({
    label: "",
    line1: "",
    line2: "",
    postalCode: "",
    notes: "",
    isDefault: false,
  });

  React.useEffect(() => {
    if (!countriesQuery.data?.countries?.length) return;
    if (!countryId) {
      setCountryId(countriesQuery.data.countries[0].id);
    }
  }, [countriesQuery.data?.countries, countryId]);

  React.useEffect(() => {
    if (!regionsQuery.data?.regions?.length) return;
    if (!regionId) {
      setRegionId(regionsQuery.data.regions[0].id);
    }
  }, [regionsQuery.data?.regions, regionId]);

  React.useEffect(() => {
    if (!citiesQuery.data?.cities?.length) return;
    if (!cityId) {
      setCityId(citiesQuery.data.cities[0].id);
    }
  }, [citiesQuery.data?.cities, cityId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!countryId || !regionId || !cityId) return;
    await createAddress.mutateAsync({
      label: formState.label || undefined,
      isDefault: formState.isDefault,
      line1: formState.line1,
      line2: formState.line2 || undefined,
      cityId,
      regionId,
      countryId,
      postalCode: formState.postalCode || undefined,
      notes: formState.notes || undefined,
    });
    setFormState({
      label: "",
      line1: "",
      line2: "",
      postalCode: "",
      notes: "",
      isDefault: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">{t("addresses.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("addresses.formDescription")}</p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            placeholder={t("addresses.label")}
            value={formState.label}
            onChange={(event) => setFormState((prev) => ({ ...prev, label: event.target.value }))}
          />
          <Input
            placeholder={t("addresses.line1")}
            value={formState.line1}
            onChange={(event) => setFormState((prev) => ({ ...prev, line1: event.target.value }))}
            required
          />
          <Input
            placeholder={t("addresses.line2")}
            value={formState.line2}
            onChange={(event) => setFormState((prev) => ({ ...prev, line2: event.target.value }))}
          />
          <Input
            placeholder={t("addresses.postalCode")}
            value={formState.postalCode}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, postalCode: event.target.value }))
            }
          />
          <Select
            value={countryId}
            onValueChange={(value) => {
              setCountryId(value);
              setRegionId("");
              setCityId("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("addresses.country")} />
            </SelectTrigger>
            <SelectContent>
              {countriesQuery.data?.countries?.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name_es}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={regionId}
            onValueChange={(value) => {
              setRegionId(value);
              setCityId("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("addresses.region")} />
            </SelectTrigger>
            <SelectContent>
              {regionsQuery.data?.regions?.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityId} onValueChange={(value) => setCityId(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("addresses.city")} />
            </SelectTrigger>
            <SelectContent>
              {citiesQuery.data?.cities?.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder={t("addresses.notes")}
            value={formState.notes}
            onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
          />

          <Button type="submit" disabled={createAddress.isPending}>
            {createAddress.isPending ? t("addresses.saving") : t("addresses.save")}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {addressesQuery.data?.addresses?.length ? (
          addressesQuery.data.addresses.map((address) => (
            <div key={address.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {address.label || address.address.line1}
                    {address.isDefault ? ` · ${t("addresses.setDefault")}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.address.line1}, {address.address.city.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultAddress.mutate(address.id)}
                    >
                      {t("addresses.setDefault")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAddress.mutate(address.id)}
                  >
                    {t("addresses.delete")}
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t("addresses.empty")}</p>
        )}
      </div>
    </div>
  );
}
