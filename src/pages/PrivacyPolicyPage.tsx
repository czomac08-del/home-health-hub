import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">ComingHomeIQ Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last Updated: April 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
          <h3 className="text-sm font-semibold text-foreground mt-4">Information you provide:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information: name, email address, password</li>
            <li>Property information: address, property details, system records</li>
            <li>Documents you upload: permits, inspection reports, water tests, photos</li>
            <li>Payment information: processed by Stripe — we do not store card numbers</li>
            <li>Communications: messages, support requests</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4">Information collected automatically:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Usage data: pages visited, features used, time spent</li>
            <li>Device information: browser type, operating system, IP address</li>
            <li>Location: general location derived from property address</li>
          </ul>
          <h3 className="text-sm font-semibold text-foreground mt-4">Information from third parties:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Property data from RentCast, county assessors, and public records</li>
            <li>Satellite imagery from USGS NAIP program</li>
            <li>Environmental data from EPA, FEMA, and USDA</li>
            <li>Drought data from USDA Drought Monitor</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and improve the Service</li>
            <li>To verify property records against public sources</li>
            <li>To send discovery results and record alerts</li>
            <li>To generate legal compliance flags based on your state</li>
            <li>To share civic data with government agencies (with your consent only)</li>
            <li>To process payments</li>
            <li>To send service notifications and updates</li>
            <li>To comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Information We Share</h2>
          <p><strong>We never sell your personal information.</strong></p>
          <p>We share information only in these circumstances:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Government agencies (with consent):</strong> Verified property record data only, never personal information, only when civic data sharing consent is given</li>
            <li><strong>Service providers:</strong> Stripe (payments), database hosting, email service providers — bound by data processing agreements</li>
            <li><strong>Legal requirements:</strong> If required by law, court order, or to protect rights and safety</li>
            <li><strong>Business transfers:</strong> In the event of a merger or acquisition, with notice to users</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Your Rights — All Users</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and personal data (property records tied to property address are preserved per our data persistence policy)</li>
            <li><strong>Portability:</strong> Request your data in a portable format</li>
            <li><strong>Opt-out of communications:</strong> Unsubscribe from marketing emails at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. California Residents — CCPA Rights</h2>
          <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Right to know what personal information is collected and how it is used</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
            <li>Right to non-discrimination for exercising your rights</li>
          </ul>
          <p className="mt-2">To exercise CCPA rights, contact: privacy@cominghomeiq.com</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Children's Privacy</h2>
          <p>ComingHomeIQ is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us personal information, contact us immediately.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> retained while your account is active, deleted within 30 days of account closure</li>
            <li><strong>Property records:</strong> retained permanently as part of the historical property archive (tied to property address, not user account)</li>
            <li><strong>Payment records:</strong> retained as required by law (typically 7 years)</li>
            <li><strong>Usage data:</strong> retained for 24 months</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Security</h2>
          <p>We use industry-standard security measures including encryption in transit (TLS) and at rest, access controls, and regular security reviews. No system is perfectly secure. In the event of a data breach affecting your personal information, we will notify you as required by applicable law.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We use analytics cookies to understand how the platform is used. You may disable non-essential cookies in your browser settings.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Changes to This Policy</h2>
          <p>We will notify you of material changes via email and by posting the updated policy with a new effective date.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
          <p>privacy@cominghomeiq.com<br />ComingHomeIQ LLC</p>
        </section>
      </div>

      <div className="border-t border-border mt-12 pt-6 text-center">
        <p className="text-[10px] text-muted-foreground/60">© 2026 ComingHomeIQ LLC. All rights reserved.</p>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyPage;
