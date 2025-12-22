'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { user, masterKey } = useAuthStore();
  const [isClient, setIsClient] = useState(false);
  const [activeSection, setActiveSection] = useState('what-is');

  useEffect(() => {
    setIsClient(true);
    if (user && masterKey) router.push('/dashboard');
  }, [user, masterKey, router]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto mb-4"></div>
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (user && masterKey) return null;

  // Reusable Icon Component
  const Icon = ({ children, className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      {children}
    </svg>
  );

  const ShieldIcon = (props) => (
    <Icon {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </Icon>
  );

  const EducationSection = ({ title, children, id }) => (
    <section id={id} className="scroll-mt-24">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
          {title}
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </section>
  );

  const InfoCard = ({ icon: Icon, title, description, variant = 'blue' }) => {
    const variants = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-emerald-500 to-emerald-600',
      purple: 'from-purple-500 to-purple-600',
      amber: 'from-amber-500 to-amber-600'
    };

    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
        <div className={`p-3 bg-gradient-to-br ${variants[variant]} rounded-lg w-fit mb-4`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    );
  };

  const ComparisonTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white"></th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900 dark:text-white">Traditional Password Managers</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-blue-600 dark:text-blue-400">CipherVault (Zero-Knowledge)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100 dark:border-slate-800/50">
            <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Encryption Location</td>
            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">Server-side encryption</td>
            <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">Client-side encryption</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800/50">
            <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Who Has Your Keys?</td>
            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">Service provider has access</td>
            <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">Only you hold the keys</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800/50">
            <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Data Visibility</td>
            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">Provider can see encrypted data</td>
            <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">Provider sees only encrypted blobs</td>
          </tr>
          <tr className="border-b border-slate-100 dark:border-slate-800/50">
            <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Server Compromise Risk</td>
            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">Data could be decrypted</td>
            <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">Data remains encrypted</td>
          </tr>
          <tr>
            <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">Password Recovery</td>
            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">Provider can reset password</td>
            <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">Only you can access (no recovery)</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const StepVisualization = ({ step, title, description, isEven = false }) => (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-12 last:mb-0">
      {!isEven && (
        <div className="md:w-1/2">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/5 dark:to-blue-600/5 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white text-lg font-bold mb-2">
                {step}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-center">{description}</p>
          </div>
        </div>
      )}
      
      <div className="md:w-1/2 order-first md:order-none">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Data Flow</div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              step === '1' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              step === '2' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            }`}>
              Step {step}
            </div>
          </div>
          <div className="space-y-3">
            {step === '1' && (
              <>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400">🔑</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Master Password</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">Stays on your device</div>
                  </div>
                </div>
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                    <span>PBKDF2 Derivation</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400">🔐</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Encryption Key</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">Generated locally</div>
                  </div>
                </div>
              </>
            )}
            
            {step === '2' && (
              <>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 dark:text-amber-400">📝</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Your Password</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">e.g., "MySecurePass123!"</div>
                  </div>
                </div>
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                    <span>AES-256-GCM Encryption</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">📦</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Encrypted Data</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">U3VwZXJTZWN1cmVQQ... (unreadable)</div>
                  </div>
                </div>
              </>
            )}
            
            {step === '3' && (
              <>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400">📦</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Encrypted Data</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">From server storage</div>
                  </div>
                </div>
                <div className="text-center py-2">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
                    <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span>Local Decryption</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 dark:text-amber-400">📝</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Your Password</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">Visible only to you</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {isEven && (
        <div className="md:w-1/2">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/5 dark:to-blue-600/5 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white text-lg font-bold mb-2">
                {step}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-center">{description}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
                <ShieldIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                CipherVault
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/login"
                className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Sign In
              </a>
              <a
                href="/register"
                className="text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                Log in
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Store Passwords Securely with
              <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                CipherVault
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              CipherVault is a password manager that encrypts your passwords on your device using Zero-Knowledge Encryption .
            </p>
          </div>
        </div>
      </section>

      {/* Education Navigation */}
      <section className="sticky top-16 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {[
              { id: 'what-is', label: 'What is Zero-Knowledge?' },
              { id: 'how-works', label: 'How It Works' },
              { id: 'comparison', label: 'Traditional vs Zero-Knowledge' },
              { id: 'benefits', label: 'Benefits & Trade-offs' },
              { id: 'technical', label: 'Technical Details' }
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                  setActiveSection(item.id);
                }}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* What is Zero-Knowledge? */}
          <EducationSection title="What is Zero-Knowledge Encryption?" id="what-is">
            <div className="space-y-6">
              <p className="text-lg text-slate-700 dark:text-slate-300">
                Zero-knowledge encryption is a security architecture where <strong>your data is encrypted on your device</strong> before it ever reaches our servers. This means we never see your passwords, your encryption keys, or any sensitive information.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <InfoCard
                  icon={(props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></Icon>}
                  title="Client-Side Encryption"
                  description="Encryption happens in your browser before data is sent. Your passwords are never transmitted in plain text."
                  variant="blue"
                />
                
                <InfoCard
                  icon={(props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></Icon>}
                  title="Complete Privacy"
                  description="We cannot decrypt your data, track your activity, or access your passwords. Only you hold the keys."
                  variant="purple"
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-8">
                <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">Simple Analogy</h4>
                <p className="text-slate-700 dark:text-slate-300">
                  Think of it like sending a locked safe through the mail. <strong>You keep the key</strong>, and you send only the locked safe to the post office (our servers). The post office can store and deliver the safe, but they can never open it because they don't have the key. Only you can unlock it when it arrives back to you.
                </p>
              </div>
            </div>
          </EducationSection>

          {/* How It Works */}
          <EducationSection title="How Zero-Knowledge Encryption Works" id="how-works">
            <div className="space-y-8">
              <StepVisualization
                step="1"
                title="Key Generation & Encryption"
                description="Your master password creates an encryption key locally. Passwords are encrypted before leaving your device."
              />
              
              <StepVisualization
                step="2"
                title="Secure Storage"
                description="Only encrypted data is sent to our servers. We store encrypted blobs that are useless without your key."
                isEven={true}
              />
              
              <StepVisualization
                step="3"
                title="Local Decryption"
                description="When you need a password, encrypted data is retrieved and decrypted locally on your device. The server remains blind."
              />
            </div>
          </EducationSection>

          {/* Comparison */}
          <EducationSection title="Traditional vs Zero-Knowledge Password Managers" id="comparison">
            <div className="space-y-6">
              <p className="text-slate-700 dark:text-slate-300">
                Most password managers use server-side encryption. Here's how zero-knowledge architecture differs:
              </p>
              
              <ComparisonTable />
              
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mt-8">
                <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-3">Key Takeaway</h4>
                <p className="text-slate-700 dark:text-slate-300">
                  With traditional password managers, the service provider <strong>could potentially access your data</strong> (though they typically don't). With zero-knowledge encryption, it's <strong>mathematically impossible</strong> for anyone but you to access your passwords.
                </p>
              </div>
            </div>
          </EducationSection>

          {/* Benefits & Trade-offs */}
          <EducationSection title="Benefits & Important Considerations" id="benefits">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-4">Benefits</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">Maximum privacy - We cannot see your data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">Protection from server breaches - Encrypted data is useless to hackers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">No government or legal requests can reveal your data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">Complete control over your encryption keys</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-4">Important Considerations</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-amber-700 dark:text-amber-400">!</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      <strong>No password recovery:</strong> If you forget your master password, we cannot reset it or recover your data
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-amber-700 dark:text-amber-400">!</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      <strong>Device dependency:</strong> You need access to a device with your encryption key to decrypt data
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-amber-700 dark:text-amber-400">!</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      <strong>Responsibility:</strong> You are solely responsible for keeping your master password secure
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-amber-700 dark:text-amber-400">!</span>
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      <strong>Limited features:</strong> Some features like password sharing require more complex implementations
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </EducationSection>

          {/* Technical Details */}
          <EducationSection title="Technical Details (For the Curious)" id="technical">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard
                  icon={(props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75m-9 0V18a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-7.5m-9 0h3.75m-3.75 0h3.75" /></Icon>}
                  title="AES-256-GCM Encryption"
                  description="Military-grade encryption standard used by governments worldwide. 256-bit keys provide 2^256 possible combinations."
                  variant="blue"
                />
                
                <InfoCard
                  icon={(props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></Icon>}
                  title="PBKDF2 Key Derivation"
                  description="100,000 iterations transform your master password into a secure encryption key, making brute-force attacks infeasible."
                  variant="green"
                />
              </div>
              
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Encryption Process Simplified</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <code className="bg-white dark:bg-slate-900 px-3 py-1 rounded text-sm font-mono text-slate-800 dark:text-slate-300">
                      masterKey = PBKDF2(password, salt, 100000)
                    </code>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Step 1: Derive key from password</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <code className="bg-white dark:bg-slate-900 px-3 py-1 rounded text-sm font-mono text-slate-800 dark:text-slate-300">
                      encrypted = AES-256-GCM(password, masterKey, randomIV)
                    </code>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Step 2: Encrypt with random initialization vector</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <code className="bg-white dark:bg-slate-900 px-3 py-1 rounded text-sm font-mono text-slate-800 dark:text-slate-300">
                      server.store(encrypted, iv)
                    </code>
                    <span className="text-sm text-slate-600 dark:text-slate-400">Step 3: Store only encrypted data</span>
                  </div>
                </div>
              </div>
            </div>
          </EducationSection>

          {/* Final CTA */}
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Experience True Privacy?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              Now that you understand how zero-knowledge encryption protects your data, try it for yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/register"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-3 px-8 rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-3"
              >
                <ShieldIcon className="w-5 h-5" />
                Create Your Secure Vault
              </a>
              <a
                href="/login"
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-3 px-8 rounded-lg transition-colors"
              >
                Sign In to Existing Account
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg">
                <ShieldIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                CipherVault
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
              An educational project demonstrating zero-knowledge encryption principles. Your privacy matters.
            </p>
            <div className="text-sm text-slate-500 dark:text-slate-500">
              © 2025 CipherVault • This is an educational demonstration
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}