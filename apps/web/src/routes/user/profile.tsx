import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { AppearanceSection } from "@/components/profile/AppearanceSection";
import { AddressesSection } from "@/components/profile/AddressesSection";
import { PaymentMethodsSection } from "@/components/profile/PaymentMethodsSection";
import { OrdersSection } from "@/components/profile/OrdersSection";
import { RecurringOrdersSection } from "@/components/profile/RecurringOrdersSection";
import { CreditCard, ListOrdered, MapPin, Palette, Repeat, User } from "lucide-react";

export const Route = createFileRoute("/user/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/auth/login" });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("profile.title")}</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            {t("profile.profileTab")}
          </TabsTrigger>
          <TabsTrigger value="addresses">
            <MapPin className="mr-2 h-4 w-4" />
            {t("addresses.title")}
          </TabsTrigger>
          <TabsTrigger value="payment-methods">
            <CreditCard className="mr-2 h-4 w-4" />
            {t("paymentMethods.title")}
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ListOrdered className="mr-2 h-4 w-4" />
            {t("orders.title")}
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Repeat className="mr-2 h-4 w-4" />
            {t("recurringOrders.title")}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            {t("profile.appearanceTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <AddressesSection />
        </TabsContent>

        <TabsContent value="payment-methods" className="mt-6">
          <PaymentMethodsSection />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <OrdersSection />
        </TabsContent>

        <TabsContent value="recurring" className="mt-6">
          <RecurringOrdersSection />
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
