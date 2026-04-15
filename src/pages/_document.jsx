import { Html, Head, Main, NextScript } from 'next/document';
import { ptSerif, ibmPlexMono, jetBrainsMono, oswald, inter } from '../lib/fonts';

export default function Document() {
  return (
    <Html
      lang="en"
      className={`${ptSerif.variable} ${ibmPlexMono.variable} ${jetBrainsMono.variable} ${inter.variable} ${oswald.variable}`}
    >
      <Head>
        <meta name="theme-color" content="#0a0a0a" />

        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://www.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for Firebase domain resolution */}
        <link rel="dns-prefetch" href="https://firebaseapp.com" />

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
