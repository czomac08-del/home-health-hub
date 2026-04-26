import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import { CURRENT_TERMS_VERSION } from "@/lib/privacy";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Privacy Policy — ComingHomeIQ"
      description="How ComingHomeIQ collects, uses, and protects your personal information and property data. Read our full privacy policy including CCPA rights and data retention practices."
      path="/privacy"
      type="article"
    />
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">ComingHomeIQ Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">
        Version {CURRENT_TERMS_VERSION} · Last Updated: April 2026
      </p>

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
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Data</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide, maintain, and improve the Service</li>
            <li>Verify property records against public sources</li>
            <li>Send service notifications, discovery results, and (with your opt-in) marketing emails</li>
            <li>Generate legal compliance flags based on your state</li>
            <li>Share civic data with government agencies (only with your explicit consent)</li>
            <li>Process payments and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p className="mt-3">
            <strong>Legitimate business interests.</strong> By using ComingHomeIQ you also acknowledge
            that we may, on an ongoing basis:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Use anonymized, aggregated property and usage data to improve platform features and accuracy.</li>
            <li>Generate market insights and property trend reports that are never identifiable to individual users.</li>
            <li>Train and improve AI models using anonymized property data — never personal PII.</li>
            <li>Share anonymized statistical data with partners — never raw personal information.</li>
            <li>Retain data necessary for fraud detection, dispute resolution, and legal compliance even after account deletion.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2a. Federal Law Compliance</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>FTC Act, Section 5:</strong> We do not engage in unfair or deceptive data
              practices. Our data handling matches what is described in this policy.
            </li>
            <li>
              <strong>FCRA disclaimer:</strong> Property data we collect is{" "}
              <strong>not a consumer report</strong> and is{" "}
              <strong>
                NOT used for credit, employment, insurance underwriting, or housing eligibility
                decisions.
              </strong>{" "}
              ComingHomeIQ is not a consumer reporting agency under the Fair Credit Reporting Act.
            </li>
            <li>
              <strong>CAN-SPAM Act:</strong> Marketing emails include an unsubscribe link, our
              physical address, and we honor opt-out requests within 10 business days.
            </li>
            <li>
              <strong>COPPA:</strong> ComingHomeIQ is intended for users 18 years of age and older.
              We do not knowingly collect information from children. An age confirmation is required
              at signup.
            </li>
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
          <p className="mt-2">
            Submit any of these requests from{" "}
            <strong>Account Settings → Privacy Requests</strong> or by emailing{" "}
            <a className="underline text-primary" href="mailto:privacy@cominghomeiq.com">
              privacy@cominghomeiq.com
            </a>
            . We respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. State Privacy Laws</h2>
          <p>
            <strong>California (CCPA / CPRA).</strong> You have the right to know what personal
            information is collected, the right to delete personal information, the right to
            correct inaccurate data, the right to opt out of the &quot;sale&quot; or
            &quot;sharing&quot; of personal information, and the right to non-discrimination for
            exercising your rights.
          </p>
          <p>
            <strong>Virginia (CDPA), Colorado (CPA), Connecticut (CTDPA), Texas (TDPSA).</strong>{" "}
            You have the right to access, correct, delete, and obtain a portable copy of your
            personal data, and the right to opt out of targeted advertising, sale of personal data,
            and profiling decisions that produce significant effects.
          </p>
          <p>
            <strong>North Carolina &amp; South Carolina.</strong> No comprehensive state privacy
            law applies as of 2026. ComingHomeIQ voluntarily applies the same protections.
          </p>

          <h3 id="do-not-sell" className="text-base font-semibold text-foreground mt-6 scroll-mt-24">
            Do Not Sell or Share My Personal Information
          </h3>
          <p>
            ComingHomeIQ does <strong>not</strong> sell your personal information and does{" "}
            <strong>not</strong> share it for cross-context behavioral advertising. No action is
            required on your part to opt out, but you may confirm or submit a formal opt-out
            request from <strong>Account Settings → Privacy Requests</strong> or by emailing{" "}
            <a className="underline text-primary" href="mailto:privacy@cominghomeiq.com">
              privacy@cominghomeiq.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Age Requirement (COPPA)</h2>
          <p>
            ComingHomeIQ is for users 18 years of age and older. We require an age confirmation at
            signup and do not knowingly collect personal information from anyone under 18.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Data Retention</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Personal data (name, email, phone):</strong> retained while your account is
              active. If you request deletion we anonymize the personally-identifying fields
              (replacing them with <code>[DELETED]</code>) while preserving property records and
              transaction history in anonymized form for platform integrity.
            </li>
            <li>
              <strong>Property records (address, systems, inspection findings, photos):</strong>{" "}
              retained indefinitely. Property data is a legitimate business asset of the platform
              even after a user departs. Inspector-uploaded data is never deleted, per our data
              trust hierarchy. Photo originals remain archived in encrypted storage; only the
              user-facing view is removed when you soft-delete a photo.
            </li>
            <li>
              <strong>Platform analytics:</strong> retained indefinitely in aggregated form, not
              tied to identifiable users in our analytics views.
            </li>
            <li>
              <strong>Payment records:</strong> retained as required by law (typically 7 years).
            </li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Hard deletion of records from our database is prohibited except by court order.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Security</h2>
          <p>We use industry-standard security measures including encryption in transit (TLS) and at rest, access controls, and regular security reviews. No system is perfectly secure. In the event of a data breach affecting your personal information, we will notify you as required by applicable law.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. We use analytics
            cookies, when permitted, to understand how the platform is used. You may set your
            preference at any time from the &quot;Cookie Preferences&quot; link in the footer.
            Analytics will not fire unless you have selected &quot;Accept All&quot;.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. International Users (GDPR)</h2>
          <p>
            ComingHomeIQ is operated from the United States. If you access the Service from the
            European Union or European Economic Area, we apply GDPR standards as our default — which
            are stricter than US law. You retain the rights of access, rectification, erasure,
            portability, restriction of processing, and objection.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Changes to This Policy</h2>
          <p>
            We will notify you of material changes via email and by posting the updated policy with
            a new effective date. If we materially change this policy, we will ask you to re-accept
            it on your next sign in.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
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
