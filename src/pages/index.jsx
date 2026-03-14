import Head from 'next/head';
import Wordmark from '../components/layout/Wordmark';
import CountdownTimer from '../components/countdown/CountdownTimer';
import Button from '../components/ui/Button';

const CONTEST_DATE = '2026-06-01T00:00:00';

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>AMS-DERIVE — Competitive Programming Contest</title>
        <meta
          name="description"
          content="AMS-DERIVE is a premium competitive programming contest. Register now and test your skills."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="landing-main">
        <div className="landing-hero">
          <Wordmark size="lg" />
          <p className="landing-tagline">A competitive programming contest</p>
          <CountdownTimer targetDate={CONTEST_DATE} />
          <div className="landing-actions">
            <Button onClick={() => (window.location.href = '/register')}>
              Register Now
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
