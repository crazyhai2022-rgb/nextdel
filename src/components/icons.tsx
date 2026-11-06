import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
});

export const CartIcon = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}><path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2" /><circle cx="9.5" cy="20" r="1.2" /><circle cx="17.5" cy="20" r="1.2" /></svg>
);
export const MenuIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const CloseIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const CheckIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="m5 12.5 4.2 4.2L19 7" /></svg>);
export const LockIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const SearchIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>);
export const DownloadIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 19h14" /></svg>);
export const LinkIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></svg>);
export const CopyIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></svg>);
export const TrashIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12" /></svg>);
export const InfinityIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M7.5 15.5c-2 0-3.5-1.6-3.5-3.5s1.5-3.5 3.5-3.5c3.5 0 5.5 7 9 7 2 0 3.5-1.6 3.5-3.5s-1.5-3.5-3.5-3.5c-3.5 0-5.5 7-9 7Z" /></svg>);
export const PlayIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" /></svg>);
export const ArrowLeftIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M19 12H5m6-6-6 6 6 6" /></svg>);
export const ShieldIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>);
export const MailIcon = ({ size, ...p }: P) => (<svg {...base(size)} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></svg>);

export function SocialIcon({ platform, size = 18 }: { platform: string; size?: number }) {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;
  switch (platform.toLowerCase()) {
    case "telegram":
      return <svg {...s}><path d="M21.9 4.4 18.7 19.6c-.2 1-.9 1.3-1.8.8l-4.8-3.6-2.3 2.2c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.4 13.4l-4.7-1.5c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.4Z" /></svg>;
    case "instagram":
      return <svg {...s}><path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.9 8c-.1-1.6-.4-3-1.6-4.2C19.1 2.6 17.7 2.2 16.1 2.1 14.5 2 9.5 2 7.9 2.1 6.3 2.2 4.9 2.5 3.7 3.7 2.6 4.9 2.2 6.3 2.1 7.9 2 9.5 2 14.5 2.1 16.1c.1 1.6.4 3 1.6 4.2 1.2 1.2 2.6 1.5 4.2 1.6 1.6.1 6.6.1 8.2 0 1.6-.1 3-.4 4.2-1.6 1.2-1.2 1.5-2.6 1.6-4.2.1-1.6.1-6.6 0-8.1Zm-2.1 10a3 3 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4A3 3 0 0 1 5.8 18c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3A3 3 0 0 1 7.5 5.7c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4a3 3 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3Z" /></svg>;
    case "youtube":
      return <svg {...s}><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z" /></svg>;
    case "facebook":
      return <svg {...s}><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z" /></svg>;
    case "x":
    case "twitter":
      return <svg {...s}><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.4L5.4 21H2.3l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.3 4.7H5.5l11.2 14.5Z" /></svg>;
    case "whatsapp":
      return <svg {...s}><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1 0-1.5.8-2.2 1-2.5.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.3 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.1.1.7-.1 1.3Z" /></svg>;
    default:
      return <LinkIcon size={size} />;
  }
}
