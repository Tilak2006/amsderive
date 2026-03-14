import { Html, Head, Main, NextScript } from 'next/document';
import { ptSerif, ibmPlexMono, inter, jetBrainsMono } from '../lib/fonts';

export default function Document() {
  return (
    <Html lang="en" className={`${ptSerif.variable} ${ibmPlexMono.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
