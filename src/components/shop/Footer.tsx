import Link from "next/link";
import { getSettings, getSocialLinks } from "@/lib/settings";
import { SocialIcon } from "@/components/icons";

export async function Footer() {
  const [{ general, footer }, socials] = await Promise.all([getSettings("general", "footer"), getSocialLinks()]);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-line bg-paper">
      <div className="container-site grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <div className="font-display text-[15px] font-light tracking-[0.32em] text-ink">{general.siteName}</div>
          {footer.about && <p className="mt-3 text-sm leading-6 text-ink-muted">{footer.about}</p>}
          {footer.contactEmail && (
            <a href={`mailto:${footer.contactEmail}`} className="mt-3 block text-sm text-ink-soft hover:text-ink">{footer.contactEmail}</a>
          )}
          {footer.showAddress && footer.address && <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{footer.address}</p>}
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:border-rose/60 hover:text-ink">
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          )}
        </div>
        {footer.columns.map((col) => (
          <div key={col.title}>
            <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-soft">{col.title}</div>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  {l.href.startsWith("http") ? (
                    <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-muted hover:text-ink">{l.label}</a>
                  ) : (
                    <Link href={l.href} className="text-sm text-ink-muted hover:text-ink">{l.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{footer.copyright.replace("{year}", String(year))}</span>
          {footer.disclaimer && <span className="max-w-xl sm:text-right">{footer.disclaimer}</span>}
        </div>
      </div>
    </footer>
  );
}
