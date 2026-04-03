import { useEffect } from "react";
import { useRouter } from "next/router";
import { Analytics } from "@vercel/analytics/next";
import "../styles/globals.css";
import { ptSerif, ibmPlexMono, jetBrainsMono, oswald, inter } from "../lib/fonts";

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
    </>
  );
}
