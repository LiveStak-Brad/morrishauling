import Image from "next/image";
import { getMarketingImage } from "@/lib/seo/images";
import { cn } from "@/lib/utils";

export function MarketingImage({
  imageKey,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 800px",
}: {
  imageKey: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const img = getMarketingImage(imageKey);
  if (!img) return null;

  return (
    <figure className={cn("overflow-hidden rounded-2xl bg-muted", className)}>
      <Image
        src={img.src}
        alt={img.alt}
        width={img.width}
        height={img.height}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        className="h-auto w-full object-cover object-center"
      />
      {img.representative ? (
        <figcaption className="sr-only">
          Representative service image. Not a Morris Services completed project.
        </figcaption>
      ) : null}
    </figure>
  );
}
