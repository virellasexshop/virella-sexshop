import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CartClient from "@/components/cart/CartClient";
export const metadata = { title: "Carrinho | Virella Sexshop" };
export default function CarrinhoPage() { return <><Header /><main className="cartPage container"><span className="eyebrow">Sua seleção</span><h1>Carrinho</h1><CartClient /></main><Footer /></>; }
