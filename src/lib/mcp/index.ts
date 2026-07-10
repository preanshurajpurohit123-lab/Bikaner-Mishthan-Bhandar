import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCategoriesTool from "./tools/list-categories";
import listMenuItemsTool from "./tools/list-menu-items";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bikaner-mishthan-bhandar-mcp",
  title: "Shree Bikaner Mishthan Bhandar",
  version: "0.1.0",
  instructions:
    "Menu access for Shree Bikaner Mishthan Bhandar (Batala, Gurdaspur). Use list_categories to discover menu sections and list_menu_items (optionally filtered by categorySlug or vegOnly) to browse dishes with prices.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCategoriesTool, listMenuItemsTool],
});
