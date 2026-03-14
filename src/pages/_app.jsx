import { ptSerif, ibmPlexMono } from '../lib/fonts';
import '../styles/globals.css';

import '../components/countdown/CountdownTimer.css';
import '../components/countdown/TimeBlock.css';
import '../components/form/TextInput.css';
import '../components/form/FileUpload.css';
import '../components/form/RegistrationForm.css';
import '../components/ui/Button.css';
import '../components/ui/ErrorBanner.css';
import '../components/ui/SuccessState.css';
import '../components/layout/Wordmark.css';
import './LandingPage.css';
import './Register.css';

export default function App({ Component, pageProps }) {
  return (
    <div className={`${ptSerif.variable} ${ibmPlexMono.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
