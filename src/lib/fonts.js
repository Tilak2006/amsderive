import { PT_Serif, IBM_Plex_Mono, JetBrains_Mono, Oswald, Inter } from 'next/font/google';

export const ptSerif = PT_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal'],              // italic removed — not used on landing page
  variable: '--font-pt-serif',
  display: 'swap',
  preload: true,                  // preload: primary LCP font (h1 title)
});

export const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],         // 600 removed — only needed in admin pages
  variable: '--font-ibm-plex-mono',
  display: 'swap',
  // preload removed: display:swap is sufficient; preloading all fonts competes with LCP
});

export const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  // preload removed: countdown is not LCP; swap avoids layout shift without blocking
});

export const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-oswald',
  display: 'optional',            // only shown post-expiry; optional avoids layout shift risk
});

export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500'],         // 600 removed — only needed in admin/firm forms
  variable: '--font-inter',
  display: 'swap',
});
