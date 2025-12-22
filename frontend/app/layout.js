import './globals.css';

export const metadata = {
  title: 'VaultGuard - Zero-Knowledge Password Manager',
  description: 'Secure password manager with client-side encryption',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}