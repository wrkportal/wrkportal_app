'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Mail, Lock, Eye, Database, Globe, Calendar } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 1, 2026" // [CUSTOMIZE: Update this date]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">
            Your privacy is important to us
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Last Updated: {lastUpdated}</span>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            {/* Introduction */}
            <section className="mb-8">
              <p className="text-base leading-relaxed text-muted-foreground">
                wrkportal.com ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our project management platform and services (the "Service").
              </p>
            </section>

            <Separator className="my-8" />

            {/* Quick Links */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Quick Navigation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: "Information We Collect", href: "#collect" },
                  { title: "How We Use Your Information", href: "#use" },
                  { title: "Data Storage & Security", href: "#security" },
                  { title: "Your Rights", href: "#rights" },
                  { title: "Cookies & Tracking", href: "#cookies" },
                  { title: "Contact Us", href: "#contact" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm hover:underline"
                  >
                    → {item.title}
                  </a>
                ))}
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 1: Information We Collect */}
            <section id="collect" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">1. Information We Collect</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1.1 Information You Provide</h3>
                  <p className="text-muted-foreground mb-3">
                    When you use our Service, you may provide us with:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Account Information:</strong> Name, email address, password, profile photo</li>
                    <li><strong>Organization Details:</strong> Company name, department, role, contact information</li>
                    <li><strong>Project Data:</strong> Tasks, files, comments, timesheets, and other content you create</li>
                    <li><strong>Communication Data:</strong> Messages, feedback, and support requests</li>
                    <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely by third-party payment processors)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">1.2 Information Collected Automatically</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, click patterns</li>
                    <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                    <li><strong>Log Data:</strong> Access times, error logs, referring URLs</li>
                    <li><strong>Cookies:</strong> Session data, preferences, authentication tokens</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">1.3 Information from Third Parties</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>SSO Providers:</strong> When you sign in with Google or other providers, we receive basic profile information</li>
                    <li><strong>Integration Partners:</strong> Data from third-party tools you connect to wrkportal.com</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 2: How We Use Your Information */}
            <section id="use" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
              </div>

              <p className="text-muted-foreground mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Provide and maintain</strong> the Service</li>
                <li><strong>Process transactions</strong> and manage your account</li>
                <li><strong>Send important notifications</strong> about your account, projects, and tasks</li>
                <li><strong>Improve and personalize</strong> your experience</li>
                <li><strong>Ensure security</strong> and prevent fraud</li>
                <li><strong>Comply with legal obligations</strong></li>
                <li><strong>Communicate with you</strong> about updates, support, and marketing (with your consent)</li>
                <li><strong>Analyze usage patterns</strong> to improve our Service</li>
                <li><strong>Provide AI-powered features</strong> (when enabled)</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm">
                  <strong>Legal Basis (GDPR):</strong> We process your data based on: (a) your consent, (b) performance of our contract with you, (c) compliance with legal obligations, and (d) our legitimate interests in providing and improving our Service.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 3: Data Sharing */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">3. How We Share Your Information</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                We do not sell your personal information. We may share your information with:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">3.1 Within Your Organization</h3>
                  <p className="text-muted-foreground">
                    Team members in your organization can see shared projects, tasks, and collaboration data according to their permissions.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3.2 Service Providers</h3>
                  <p className="text-muted-foreground mb-2">
                    We work with trusted third parties who help us operate our Service:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>Cloud hosting providers</li>
                    <li>Payment processors</li>
                    <li>Email service providers</li>
                    <li>Analytics providers</li>
                    <li>AI service providers (e.g., OpenAI)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3.3 Legal Requirements</h3>
                  <p className="text-muted-foreground">
                    We may disclose information if required by law, court order, or government request, or to protect our rights and safety.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">3.4 Business Transfers</h3>
                  <p className="text-muted-foreground">
                    If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 4: Data Security */}
            <section id="security" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">4. Data Storage & Security</h2>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your data:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Encryption:</strong> Data is encrypted in transit (TLS/SSL) and at rest</li>
                  <li><strong>Access Controls:</strong> Strict role-based permissions and authentication</li>
                  <li><strong>Secure Infrastructure:</strong> Hosted on trusted cloud platforms with enterprise-grade security</li>
                  <li><strong>Regular Backups:</strong> Automated backups to prevent data loss</li>
                  <li><strong>Security Monitoring:</strong> Continuous monitoring for threats and vulnerabilities</li>
                  <li><strong>Employee Training:</strong> Staff trained on security best practices</li>
                </ul>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> While we take reasonable measures to protect your data, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 5: Your Rights */}
            <section id="rights" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">5. Your Privacy Rights</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                Depending on your location, you have the following rights:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal obligations)</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Objection:</strong> Object to processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of processing</li>
                <li><strong>Withdraw Consent:</strong> Opt out of marketing communications</li>
              </ul>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm">
                  To exercise your rights, contact us at <a href="mailto:privacy@wrkportal.com" className="text-blue-600 hover:underline">privacy@wrkportal.com</a>
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 6: Cookies */}
            <section id="cookies" className="mb-8 scroll-mt-4">
              <h2 className="text-2xl font-bold mb-4">6. Cookies & Tracking Technologies</h2>

              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Essential Cookies:</strong> Required for authentication and basic functionality</li>
                <li><strong>Performance Cookies:</strong> Help us understand how you use the Service</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>

              <p className="text-muted-foreground mt-4">
                You can control cookies through your browser settings. However, disabling cookies may affect functionality.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Section 7: Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>

              <p className="text-muted-foreground mb-4">
                We retain your information for as long as:
              </p>

              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Your account is active</li>
                <li>Needed to provide you services</li>
                <li>Required by law or for legitimate business purposes</li>
              </ul>

              <p className="text-muted-foreground mt-4">
                When you delete your account, we will delete or anonymize your personal data within 90 days, except where we must retain it for legal compliance.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Section 8: Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>

              <p className="text-muted-foreground">
                Our Service is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Section 9: International Transfers */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>

              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Section 10: Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Changes to This Privacy Policy</h2>

              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of material changes by email or through the Service. Your continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Contact Section */}
            <section id="contact" className="scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold">11. Contact Us</h2>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy or our privacy practices, please contact us:
                </p>

                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div className="space-y-2">
                    <p className="font-semibold">wrkportal.com Privacy Team</p>
                    <p className="text-muted-foreground">Email: <a href="mailto:privacy@wrkportal.com" className="text-blue-600 hover:underline">privacy@wrkportal.com</a></p>
                    <p className="text-muted-foreground">Website: <a href="https://www.wrkportal.com" className="text-blue-600 hover:underline">www.wrkportal.com</a></p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  For GDPR inquiries, you may also contact your local data protection authority.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

