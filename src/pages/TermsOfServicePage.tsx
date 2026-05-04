import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

const TermsOfServicePage = () => (
  <div className="min-h-screen bg-background">
    <SEO
      title="Terms of Service — ComingHomeIQ"
      description="Read the ComingHomeIQ Terms of Service. Learn about user responsibilities, account terms, data usage, and the legal agreements that govern use of our home intelligence platform."
      path="/terms"
      type="article"
    />
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">ComingHomeIQ Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last Updated: May 2026 (Version 2.0.0)</p>

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
            <li><strong>Not a licensed real estate broker, agent, or appraiser.</strong> Property values, market data, and comparable sales information are informational only and do not constitute a real estate appraisal or professional opinion of value.</li>
            <li><strong>Not a financial, investment, or tax advisor.</strong> ROI estimates, cost savings calculations, and investment analysis tools are illustrative only. Consult a licensed financial advisor or CPA before making financial decisions.</li>
            <li><strong>Not a Consumer Reporting Agency (FCRA).</strong> ComingHomeIQ is not a Consumer Reporting Agency as defined by the Fair Credit Reporting Act, 15 U.S.C. § 1681. Information provided through this platform may not be used in whole or in part as a factor in determining consumer credit, insurance, employment eligibility, tenant screening, or any other purpose covered by the FCRA. Use of our data for FCRA-regulated purposes is strictly prohibited and may result in termination of access and legal liability.</li>
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
          <p className="mt-3"><strong>RESPA compliance.</strong> Consistent with the Real Estate Settlement Procedures Act (12 U.S.C. § 2601), ComingHomeIQ does not accept finder's fees, kickbacks, or other unearned fees from contractors, inspectors, or real estate settlement service providers in exchange for placement or referrals. Our homeowner referral program rewards users for introducing other users to our subscription software platform — not for real estate settlement services.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">11. Prohibited Uses</h2>
          <p>You may not use the Service for any of the following:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Any purpose regulated by the Fair Credit Reporting Act, including credit, insurance, employment, or tenant screening decisions.</li>
            <li>Tenant screening or housing decisions in violation of the Fair Housing Act (42 U.S.C. § 3604), or any discrimination based on race, color, national origin, religion, sex, familial status, or disability.</li>
            <li>Scraping, data harvesting, bulk export, or any automated extraction of platform data.</li>
            <li>Commercial resale or redistribution of platform data without a written license from ComingHomeIQ.</li>
            <li>Any purpose that violates federal, state, or local law.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">12. AI-Generated Content</h2>
          <p>ComingHomeIQ uses artificial intelligence to extract, analyze, and present property information. AI-generated content may contain errors and should not be relied upon as the sole basis for decisions. Always verify important information through independent sources. We do not use AI to make automated decisions that produce legal or similarly significant effects on individuals without human review.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">13. User-Generated Content; Section 230</h2>
          <p>ComingHomeIQ is an "interactive computer service" within the meaning of 47 U.S.C. § 230 and is not the publisher or speaker of information provided by users. By submitting content (documents, photos, notes, etc.) you grant ComingHomeIQ a perpetual, worldwide, royalty-free, sublicensable license to store, display, process, and use that content to operate and improve the Service. You represent that you have all rights necessary to upload any content you submit.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">14. DMCA / Copyright</h2>
          <p>ComingHomeIQ respects intellectual property rights. To submit a takedown notice under the Digital Millennium Copyright Act (17 U.S.C. § 512), email our designated agent at <a href="mailto:legal@cominghomeiq.com" className="text-primary underline">legal@cominghomeiq.com</a> with: (a) identification of the copyrighted work; (b) identification of the allegedly infringing material and its URL; (c) your contact information; (d) a good-faith statement; and (e) a statement under penalty of perjury that you are authorized to act. Counter-notices will be processed under 17 U.S.C. § 512(g).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">15. Payment Security</h2>
          <p>Payment processing is provided by Stripe, Inc. ComingHomeIQ does not store, process, or transmit cardholder data. Stripe is a PCI DSS Level 1 certified payment processor.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">16. Accessibility</h2>
          <p>ComingHomeIQ strives to conform to WCAG 2.1 Level AA. Users who need accessibility accommodations may contact <a href="mailto:support@cominghomeiq.com" className="text-primary underline">support@cominghomeiq.com</a>.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">17. Intellectual Property</h2>
          <p>ComingHomeIQ's platform, design, True Record system, and proprietary algorithms are protected by intellectual property law. Property records you upload remain your property. Public records data remains public. AI-generated analyses are a work product of the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">18. Limitation of Liability</h2>
          <p className="uppercase text-xs leading-relaxed">TO THE MAXIMUM EXTENT PERMITTED BY LAW, COMINGHOMEIQ SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE OR RELIANCE ON ANY INFORMATION PROVIDED, INCLUDING BUT NOT LIMITED TO DAMAGES FOR ERRORS IN PROPERTY RECORDS, MISSED DISCLOSURE OBLIGATIONS, INACCURATE AI ANALYSIS, THIRD-PARTY DATA ERRORS, OR THE ACTS OR OMISSIONS OF CONTRACTORS, INSPECTORS, ATTORNEYS, OR OTHER PROFESSIONALS DISCOVERED THROUGH THE PLATFORM. OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ANY AND ALL CLAIMS SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS ($100).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">19. Indemnification</h2>
          <p>You agree to indemnify, defend, and hold harmless ComingHomeIQ, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from: (a) your use of the platform; (b) any content you upload; (c) your violation of these Terms; (d) your violation of any applicable law, including disclosure obligations and the Fair Housing Act; or (e) your violation of any third-party rights.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">20. Governing Law &amp; Jurisdiction</h2>
          <p>These Terms are governed by the laws of the State of Wyoming, where ComingHomeIQ LLC is organized, without regard to conflict-of-law provisions. Subject to Section 21, the exclusive jurisdiction and venue for any action arising from these Terms shall be the state and federal courts located in Wyoming.</p>
          <p className="mt-3">If you are using this platform from outside the United States, you do so at your own risk and are responsible for compliance with local laws.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">21. Mandatory Arbitration; Class Action Waiver</h2>
          <p>Except for individual claims that may be brought in small claims court, all disputes between you and ComingHomeIQ shall be resolved by binding individual arbitration administered by the American Arbitration Association under its Consumer Arbitration Rules. Arbitration will be held in Wyoming or conducted remotely.</p>
          <p className="uppercase text-xs leading-relaxed mt-3">YOU AND COMINGHOMEIQ AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, OR REPRESENTATIVE PROCEEDING. YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">22. Changes to These Terms</h2>
          <p>We may update these Terms at any time. We will notify registered users of material changes via email and may require re-acknowledgment in-app before continued use. Continued use of the Service after changes constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">23. Contact</h2>
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
