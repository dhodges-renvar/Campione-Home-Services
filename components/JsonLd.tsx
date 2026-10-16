export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is author-controlled here — no user input reaches it.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
