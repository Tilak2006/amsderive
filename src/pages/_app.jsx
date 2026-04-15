import { useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import "../styles/globals.css";
import { ptSerif, ibmPlexMono, jetBrainsMono, oswald, inter } from "../lib/fonts";

const Analytics = dynamic(
  () => new Promise((resolve) => {
    const load = () => import("@vercel/analytics/next").then((mod) => resolve(mod.Analytics));
    if (typeof window === "undefined") { load(); return; }
    if ("requestIdleCallback" in window) {
      requestIdleCallback(load, { timeout: 2000 });
    } else {
      setTimeout(load, 200);
    }
  }),
  { ssr: false }
);

const SpeedInsights = dynamic(
  () => new Promise((resolve) => {
    const load = () => import("@vercel/speed-insights/next").then((mod) => resolve(mod.SpeedInsights));
    if (typeof window === "undefined") { load(); return; }
    if ("requestIdleCallback" in window) {
      requestIdleCallback(load, { timeout: 2000 });
    } else {
      setTimeout(load, 200);
    }
  }),
  { ssr: false }
);

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Capture referral code from URL and persist in localStorage
  useEffect(() => {
    const ref = router.query.ref;
    if (ref && typeof ref === "string" && ref.trim()) {
      // First-touch attribution — do not overwrite existing ref
      if (!localStorage.getItem("ams_derive_ref")) {
        localStorage.setItem("ams_derive_ref", ref.trim());
      }
    }
  }, [router.query]);

  return (
    <>
      <div className={`${ptSerif.variable} ${ibmPlexMono.variable} ${jetBrainsMono.variable} ${oswald.variable} ${inter.variable}`}>
        <Component {...pageProps} />
      </div>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
