import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SyllabusSection from '../components/sections/SyllabusSection';
import styles from './index.module.css';

export default function SyllabusPage() {
  return (
    <>
      <Head>
        <title>Syllabus | AMS Derive</title>
        <meta name="description" content="View the full syllabus for the AMS Derive 2026 quantitative finance contest. Topics include Probability, Stochastic Calculus, and Algorithmic Trading." />
      </Head>
      
      <Navbar />
      
      <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
        <SyllabusSection />
      </main>

      <Footer />
    </>
  );
}
