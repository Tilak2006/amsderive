import { ptSerif, ibmPlexMono } from '../lib/fonts';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <div className={`${ptSerif.variable} ${ibmPlexMono.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
