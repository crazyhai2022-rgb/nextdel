import Link from "next/link";
import { getSetting } from "@/lib/settings";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const [general, home] = await Promise.all([getSetting("general"), getSetting("homepage")]);
  return (
    <>
      {home.announcementEnabled && home.announcementText && (
        <div className="bg-velvet text-center text-[13px] tracking-wide text-ink">
          <div className="container-site py-2">
            {home.announcementLink ? (
              <a href={home.announcementLink} className="underline-offset-2 hover:underline">{home.announcementText}</a>
            ) : (
              home.announcementText
            )}
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-night/85 backdrop-blur supports-[backdrop-filter]:bg-night/70">
        <div className="container-site flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center" aria-label={`${general.siteName} home`}>
            {general.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={general.logoUrl} alt={general.siteName} className="h-7 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="font-display text-[17px] font-light tracking-[0.34em] text-ink">{general.siteName}</span>
            )}
          </Link>
          <HeaderClient />
        </div>
      </header>
    </>
  );
}
