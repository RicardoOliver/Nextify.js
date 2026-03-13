type Props = { params: { slug: string } };

export async function getStaticPaths() {
  return [{ slug: 'hello-nextify' }, { slug: 'performance-at-scale' }];
}

export async function getStaticProps({ params }: Props) {
  return {
    title: params.slug,
    content: `Post gerado estaticamente para ${params.slug}`,
    revalidate: 60
  };
}

export default function PostPage({ title, content }: { title: string; content: string }) {
  return (
    <article>
      <h1>{title}</h1>
      <p>{content}</p>
    </article>
  );
}
