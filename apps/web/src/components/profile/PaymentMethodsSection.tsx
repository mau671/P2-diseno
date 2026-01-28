import * as React from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreatePaymentMethod,
  useDeletePaymentMethod,
  usePaymentMethods,
  useSetDefaultPaymentMethod,
} from "@/hooks/use-payment-methods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PaymentMethodsSection() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const paymentMethodsQuery = usePaymentMethods(accessToken);
  const createPaymentMethod = useCreatePaymentMethod(accessToken);
  const deletePaymentMethod = useDeletePaymentMethod(accessToken);
  const setDefaultPaymentMethod = useSetDefaultPaymentMethod(accessToken);

  const [formState, setFormState] = React.useState({
    type: "card",
    name: "",
    last_four: "",
    expiry_month: "",
    expiry_year: "",
    is_default: false,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createPaymentMethod.mutateAsync({
      type: formState.type,
      name: formState.name,
      last_four: formState.last_four || undefined,
      expiry_month: formState.expiry_month ? Number(formState.expiry_month) : undefined,
      expiry_year: formState.expiry_year ? Number(formState.expiry_year) : undefined,
      is_default: formState.is_default,
    });
    setFormState({
      type: "card",
      name: "",
      last_four: "",
      expiry_month: "",
      expiry_year: "",
      is_default: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold">{t("paymentMethods.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("paymentMethods.note")}</p>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            placeholder={t("paymentMethods.name")}
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            placeholder={t("paymentMethods.lastFour")}
            value={formState.last_four}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, last_four: event.target.value }))
            }
          />
          <Input
            placeholder={t("paymentMethods.expiryMonth")}
            value={formState.expiry_month}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, expiry_month: event.target.value }))
            }
          />
          <Input
            placeholder={t("paymentMethods.expiryYear")}
            value={formState.expiry_year}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, expiry_year: event.target.value }))
            }
          />
          <Button type="submit" disabled={createPaymentMethod.isPending}>
            {createPaymentMethod.isPending ? t("paymentMethods.saving") : t("paymentMethods.save")}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {paymentMethodsQuery.data?.payment_methods?.length ? (
          paymentMethodsQuery.data.payment_methods.map((method) => (
            <div key={method.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{method.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.lastFour ? `•••• ${method.lastFour}` : t("common.na")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultPaymentMethod.mutate(method.id)}
                    >
                      {t("paymentMethods.setDefault")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePaymentMethod.mutate(method.id)}
                  >
                    {t("paymentMethods.delete")}
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t("paymentMethods.empty")}</p>
        )}
      </div>
    </div>
  );
}
