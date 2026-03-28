import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AMSAboutSection from '../components/sections/AMSAboutSection';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us | AMS Derive</title>
        <meta name="description" content="Learn about the Algorithms & Mathematics Society (AMS) and our mission to identify first-principles thinkers in quantitative finance." />
      </Head>
      
      <Navbar />
      
      <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <AMSAboutSection />
      </main>

      <Footer />
    </>
  );
}
