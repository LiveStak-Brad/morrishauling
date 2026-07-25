import Image from "next/image";
import { getMarketingImage } from "@/lib/seo/images";
import { getManifestByImageKey } from "@/lib/seo/image-manifest";
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
  const manifest = getManifestByImageKey(imageKey);
  const shouldPreload = priority || manifest?.preload === true;

  return (
    <figure className={cn("overflow-hidden rounded-2xl bg-muted", className)}>
      <Image
        src={img.src}
        alt={img.alt}
        title={manifest?.title}
        width={img.width}
        height={img.height}
        priority={shouldPreload}
        loading={shouldPreload ? "eager" : "lazy"}
        sizes={sizes}
        className="h-auto w-full object-cover object-center aspect-[16/9]"
      />
      {img.representative || img.replaceWithRealPhotosNote ? (
        <figcaption className="sr-only">
          {img.replaceWithRealPhotosNote ??
            "Representative service image. Not a Morris Services completed project."}
        </figcaption>
      ) : null}
    </figure>
  );
}
