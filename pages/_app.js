import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Rowdies:wght@300;400;700&display=swap" rel="preload" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Rowdies:wght@300;400;700&display=swap" rel="stylesheet" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}