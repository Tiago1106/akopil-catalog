"use client";

import * as React from "react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ptBR from "@/locales/pt-BR.json";

export function ProductPhotos({ images, alt }: { images: string[]; alt: string }) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [selected, setSelected] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    queueMicrotask(onSelect);
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (images.length === 0) {
    return (
      <AspectRatio ratio={1} className="overflow-hidden rounded-lg border bg-muted">
        <div className="flex h-full items-center justify-center text-xs text-gray-3">
          {ptBR.home.grid.noImage}
        </div>
      </AspectRatio>
    );
  }

  return (
    <>
      {/* Mobile: uma foto por vez, largura cheia, sem espiar a próxima */}
      <div className="catalog:hidden">
        <Carousel setApi={setApi}>
          <CarouselContent className="ml-0">
            {images.map((src, index) => (
              <CarouselItem key={src} className="pl-0">
                <AspectRatio ratio={1} className="overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={src}
                    alt={`${alt} ${index + 1}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </AspectRatio>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((src, index) => (
              <span
                key={src}
                className={`size-1.5 rounded-full ${
                  index === selected ? "bg-foreground" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: grade 2x2, clicável pra abrir o carrossel em tela cheia */}
      <div className="hidden catalog:grid catalog:grid-cols-2 catalog:gap-0.5">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="cursor-pointer"
          >
            <AspectRatio ratio={1} className="overflow-hidden rounded-lg border bg-muted">
              <Image
                src={src}
                alt={`${alt} ${index + 1}`}
                fill
                sizes="45vw"
                className="object-cover"
              />
            </AspectRatio>
          </button>
        ))}
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && setLightboxIndex(null)}>
        <DialogContent className="top-0 left-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-background p-0 ring-0 sm:max-w-none">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {lightboxIndex !== null && (
            <Carousel
              key={lightboxIndex}
              opts={{ startIndex: lightboxIndex }}
              className="h-dvh w-screen"
            >
              <CarouselContent className="ml-0 h-dvh">
                {images.map((src, index) => (
                  <CarouselItem
                    key={src}
                    className="flex h-full items-center justify-center pl-0"
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={src}
                        alt={`${alt} ${index + 1}`}
                        fill
                        sizes="100vw"
                        className="object-contain"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {images.length > 1 && (
                <>
                  <CarouselPrevious className="left-4 rounded-lg" />
                  <CarouselNext className="right-4 rounded-lg" />
                </>
              )}
            </Carousel>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
