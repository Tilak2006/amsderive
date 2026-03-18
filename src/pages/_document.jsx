import { Html, Head, Main, NextScript } from 'next/document';
import { ptSerif, ibmPlexMono, inter, jetBrainsMono } from '../lib/fonts';

export default function Document() {
  return (
    <Html lang="en" className={`${ptSerif.variable} ${ibmPlexMono.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <Head>
        <meta name="theme-color" content="#0a0a0a" />
        
        {/* Critical preconnects: highest priority for Firebase services */}
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
        
        {/* DNS prefetch for Firebase domain resolution */}
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        
        {/* Prefetch registration page for instant navigation */}
        <link rel="prefetch" href="/register" as="document" />
        
        {/* Preload critical Firebase SDK bundles */}
        <link 
          rel="preload" 
          href="https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js"
          as="script"
        />
        <link 
          rel="preload" 
          href="https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore-compat.js"
          as="script"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
