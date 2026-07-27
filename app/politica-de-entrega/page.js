import InstitutionalPage from "@/components/institutional/InstitutionalPage";

export const metadata = { title: "Entrega discreta | Virella Sexshop" };

export default function DeliveryPolicyPage() {
  return (
    <InstitutionalPage
      eyebrow="Da Virella até você"
      title="Entrega discreta"
      introduction="Privacidade e cuidado também fazem parte da embalagem e do envio."
    >
      <article>
        <h2>Embalagem neutra</h2>
        <p>
          O pacote não informa o tipo de produto adquirido e é preparado para
          preservar o conteúdo durante o transporte.
        </p>
      </article>
      <article>
        <h2>Opções e prazos</h2>
        <p>
          As transportadoras, valores e prazos disponíveis são calculados no
          checkout conforme o CEP informado.
        </p>
      </article>
      <article>
        <h2>Acompanhamento</h2>
        <p>
          Após a postagem, as informações de acompanhamento do pedido ficam
          disponíveis pelos canais informados durante a compra.
        </p>
      </article>
    </InstitutionalPage>
  );
}
