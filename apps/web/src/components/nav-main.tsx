import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Link } from "@tanstack/react-router"

const SIDEBAR_SECTIONS_KEY = "sidebar_sections"

function getSavedSections(): Set<string> {
  try {
    const saved = localStorage.getItem(SIDEBAR_SECTIONS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

function saveSections(sections: Set<string>) {
  try {
    localStorage.setItem(SIDEBAR_SECTIONS_KEY, JSON.stringify(Array.from(sections)));
  } catch {
    // Ignore localStorage errors
  }
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const savedSections = React.useMemo(() => getSavedSections(), []);

  const handleOpenChange = React.useCallback((isOpen: boolean, title: string) => {
    const currentSections = getSavedSections();
    if (isOpen) {
      currentSections.add(title);
    } else {
      currentSections.delete(title);
    }
    saveSections(currentSections);
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            open={savedSections.has(item.title) || item.isActive}
            onOpenChange={(open) => handleOpenChange(open, item.title)}
          >
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                {item.url === "#" ? (
                  <button type="button">
                    <item.icon />
                    <span>{item.title}</span>
                  </button>
                ) : (
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
