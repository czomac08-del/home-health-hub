import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfServicePage = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">ComingHomeIQ Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last Updated: April 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-foreground/90">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>By creating an account or using ComingHomeIQ ("the Service," "we," "us," "our"), you agree to these Terms of Service. If you do not agree, do not use the Service. You must be at least 18 years old to use ComingHomeIQ. By using the Service, you represent that you are 18 or older.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. What ComingHomeIQ Is</h2>
          <p>ComingHomeIQ is a property record management and research platform. We help homeowners collect, organize, verify, and preserve records about their properties. We are not a title company, real estate brokerage, law firm, licensed inspection service, or government agency. We are a technology platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. What ComingHomeIQ Is Not</h2>
          <ul className="list-disc pl-5 space-y-3">
            <li><strong>Not legal advice.</strong> Nothing on this platform constitutes legal advice. Attorney referrals are provided as a convenience only. Always consult a licensed attorney in your state for legal questions.</li>
            <li><strong>Not a licensed inspection service.</strong> ComingHomeIQ does not inspect properties. AI analysis of satellite imagery and uploaded documents is for informational purposes only and does not substitute for a professional inspection by a licensed inspector.</li>
            <li><strong>Not a consumer reporting agency.</strong> ComingHomeIQ data may not be used for purposes regulated by the Fair Credit Reporting Act (FCRA), including but not limited to credit decisions, insurance underwriting, employment screening, or tenant screening. Using ComingHomeIQ data for these purposes without proper FCRA compliance is prohibited.</li>
            <li><strong>Not guaranteed accurate.</strong> Property records, AI extractions, satellite analyses, and government data integrated into this platform may contain errors, omissions, or outdated information. Always verify important information with original source documents and licensed professionals.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. User Accounts</h2>
          <p>You are responsible for maintaining the security of your account. You agree to provide accurate information and to update it when it changes. You may not share your account with others or create accounts for properties you do not own or have authorization to manage.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Your Property Data</h2>
          <p>You retain ownership of information you enter about your property. By entering information, you grant ComingHomeIQ a license to store, process, display, and use that information to provide the Service — including cross-referencing it with public records and satellite imagery to verify accuracy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Civic Data Sharing</h2>
          <p>If you consent to civic data sharing during document upload, ComingHomeIQ may share verified, anonymized property record data with county and state government agencies to help modernize public property records. Your name and personal contact information are never included in civic data shares — only the document content, property address, and extracted record fields. You may withdraw civic data sharing consent at any time in Settings.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Property Data Persistence</h2>
          <p>Property records attached to a property address persist in our system for historical preservation purposes even if you close your account. This is a core feature of the platform — property history is tied to the property, not the user. Your personal account information (name, email, payment data) will be deleted upon account closure. To request deletion of all associated data including property records, contact us at privacy@cominghomeiq.com.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Disclosure Obligations</h2>
          <p>ComingHomeIQ may alert you to potential legal disclosure obligations based on information you enter. These alerts are informational only and do not constitute legal advice. Disclosure laws vary by state and change over time. You are solely responsible for complying with all applicable disclosure requirements when selling or transferring your property. Always consult a licensed real estate attorney in your state.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. Third-Party Services</h2>
          <p>ComingHomeIQ integrates with third-party services including RentCast, YouTube, Amazon, USDA, FEMA, EPA, and county government databases. We are not responsible for the accuracy or availability of third-party data. Amazon affiliate links are marked as such. We may receive commissions on purchases made through affiliate links at no cost to you.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Contractor and Professional Referrals</h2>
          <p>ComingHomeIQ does not endorse, vet, or guarantee any contractor, attorney, inspector, or other professional referenced on the platform. Referrals to professional organizations (state bar associations, NGWA, etc.) are provided as a convenience. You are responsible for independently verifying the credentials and suitability of any professional you hire.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Intellectual Property</h2>
          <p>ComingHomeIQ's platform, design, True Record system, and proprietary algorithms are protected by intellectual property law. Property records you upload remain your property. Public records data remains public. AI-generated analyses are a work product of the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">12. Limitation of Liability</h2>
          <p className="uppercase text-xs leading-relaxed">TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMINGHOMEIQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE OR RELIANCE ON ANY INFORMATION PROVIDED, INCLUDING BUT NOT LIMITED TO DAMAGES FOR ERRORS IN PROPERTY RECORDS, MISSED DISCLOSURE OBLIGATIONS, INACCURATE AI ANALYSIS, OR THIRD-PARTY DATA ERRORS. OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">13. Indemnification</h2>
          <p>You agree to indemnify and hold harmless ComingHomeIQ, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the platform, your violation of these Terms, or your violation of any applicable law including disclosure obligations.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">14. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Wyoming, where ComingHomeIQ LLC is organized, without regard to conflict of law provisions. Disputes shall be resolved by binding arbitration in accordance with the American Arbitration Association rules.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">15. Changes to These Terms</h2>
          <p>We may update these Terms at any time. We will notify registered users of material changes via email. Continued use of the Service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">16. Contact</h2>
          <p>ComingHomeIQ LLC<br />legal@cominghomeiq.com</p>
        </section>
      </div>

      <div className="border-t border-border mt-12 pt-6 text-center">
        <p className="text-[10px] text-muted-foreground/60">© 2026 ComingHomeIQ LLC. All rights reserved.</p>
      </div>
    </div>
  </div>
);

export default TermsOfServicePage;
