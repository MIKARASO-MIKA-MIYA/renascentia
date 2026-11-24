export function PageHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="max-w-[70ch]">
      <h1 className="heading-display break-words">{title}</h1>
      {description && <p className="mt-4 text-lg text-muted">{description}</p>}
    </header>
  );
}
