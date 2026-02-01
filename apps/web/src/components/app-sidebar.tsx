"use client"

import * as React from "react"
import { Command, LifeBuoy, Home, Leaf, LayoutDashboard, Utensils } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "@tanstack/react-router"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRestaurant } from "@/context/restaurant-context"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const { restaurants, selectedRestaurantId, setSelectedRestaurantId } = useRestaurant();

  const data = {
    navMain: [
      {
        title: t("nav.home"),
        url: "/",
        icon: Home,
        isActive: true,
      },
      {
        title: t("nav.ingredients"),
        url: "/ingredients",
        icon: Leaf,
      },
      {
        title: t("nav.dashboard"),
        url: "/dashboard",
        icon: LayoutDashboard,
      },
        {
        title: t("nav.mealBases"),
        url: "/meal-bases",
        icon: Utensils,
      },
    ],
    navSecondary: [
      {
        title: t("nav.support"),
        url: "#",
        icon: LifeBuoy,
      },
    ],
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{t("app.name")}</span>
                  <span className="truncate text-xs">{t("nav.restaurant")}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {restaurants.length ? (
          <div className="px-2 pb-2">
            <Select
              value={selectedRestaurantId ?? undefined}
              onValueChange={setSelectedRestaurantId}
              disabled={restaurants.length <= 1}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("nav.restaurant")} />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((restaurant) => (
                  <SelectItem key={restaurant.restaurant_id} value={restaurant.restaurant_id}>
                    {restaurant.restaurant_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
