import "./globals.css";

export const metadata = {
  title: "Virella Sexshop",
  description: "Loja online adulta com entrega discreta.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}