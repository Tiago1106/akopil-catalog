"use client";

import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { BannerRow } from "@/lib/supabase/types";

export function BannerCarousel({ banners }: { banners: BannerRow[] }) {
  return (
    <Carousel
      className="px-5 pb-2 catalog:px-10"
      opts={{ loop: true }}
      plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
    >
      <CarouselContent>
        {banners.map((banner) => {
          const image = (
            <>
              {/* Mobile: imagem quadrada dedicada */}
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted catalog:hidden">
                <Image
                  src={banner.image_url}
                  alt={banner.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>

              {/* Desktop: imagem larga dedicada (cai pra mobile se não tiver sido cadastrada) */}
              <div className="relative hidden aspect-[21/6] overflow-hidden rounded-lg border bg-muted catalog:block">
                <Image
                  src={banner.desktop_image_url ?? banner.image_url}
                  alt={banner.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </>
          );

          return (
            <CarouselItem key={banner.id} className="basis-full">
              {!banner.link ? (
                image
              ) : banner.link.startsWith("http") ? (
                <a href={banner.link} target="_blank" rel="noopener noreferrer">
                  {image}
                </a>
              ) : (
                <Link href={banner.link}>{image}</Link>
              )}
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
}
