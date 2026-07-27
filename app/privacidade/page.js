import InstitutionalPage from "@/components/institutional/InstitutionalPage";

export const metadata = { title: "Privacidade | Virella Sexshop" };

export default function PrivacyPage() {
  return (
    <InstitutionalPage
      eyebrow="Seus dados"
      title="Política de privacidade"
      introduction="Privacidade faz parte da experiência Virella, da navegação à entrega."
    >
      <article>
        <h2>Dados que utilizamos</h2>
        <p>
          Utilizamos apenas as informações necessárias para criar sua conta,
          processar pedidos, pagamentos, entregas e prestar atendimento.
        </p>
      </article>
      <article>
        <h2>Pagamento e segurança</h2>
        <p>
          Os dados de pagamento são processados pelo provedor de pagamento.
          A Virella não recebe nem armazena os dados completos do seu cartão.
        </p>
      </article>
      <article>
        <h2>Seus direitos</h2>
        <p>
          Você pode solicitar acesso, correção ou exclusão dos seus dados pelos
          canais oficiais, respeitadas as obrigações legais de conservação.
        </p>
      </article>
      <article>
        <h2>Fale conosco</h2>
        <p>
          Para dúvidas sobre privacidade, entre em contato pelo WhatsApp oficial
          disponível no rodapé.
        </p>
      </article>
    </InstitutionalPage>
  );
}
