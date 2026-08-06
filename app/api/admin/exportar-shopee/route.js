import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function csvCell(value) {
  const text = String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `"${text.replace(/"/g, '""')}"`;
}

function decimal(value, fallback = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toFixed(2).replace(".", ",");
}

function integer(value, fallback = "") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return String(Math.max(0, Math.round(number)));
}

function buildDescription(product) {
  return [product.descricao_curta, product.descricao]
    .filter(Boolean)
    .join(" - ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  await requireAdmin();

  const supabase = createSupabaseAdminClient();
  const { data: products, error } = await supabase
    .from("produtos")
    .select(`
      *,
      categorias!produtos_categoria_id_fkey(nome),
      produto_imagens(url,ordem),
      produto_variacoes(id,nome,sku,preco,quantidade,imagem_url,ativo,ordem)
    `)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao exportar catálogo para Shopee:", error);
    return Response.json({ error: "Não foi possível exportar os produtos." }, { status: 500 });
  }

  const headers = [
    "SKU do produto",
    "Nome do produto",
    "Descrição",
    "Categoria da loja",
    "Preço",
    "Estoque",
    "Peso (kg)",
    "Altura (cm)",
    "Largura (cm)",
    "Comprimento (cm)",
    "Nome da variação",
    "SKU da variação",
    "Preço da variação",
    "Estoque da variação",
    "Imagem principal",
    "Imagens adicionais",
    "Status no site",
  ];

  const rows = [];

  for (const product of products || []) {
    const sortedImages = [...(product.produto_imagens || [])]
      .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0))
      .map((image) => image.url)
      .filter(Boolean);

    const mainImage = product.imagem_principal || sortedImages[0] || "";
    const additionalImages = sortedImages.filter((url) => url !== mainImage).join(" | ");
    const variations = [...(product.produto_variacoes || [])]
      .filter((variation) => variation.ativo !== false)
      .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));

    const base = {
      sku: product.sku || product.id,
      name: product.nome,
      description: buildDescription(product),
      category: product.categorias?.nome || "",
      price: decimal(product.preco_promocional || product.preco, "0,00"),
      stock: integer(product.quantidade, "100"),
      weight: decimal(product.peso_kg, "0,30"),
      height: decimal(product.altura_cm, "8,00"),
      width: decimal(product.largura_cm, "12,00"),
      length: decimal(product.comprimento_cm, "18,00"),
      mainImage,
      additionalImages,
      status: product.ativo === false ? "Inativo" : "Ativo",
    };

    const sourceVariations = variations.length ? variations : [null];

    for (const variation of sourceVariations) {
      rows.push([
        base.sku,
        base.name,
        base.description,
        base.category,
        base.price,
        base.stock,
        base.weight,
        base.height,
        base.width,
        base.length,
        variation?.nome || "",
        variation?.sku || "",
        variation ? decimal(variation.preco ?? product.preco_promocional ?? product.preco, base.price) : "",
        variation ? integer(variation.quantidade, base.stock || "100") : "",
        variation?.imagem_url || base.mainImage,
        base.additionalImages,
        base.status,
      ]);
    }
  }

  const csv = "\uFEFF" + [headers, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="catalogo-virella-shopee-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
