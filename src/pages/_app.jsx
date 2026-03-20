import "../styles/globals.css";
import { ptSerif, ibmPlexMono, jetBrainsMono, oswald, inter } from "../lib/fonts";

export default function App({ Component, pageProps }) {
  return (
    <>
      <div className={`${ptSerif.variable} ${ibmPlexMono.variable} ${jetBrainsMono.variable} ${oswald.variable} ${inter.variable}`}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
