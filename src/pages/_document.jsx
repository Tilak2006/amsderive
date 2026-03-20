import { Html, Head, Main, NextScript } from 'next/document';
import { ptSerif, ibmPlexMono } from '../lib/fonts';

export default function Document() {
  return (
    <Html lang="en" className={`${ptSerif.variable} ${ibmPlexMono.variable}`}>
      <Head>
        <meta name="theme-color" content="#0a0a0a" />
        

        {/* DNS prefetch for Firebase domain resolution */}
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        
        {/* Prefetch registration page for instant navigation */}
        <link rel="prefetch" href="/register" as="document" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
