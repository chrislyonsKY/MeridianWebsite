import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="mb-16 text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground font-serif italic">
            Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <div className="editorial-divider"></div>
        </header>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground">
          <p className="drop-cap">
            Welcome to The Meridian. By accessing or using our platform, you agree to be bound by these Terms of Service. 
            Please read them carefully before using our services.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using The Meridian, you agree to comply with and be bound by these Terms of Service and our 
            Privacy Policy. If you do not agree to these terms, you may not access or use our services.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">2. Description of Service</h2>
          <p>
            The Meridian is a news aggregation and analysis platform that collects articles from multiple news sources, 
            clusters them by topic, and uses artificial intelligence to produce neutral summaries and identify narrative 
            divergences across the political spectrum. Our service is provided for informational purposes only.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">3. User Accounts</h2>
          <p>To access certain features, you may be required to create an account. You agree to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Provide accurate and complete information when creating your account.</li>
            <li>Maintain the security and confidentiality of your login credentials.</li>
            <li>Accept responsibility for all activities that occur under your account.</li>
            <li>Notify us immediately of any unauthorized use of your account.</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>Use our services for any unlawful or unauthorized purpose.</li>
            <li>Attempt to interfere with, compromise, or disrupt the platform or its infrastructure.</li>
            <li>Scrape, crawl, or use automated means to access our services without prior written consent.</li>
            <li>Reproduce, distribute, or republish our AI-generated summaries or analyses for commercial purposes without permission.</li>
            <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with any person or entity.</li>
          </ul>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">5. Intellectual Property</h2>
          <p>
            The Meridian's original content, including AI-generated summaries, analyses, and the platform's design, is protected 
            by intellectual property laws. Third-party news articles linked from our platform remain the property of their 
            respective publishers and are subject to their own terms and conditions.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">6. Disclaimer of Warranties</h2>
          <p>
            Our services are provided "as is" and "as available" without warranties of any kind, either express or implied. 
            We do not guarantee the accuracy, completeness, or reliability of any content on our platform, including AI-generated 
            summaries and analyses. The Meridian is not a substitute for professional journalism, legal advice, or any other 
            professional service.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, The Meridian and its operators shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages arising out of or related to your use of our services, 
            including but not limited to reliance on any information provided through the platform.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">8. Third-Party Content</h2>
          <p>
            Our platform aggregates and links to content from third-party news sources. We do not endorse, verify, or assume 
            responsibility for the accuracy or reliability of any third-party content. Your interaction with third-party websites 
            is governed by those sites' own terms and policies.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">9. Modifications to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. Changes will be effective when posted on this page 
            with an updated "Last updated" date. Your continued use of our services after any changes constitutes your acceptance 
            of the revised terms.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">10. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to our services at any time, with or without cause and 
            with or without notice, if we believe you have violated these Terms of Service or for any other reason at our sole discretion.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">11. Governing Law</h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to 
            conflict of law principles.
          </p>

          <h2 className="font-serif text-3xl font-bold mt-12 mb-6 border-b border-border pb-2">12. Contact Us</h2>
          <p>
            If you have any questions about these Terms of Service, please reach out via our <Link href="/contact" className="underline text-foreground hover:text-foreground/80">Contact Us</Link> page.
          </p>
        </div>

        <div className="mt-20 pt-10 border-t border-border flex justify-center">
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-foreground text-background font-serif font-bold hover:bg-foreground/90 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
