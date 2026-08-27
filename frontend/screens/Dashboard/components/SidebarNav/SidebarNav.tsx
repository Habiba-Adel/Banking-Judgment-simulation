import { SidebarNavLayout } from "./SidebarNav.layout";

export function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  return <SidebarNavLayout collapsed={collapsed} />;
}