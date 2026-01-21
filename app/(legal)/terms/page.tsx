'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, AlertTriangle, CheckCircle2, Scale, Ban, Calendar } from "lucide-react"
import Link from "next/link"

export default function TermsOfServicePage() {
  const lastUpdated = "January 1, 2026" // [CUSTOMIZE: Update this date]
  const effectiveDate = "January 1, 2026" // [CUSTOMIZE: Update this date]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-6">
            <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground text-lg">
            Please read these terms carefully before using our Service
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Effective Date: {effectiveDate} | Last Updated: {lastUpdated}</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            {/* Introduction */}
            <section className="mb-8">
              <p className="text-base leading-relaxed text-muted-foreground">
                These Terms of Service ("Terms", "Agreement") govern your access to and use of the wrkportal.com platform and services (the "Service") operated by wrkportal.com ("we," "us," or "our").
              </p>
              <p className="text-base leading-relaxed text-muted-foreground mt-4">
                <strong>By accessing or using the Service, you agree to be bound by these Terms.</strong> If you do not agree to these Terms, you may not access or use the Service.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Quick Navigation */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Quick Navigation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: "Acceptance of Terms", href: "#acceptance" },
                  { title: "User Accounts", href: "#accounts" },
                  { title: "Acceptable Use", href: "#use" },
                  { title: "Intellectual Property", href: "#ip" },
                  { title: "Payment Terms", href: "#payment" },
                  { title: "Termination", href: "#termination" },
                  { title: "Disclaimers", href: "#disclaimers" },
                  { title: "Limitation of Liability", href: "#liability" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm hover:underline"
                  >
                    → {item.title}
                  </a>
                ))}
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 1: Acceptance */}
            <section id="acceptance" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
              </div>

              <div className="space-y-4 text-muted-foreground">
                <p>
                  By creating an account, accessing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy.
                </p>
                <p>
                  If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 2: Service Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>

              <p className="text-muted-foreground mb-4">
                wrkportal.com provides a comprehensive business management platform that includes:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Project and task management tools</li>
                <li>Team collaboration features</li>
                <li>Resource planning and tracking</li>
                <li>Reporting and analytics</li>
                <li>AI-powered assistance (when enabled)</li>
                <li>Integration capabilities with third-party services</li>
              </ul>

              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm">
                  <strong>Note:</strong> We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 3: User Accounts */}
            <section id="accounts" className="mb-8 scroll-mt-4">
              <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">3.1 Account Creation</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>You must provide accurate and complete information</li>
                    <li>You must be at least 16 years old to use the Service</li>
                    <li>One person or entity may only maintain one account</li>
                    <li>You may not share your account credentials with others</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3.2 Account Security</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>You are responsible for maintaining the security of your account</li>
                    <li>You must notify us immediately of any unauthorized access</li>
                    <li>You are responsible for all activities under your account</li>
                    <li>We recommend using strong, unique passwords and enabling two-factor authentication</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3.3 Organization Accounts</h3>
                  <p className="text-muted-foreground">
                    Organization administrators have the ability to manage users, view activity, and control access to data within their organization's account.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 4: Acceptable Use */}
            <section id="use" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Ban className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold">4. Acceptable Use Policy</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                You agree NOT to use the Service to:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to systems or data</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated tools to access the Service without permission</li>
                <li>Reverse engineer, decompile, or attempt to extract source code</li>
                <li>Use the Service to compete with us or create a similar product</li>
                <li>Upload viruses, malware, or malicious code</li>
                <li>Engage in spamming or unsolicited communications</li>
                <li>Impersonate others or misrepresent your affiliation</li>
                <li>Collect user data without consent</li>
              </ul>

              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <p className="text-sm">
                    <strong>Violation of these terms may result in immediate suspension or termination of your account.</strong>
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 5: User Content */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. User Content</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">5.1 Your Content</h3>
                  <p className="text-muted-foreground mb-3">
                    You retain ownership of all content you upload, create, or store in the Service ("User Content"). You are solely responsible for your User Content and the consequences of posting or publishing it.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">5.2 License to Us</h3>
                  <p className="text-muted-foreground mb-3">
                    By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, store, and process your User Content solely to provide and improve the Service.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">5.3 Content Restrictions</h3>
                  <p className="text-muted-foreground">
                    You must not upload content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of privacy, or otherwise objectionable.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">5.4 Content Monitoring</h3>
                  <p className="text-muted-foreground">
                    While we do not routinely monitor User Content, we reserve the right to review and remove content that violates these Terms or applicable laws.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 6: Intellectual Property */}
            <section id="ip" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-purple-600" />
                <h2 className="text-2xl font-bold">6. Intellectual Property Rights</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">6.1 Our Intellectual Property</h3>
                  <p className="text-muted-foreground">
                    The Service, including its software, design, text, graphics, logos, and other content (excluding User Content), is owned by wrkportal.com and protected by copyright, trademark, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">6.2 Limited License</h3>
                  <p className="text-muted-foreground">
                    We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service in accordance with these Terms. This license does not include any right to: (a) resell or commercial use of the Service, (b) download or copy account information, (c) use data mining or similar tools, or (d) use the Service in any unauthorized manner.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">6.3 Trademarks</h3>
                  <p className="text-muted-foreground">
                    "wrkportal.com" and related logos are trademarks. You may not use our trademarks without our prior written permission.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 7: Payment Terms */}
            <section id="payment" className="mb-8 scroll-mt-4">
              <h2 className="text-2xl font-bold mb-4">7. Payment Terms</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">7.1 Subscription Plans</h3>
                  <p className="text-muted-foreground">
                    Access to certain features requires a paid subscription. Current pricing is available on our website and may be changed with 30 days' notice.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">7.2 Billing</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                    <li>Payments are processed through secure third-party payment providers</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>You are responsible for all applicable taxes</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">7.3 Automatic Renewal</h3>
                  <p className="text-muted-foreground">
                    Your subscription will automatically renew unless you cancel before the renewal date. You may cancel at any time through your account settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">7.4 Failed Payments</h3>
                  <p className="text-muted-foreground">
                    If a payment fails, we may suspend your access to paid features until payment is received. If payment is not received within 30 days, we may terminate your account.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">7.5 Free Trial</h3>
                  <p className="text-muted-foreground">
                    We may offer free trials for certain plans. After the trial period ends, you will be charged unless you cancel before the trial expires.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 8: Termination */}
            <section id="termination" className="mb-8 scroll-mt-4">
              <h2 className="text-2xl font-bold mb-4">8. Termination</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">8.1 By You</h3>
                  <p className="text-muted-foreground">
                    You may terminate your account at any time through your account settings or by contacting us. Termination takes effect at the end of your billing period.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">8.2 By Us</h3>
                  <p className="text-muted-foreground mb-3">
                    We may suspend or terminate your access to the Service at any time if:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>You violate these Terms</li>
                    <li>Your use of the Service poses a security risk</li>
                    <li>You fail to pay fees when due</li>
                    <li>We are required to do so by law</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">8.3 Effect of Termination</h3>
                  <p className="text-muted-foreground">
                    Upon termination, your right to use the Service will immediately cease. We may delete your data after a reasonable period. You should export your data before termination.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 9: Disclaimers */}
            <section id="disclaimers" className="mb-8 scroll-mt-4">
              <h2 className="text-2xl font-bold mb-4">9. Disclaimers</h2>

              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border">
                <p className="text-muted-foreground mb-4">
                  <strong>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.</strong>
                </p>

                <p className="text-muted-foreground mb-4">
                  We disclaim all warranties, express or implied, including but not limited to:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Warranties of merchantability or fitness for a particular purpose</li>
                  <li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
                  <li>Warranties regarding the accuracy or reliability of any information obtained through the Service</li>
                  <li>Warranties that defects will be corrected</li>
                </ul>

                <p className="text-muted-foreground mt-4">
                  You use the Service at your own risk. We do not warrant that the Service will meet your requirements or expectations.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 10: Limitation of Liability */}
            <section id="liability" className="mb-8 scroll-mt-4">
              <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>

              <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border">
                <p className="text-muted-foreground mb-4">
                  <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW, WRKPORTAL.COM SHALL NOT BE LIABLE FOR:</strong>
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Cost of procurement of substitute services</li>
                  <li>Any damages arising from your use or inability to use the Service</li>
                </ul>

                <p className="text-muted-foreground mt-4">
                  <strong>IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.</strong>
                </p>

                <p className="text-muted-foreground mt-4 text-sm">
                  Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so these limitations may not apply to you.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 11: Indemnification */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Indemnification</h2>

              <p className="text-muted-foreground">
                You agree to indemnify, defend, and hold harmless wrkportal.com and its officers, directors, employees, and agents from any claims, losses, damages, liabilities, and expenses (including legal fees) arising from:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your User Content</li>
              </ul>
            </section>

            <Separator className="my-8" />

            {/* Section 12: Dispute Resolution */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Dispute Resolution</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">12.1 Informal Resolution</h3>
                  <p className="text-muted-foreground">
                    If you have a dispute, please contact us first to attempt to resolve it informally.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">12.2 Governing Law</h3>
                  <p className="text-muted-foreground">
                    These Terms shall be governed by and construed in accordance with the laws of [CUSTOMIZE: Your Jurisdiction], without regard to its conflict of law provisions.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">12.3 Jurisdiction</h3>
                  <p className="text-muted-foreground">
                    Any disputes shall be resolved exclusively in the courts of [CUSTOMIZE: Your Jurisdiction].
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 13: General Provisions */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">13. General Provisions</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">13.1 Changes to Terms</h3>
                  <p className="text-muted-foreground">
                    We may modify these Terms at any time. Material changes will be notified via email or through the Service. Continued use after changes constitutes acceptance.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">13.2 Entire Agreement</h3>
                  <p className="text-muted-foreground">
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and wrkportal.com.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">13.3 Severability</h3>
                  <p className="text-muted-foreground">
                    If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">13.4 Waiver</h3>
                  <p className="text-muted-foreground">
                    Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">13.5 Assignment</h3>
                  <p className="text-muted-foreground">
                    You may not assign or transfer these Terms without our prior written consent. We may assign our rights without restriction.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Contact Section */}
            <section>
              <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you have questions about these Terms, please contact us:
                </p>

                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div className="space-y-2">
                    <p className="font-semibold">wrkportal.com Legal Team</p>
                    <p className="text-muted-foreground">Email: <a href="mailto:legal@wrkportal.com" className="text-purple-600 hover:underline">legal@wrkportal.com</a></p>
                    <p className="text-muted-foreground">Website: <a href="https://www.wrkportal.com" className="text-purple-600 hover:underline">www.wrkportal.com</a></p>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Acknowledgment */}
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-center">
                <strong>By using wrkportal.com, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

