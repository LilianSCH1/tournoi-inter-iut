import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Tournoi Inter-IUT Lorraine 2027',
  description: '300 étudiants, 7 IUT, 4 sports - POJC Saint-Dié-des-Vosges',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} ${inter.variable}`}>{children}</body>
    </html>
  );
}
