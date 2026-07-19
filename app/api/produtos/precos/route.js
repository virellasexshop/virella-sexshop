import { NextResponse } from "next/server";
import { getProductsByIds } from "@/modules/products/product.service";

export async function POST(request) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? [...new Set(body.ids)].slice(0, 100) : [];
    const products = await getProductsByIds(ids);

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        nome: product.nome,
        slug: product.slug,
        imagem_principal: product.imagem_principal,
        preco: product.preco_final ?? product.preco,
      })),
    });
  } catch (error) {
    console.error("Erro ao consultar preços:", error);
    return NextResponse.json({ products: [] }, { status: 400 });
  }
}
