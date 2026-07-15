import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
export default function CheckoutPage() { return <><Header /><main className="simplePage container"><span className="eyebrow">Finalização</span><h1>Checkout</h1><div className="checkoutNotice"><h2>Pagamento em preparação</h2><p>Seu carrinho está pronto. A integração final com o Mercado Pago será ativada na próxima etapa.</p><a href="/carrinho">Voltar ao carrinho</a></div></main><Footer /></>; }
