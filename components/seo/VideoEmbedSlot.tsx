/**
 * YouTube / video embed slot — renders nothing until a real video URL is provided.
 */
export function VideoEmbedSlot({
  youtubeId,
  title,
  className,
}: {
  youtubeId?: string;
  title?: string;
  className?: string;
}) {
  if (!youtubeId) return null;
  return (
    <figure className={className}>
      <div className="aspect-video overflow-hidden rounded-2xl bg-muted">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title ?? "Morris Junk Removal video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    </figure>
  );
}
