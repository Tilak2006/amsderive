import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SyllabusSection from '../components/sections/SyllabusSection';

export default function SyllabusPage() {
  return (
    <>
      <Head>
        <title>Syllabus | AMS Derive</title>
        <meta name="description" content="View the AMS Derive 2026 syllabus and Round 1 preparation guide covering probability, combinatorics, algorithms, game theory, and market microstructure basics." />
      </Head>
      
      <Navbar />
      
      <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <SyllabusSection />
      </main>

      <Footer />
    </>
  );
}
