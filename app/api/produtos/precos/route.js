import { NextResponse } from "next/server";
import { calculateCheckout } from "@/lib/checkout";

export async function POST(request) {
  try {
    const body = await request.json();
    const checkout = await calculateCheckout(body?.items);

    return NextResponse.json({
      products: checkout.items.map((item) => ({
        id: item.produto_id,
        variacao_id: item.variacao_id,
        variacao_nome: item.variacao_nome,
        opcao_principal: !item.variacao_id && Boolean(item.variacao_nome),
        nome: item.nome.replace(item.variacao_nome ? ` — ${item.variacao_nome}` : "", ""),
        imagem_principal: item.imagem_url,
        preco: item.preco_unitario,
      })),
    });
  } catch (error) {
    console.error("Erro ao consultar preços:", error);
    return NextResponse.json(
      { products: [], error: error?.message || "Não foi possível atualizar o carrinho." },
      { status: 400 }
    );
  }
}
