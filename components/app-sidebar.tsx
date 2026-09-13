"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GalleryHorizontal, LayoutDashboard, LogOut, Store, Tag } from "lucide-react";
import ptBR from "@/locales/pt-BR.json";
import { signOut } from "@/app/admin/(protected)/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: ptBR.admin.nav.dashboard, url: "/admin", icon: LayoutDashboard },
  { title: ptBR.admin.nav.products, url: "/admin/products", icon: Tag },
  { title: ptBR.admin.nav.banners, url: "/admin/banners", icon: GalleryHorizontal },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm font-extrabold tracking-widest">
          AKOPIL
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/admin" ? pathname === "/admin" : pathname.startsWith(item.url)
                    }
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={ptBR.admin.nav.viewCatalog}>
              <Link href="/">
                <Store />
                <span>{ptBR.admin.nav.viewCatalog}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOut}>
              <SidebarMenuButton type="submit" tooltip={ptBR.admin.dashboard.logout}>
                <LogOut />
                <span>{ptBR.admin.dashboard.logout}</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
