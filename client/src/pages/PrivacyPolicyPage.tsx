import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { CookiePreferencesModal } from "@/components/CookieConsent";

export default function PrivacyPolicyPage() {
  const [showCookiePrefs, setShowCookiePrefs] = useState(false);

  const handleSaveCookiePrefs = (prefs: { essential: boolean; functional: boolean; analytics: boolean }) => {
    localStorage.setItem("meridian_cookie_consent", "true");
    localStorage.setItem("meridian_cookie_preferences", JSON.stringify(prefs));
    setShowCookiePrefs(false);
  };

  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <div className="editorial-divider"></div>
        </header>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground">
          <p className="drop-cap">
            The Meridian ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains 
            how we collect, use, and safeguard your information when you visit our website and use our services.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">1. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and authentication credentials provided through your login provider.</li>
            <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our platform, including pages viewed, stories read, and features used.</li>
            <li><strong>Device Information:</strong> We collect information about the device and browser you use to access our services, including IP address, browser type, and operating system.</li>
            <li><strong>Cookies:</strong> We use cookies and similar technologies to maintain your session, remember your preferences, and improve your experience. You can manage your cookie preferences at any time.</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Provide, maintain, and improve our news aggregation and analysis services.</li>
            <li>Personalize your experience and deliver content relevant to your interests.</li>
            <li>Communicate with you about updates, features, and changes to our platform.</li>
            <li>Monitor and analyze usage patterns to improve platform performance and reliability.</li>
            <li>Protect against unauthorized access, fraud, and other illegal activities.</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">3. Information Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Service Providers:</strong> We may share information with trusted third-party services that help us operate our platform (e.g., hosting, analytics).</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law, regulation, or legal process.</li>
            <li><strong>Safety:</strong> We may share information when we believe it is necessary to protect the safety, rights, or property of our users or the public.</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
            alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, 
            and we cannot guarantee absolute security.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Access the personal information we hold about you.</li>
            <li>Request correction of inaccurate or incomplete information.</li>
            <li>Request deletion of your personal information, subject to legal obligations.</li>
            <li>Opt out of non-essential communications from us.</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">6. Cookies &amp; Tracking</h2>
          <p>We use three categories of cookies on The Meridian:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li><strong>Essential Cookies:</strong> Required for the website to function. These manage your login session, security tokens, and consent preferences. They cannot be disabled.</li>
            <li><strong>Functional Cookies:</strong> Enable personalized features such as your theme preference (light/dark mode), edition selection, font size, and location settings for local news.</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the platform so we can improve usability and performance. These are off by default and require your consent.</li>
          </ul>
          <p className="mt-4">
            You can review and change your cookie preferences at any time by clicking{" "}
            <button
              onClick={() => setShowCookiePrefs(true)}
              className="underline text-foreground hover:text-foreground/80 font-medium"
              data-testid="button-manage-cookies-inline"
            >
              Manage Cookie Preferences
            </button>.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">7. Third-Party Links</h2>
          <p>
            Our platform contains links to third-party news sources and websites. We are not responsible for the privacy practices 
            or content of these external sites. We encourage you to review the privacy policies of any third-party sites you visit.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">8. Children's Privacy</h2>
          <p>
            Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information 
            from children under 13. If we become aware that we have collected such information, we will take steps to delete it promptly.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated 
            policy on this page with a revised "Last updated" date. Your continued use of our services after changes are posted 
            constitutes your acceptance of the updated policy.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">10. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or our data practices, please reach out via our <Link href="/contact" className="underline text-foreground hover:text-foreground/80">Contact Us</Link> page.
          </p>
        </div>

        <div className="mt-20 pt-10 border-t border-border flex justify-center">
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-foreground text-background font-serif font-bold hover:bg-foreground/90 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>

      <CookiePreferencesModal
        isOpen={showCookiePrefs}
        onClose={() => setShowCookiePrefs(false)}
        onSave={handleSaveCookiePrefs}
      />
    </div>
  );
}
