import InstitutionalPage from "@/components/institutional/InstitutionalPage";

export const metadata = { title: "Trocas e devoluções | Virella Sexshop" };

export default function ReturnsPage() {
  return (
    <InstitutionalPage
      eyebrow="Compra transparente"
      title="Trocas e devoluções"
      introduction="Se algo não sair como esperado, nossa equipe orientará você de forma reservada."
    >
      <article>
        <h2>Antes de enviar o produto</h2>
        <p>
          Entre em contato com nosso atendimento e informe o número do pedido,
          o produto e o motivo da solicitação. Não envie itens sem autorização.
        </p>
      </article>
      <article>
        <h2>Condições de análise</h2>
        <p>
          O produto deve ser preservado com embalagem, acessórios e lacres.
          Por motivos de higiene e segurança, itens íntimos abertos ou utilizados
          exigem análise específica.
        </p>
      </article>
      <article>
        <h2>Produto com defeito ou divergência</h2>
        <p>
          Caso receba um item diferente, avariado ou com defeito, fale conosco
          assim que identificar o problema e guarde a embalagem recebida.
        </p>
      </article>
      <article>
        <h2>Atendimento</h2>
        <p>
          Cada solicitação é analisada conforme a condição do produto e os
          direitos aplicáveis à compra. O contato é realizado de forma discreta.
        </p>
      </article>
    </InstitutionalPage>
  );
}
