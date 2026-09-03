import ptBR from "@/locales/pt-BR.json";

export function SiteFooter() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <footer className="flex flex-col items-center gap-3 border-t border-foreground px-5 py-6 catalog:flex-row catalog:justify-between catalog:px-10 catalog:py-10">
      <div className="text-sm font-black tracking-widest">AKOPIL</div>
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold"
        >
          {ptBR.footer.whatsapp} →
        </a>
      )}
      <div className="text-xs text-gray-3">{ptBR.footer.copyright}</div>
    </footer>
  );
}
