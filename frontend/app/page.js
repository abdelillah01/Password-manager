'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { user, masterKey } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Redirect to dashboard if already logged in
    if (user && masterKey) {
      router.push('/dashboard');
    }
  }, [user, masterKey, router]);

  // Simple loading state during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-slate-200 rounded-2xl mx-auto mb-4"></div>
            <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if user is already authenticated
  if (user && masterKey) {
    return null; // Will redirect in useEffect
  }

  // SVG Icons
  const ShieldIcon = () => (
    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const KeyIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const DatabaseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  );

  const CodeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );

  const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200/60 dark:border-slate-700/60 hover:shadow-xl transition-all duration-300">
      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl w-fit mb-4">
        <Icon />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 text-sm">
        {description}
      </p>
    </div>
  );

  const TechStep = ({ number, title, description, technical }) => (
    <div className="flex gap-6">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
          {number}
        </div>
        <div className="w-0.5 h-full bg-gradient-to-b from-blue-500 to-blue-300 mt-2"></div>
      </div>
      <div className="flex-1 pb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-3">
          {description}
        </p>
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <code className="text-sm text-slate-700 dark:text-slate-300 font-mono">
            {technical}
          </code>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <ShieldIcon />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              CipherVault
            </span>
          </div>
          <div className="flex gap-4">
            <a
              href="/login"
              className="px-6 py-2.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-medium transition-colors duration-200"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>
{/* Zero-Knowledge Explanation Banner - Alternative Design */}
<div className="bg-blue-600 text-white py-4 border-b-4 border-blue-400">
  <div className="container mx-auto px-6">
    <div className="flex items-center justify-center gap-3">
      <div className="flex-shrink-0">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="text-center">
        <span className="font-semibold">Zero-Knowledge Architecture: </span>
        <span className="opacity-90">
          Your data is encrypted locally before syncing. We never see your passwords or encryption keys.
        </span>
      </div>
    </div>
  </div>
</div>
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 leading-tight">
            Secure Your Digital Life with{' '}
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              Zero-Knowledge
            </span>{' '}
            Encryption
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            CipherVault protects your passwords with military-grade encryption that never leaves your device. 
            Your data, your control - we never see what you store.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 text-lg"
            >
              Start Protecting Your Passwords
            </a>
            <a
              href="/login"
              className="border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 font-medium py-4 px-8 rounded-xl transition-all duration-200 text-lg"
            >
              Already have an account?
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Why Choose CipherVault?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Built with security and privacy as our foundation
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={LockIcon}
            title="Zero-Knowledge Architecture"
            description="Your master password and encrypted data never leave your device. We literally cannot access your passwords."
          />
          <FeatureCard
            icon={KeyIcon}
            title="Client-Side Encryption"
            description="All encryption and decryption happens locally in your browser. Your data is encrypted before it reaches our servers."
          />
          <FeatureCard
            icon={EyeIcon}
            title="Complete Privacy"
            description="We don't track you, we don't sell your data, and we don't have access to your encrypted information."
          />
        </div>
      </section>

      {/* Technical Deep Dive Section */}
      <section className="bg-white dark:bg-slate-800 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                How It Works: Technical Deep Dive
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Understanding the security behind CipherVault
              </p>
            </div>

            <div className="space-y-2">
              <TechStep
                number="1"
                title="Master Key Derivation"
                description="Your master password is transformed into a cryptographic key using PBKDF2 with 100,000 iterations and a unique salt. This ensures your key is strong and unique, even if you use a simple password."
                technical="masterKey = PBKDF2(masterPassword, salt, 100000)"
              />
              
              <TechStep
                number="2"
                title="Client-Side Encryption"
                description="Before any data leaves your device, passwords are encrypted using AES-256-GCM with a randomly generated initialization vector (IV). This provides both confidentiality and integrity protection."
                technical="encryptedData = AES-256-GCM(password, masterKey, randomIV)"
              />
              
              <TechStep
                number="3"
                title="Secure Storage"
                description="Only the encrypted data and IV are sent to our servers. Your master key and plaintext passwords never leave your device. We store encrypted blobs that are useless without your master key."
                technical="Server stores: { encrypted_data, iv, website, username }"
              />
              
              <TechStep
                number="4"
                title="Local Decryption"
                description="When you need to access a password, the encrypted data is retrieved and decrypted locally in your browser using your master key. The server never sees your decrypted passwords."
                technical="password = AES-256-GCM(encryptedData, masterKey, iv)"
              />
            </div>

            {/* Security Specifications */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <DatabaseIcon />
                  Storage Architecture
                </h3>
                <ul className="text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Encrypted data stored in secure databases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Salts stored locally in browser storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Master keys never transmitted or stored</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Regular encrypted backups with versioning</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <CodeIcon />
                  Technical Specifications
                </h3>
                <ul className="text-slate-600 dark:text-slate-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-mono text-sm mt-1">AES-256-GCM</span>
                    <span>Encryption algorithm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-mono text-sm mt-1">PBKDF2</span>
                    <span>Key derivation with 100k iterations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-mono text-sm mt-1">256-bit</span>
                    <span>Encryption key strength</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-mono text-sm mt-1">96-bit</span>
                    <span>Random IV for each encryption</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-slate-50 dark:bg-slate-900 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Military-Grade Security
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              CipherVault uses industry-standard AES-256-GCM encryption to protect your passwords. 
              Combined with PBKDF2 key derivation, your data remains secure even if our servers are compromised.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">AES-256</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Encryption</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">PBKDF2</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Key Derivation</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Zero</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Knowledge</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">Open</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Source</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            Ready to Take Control of Your Security?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join thousands of users who trust CipherVault with their most sensitive information.
          </p>
          <a
            href="/register"
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-4 px-12 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 text-lg inline-block"
          >
            Create Your Free Account
          </a>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
            No credit card required • Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
              <ShieldIcon />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
              CipherVault
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            © 2025 CipherVault. Your privacy, our priority.
          </p>
        </div>
      </footer>
    </div>
  );
}