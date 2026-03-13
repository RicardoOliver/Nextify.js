type ProductPageProps = {
  slug?: string;
};

export default function ProductPage({ slug = 'demo-product' }: ProductPageProps) {
  return (
    <article>
      <h1>Produto: {slug}</h1>
      <p>Página dinâmica de produto com base em parâmetro de rota.</p>
    </article>
  );
}
