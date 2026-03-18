import { ptSerif, ibmPlexMono, oswald } from '../lib/fonts';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <div className={`${ptSerif.variable} ${ibmPlexMono.variable} ${oswald.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
