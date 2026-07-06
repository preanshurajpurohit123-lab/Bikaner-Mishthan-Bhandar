import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_menu_items",
  title: "List menu items",
  description:
    "List available menu items. Optionally filter by category slug (e.g. 'sweets', 'chaat', 'pizza').",
  inputSchema: {
    categorySlug: z
      .string()
      .optional()
      .describe("Optional category slug to filter items by."),
    vegOnly: z.boolean().optional().describe("If true, only return vegetarian items."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ categorySlug, vegOnly }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let categoryId: string | undefined;
    if (categorySlug) {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (catErr) return { content: [{ type: "text", text: catErr.message }], isError: true };
      if (!cat) return { content: [{ type: "text", text: `Unknown category: ${categorySlug}` }], isError: true };
      categoryId = cat.id;
    }

    let query = supabase
      .from("menu_items")
      .select("id,name,description,price,is_veg,category_id,image_url,sort_order")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });
    if (categoryId) query = query.eq("category_id", categoryId);
    if (vegOnly) query = query.eq("is_veg", true);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { items: data ?? [] },
    };
  },
});
