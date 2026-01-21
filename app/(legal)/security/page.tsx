'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, Lock, Eye, Database, Server, Key, AlertTriangle, CheckCircle2, FileKey, UserCheck, Calendar } from "lucide-react"
import Link from "next/link"

export default function SecurityPage() {
  const lastUpdated = "January 1, 2026" // [CUSTOMIZE: Update this date]
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Security</h1>
          <p className="text-muted-foreground text-lg">
            How we protect your data and maintain security
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
                Security is fundamental to everything we do at wrkportal.com. We implement industry best practices and continuously monitor and improve our security posture to protect your data.
              </p>
            </section>

            <Separator className="my-8" />

            {/* Quick Navigation */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Security Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { title: "Data Encryption", href: "#encryption" },
                  { title: "Infrastructure Security", href: "#infrastructure" },
                  { title: "Access Controls", href: "#access" },
                  { title: "Application Security", href: "#application" },
                  { title: "Compliance & Certifications", href: "#compliance" },
                  { title: "Incident Response", href: "#incident" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm hover:underline"
                  >
                    → {item.title}
                  </a>
                ))}
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 1: Data Encryption */}
            <section id="encryption" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">1. Data Encryption</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">1.1 Encryption in Transit</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>TLS 1.3:</strong> All data transmitted between your browser and our servers is encrypted using industry-standard TLS 1.3 protocol</li>
                    <li><strong>HTTPS Only:</strong> We enforce HTTPS across all connections</li>
                    <li><strong>Strong Cipher Suites:</strong> We use only strong, modern cipher suites and disable weak encryption algorithms</li>
                    <li><strong>Certificate Pinning:</strong> HSTS (HTTP Strict Transport Security) is enabled to prevent downgrade attacks</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">1.2 Encryption at Rest</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Database Encryption:</strong> All database storage is encrypted using AES-256 encryption</li>
                    <li><strong>File Storage:</strong> Uploaded files are encrypted at rest in our secure storage systems</li>
                    <li><strong>Backup Encryption:</strong> All backups are encrypted using the same strong encryption standards</li>
                    <li><strong>Key Management:</strong> Encryption keys are managed securely and rotated regularly</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">1.3 Password Security</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Secure Hashing:</strong> Passwords are hashed using bcrypt with appropriate salt rounds</li>
                    <li><strong>Never Stored in Plain Text:</strong> We never store or log passwords in plain text</li>
                    <li><strong>Password Requirements:</strong> Minimum password strength requirements are enforced</li>
                    <li><strong>Two-Factor Authentication:</strong> Optional 2FA support for enhanced account security</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 2: Infrastructure Security */}
            <section id="infrastructure" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">2. Infrastructure Security</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">2.1 Cloud Infrastructure</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Trusted Providers:</strong> Hosted on enterprise-grade cloud infrastructure (Vercel, AWS/GCP)</li>
                    <li><strong>Geographic Redundancy:</strong> Data is replicated across multiple availability zones</li>
                    <li><strong>DDoS Protection:</strong> Built-in DDoS mitigation and protection</li>
                    <li><strong>Network Isolation:</strong> Services are deployed in isolated network environments</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2.2 System Monitoring</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>24/7 Monitoring:</strong> Continuous monitoring of system health and security</li>
                    <li><strong>Automated Alerts:</strong> Real-time alerts for security events and anomalies</li>
                    <li><strong>Log Analysis:</strong> Comprehensive logging and analysis of system activities</li>
                    <li><strong>Intrusion Detection:</strong> Automated intrusion detection systems (IDS)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">2.3 Regular Updates</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Security Patches:</strong> Regular application of security patches and updates</li>
                    <li><strong>Dependency Management:</strong> Continuous monitoring and updating of dependencies</li>
                    <li><strong>Vulnerability Scanning:</strong> Regular automated vulnerability scans</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 3: Access Controls */}
            <section id="access" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Key className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">3. Access Controls</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">3.1 Authentication</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Multi-Factor Authentication:</strong> Support for 2FA/MFA</li>
                    <li><strong>SSO Support:</strong> Integration with enterprise SSO providers (SAML, OAuth)</li>
                    <li><strong>Session Management:</strong> Secure session handling with automatic timeout</li>
                    <li><strong>Account Lockout:</strong> Automatic lockout after failed login attempts</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3.2 Authorization</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Role-Based Access Control (RBAC):</strong> Granular permissions based on user roles</li>
                    <li><strong>Principle of Least Privilege:</strong> Users have minimum necessary permissions</li>
                    <li><strong>Multi-Tenancy:</strong> Complete data isolation between organizations</li>
                    <li><strong>Audit Trails:</strong> All access and actions are logged</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">3.3 Internal Access</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Limited Access:</strong> Strict internal access controls to production systems</li>
                    <li><strong>Need-to-Know Basis:</strong> Employees only access data when necessary for support</li>
                    <li><strong>Access Logging:</strong> All internal access is logged and monitored</li>
                    <li><strong>Background Checks:</strong> Team members undergo background verification</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 4: Application Security */}
            <section id="application" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">4. Application Security</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">4.1 Secure Development</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Secure Coding Practices:</strong> OWASP Top 10 and secure coding standards</li>
                    <li><strong>Code Reviews:</strong> All code is reviewed before deployment</li>
                    <li><strong>Static Analysis:</strong> Automated security analysis of code</li>
                    <li><strong>Dependency Scanning:</strong> Regular scanning for vulnerable dependencies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">4.2 Protection Against Common Attacks</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>SQL Injection:</strong> Parameterized queries and ORM usage</li>
                    <li><strong>XSS (Cross-Site Scripting):</strong> Input sanitization and output encoding</li>
                    <li><strong>CSRF (Cross-Site Request Forgery):</strong> CSRF tokens for all state-changing operations</li>
                    <li><strong>Clickjacking:</strong> X-Frame-Options and CSP headers</li>
                    <li><strong>Rate Limiting:</strong> Protection against brute force and DDoS attacks</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">4.3 API Security</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Authentication Required:</strong> All API endpoints require authentication</li>
                    <li><strong>Rate Limiting:</strong> API rate limits to prevent abuse</li>
                    <li><strong>Input Validation:</strong> Strict validation of all API inputs</li>
                    <li><strong>Secure Tokens:</strong> JWT tokens with appropriate expiration</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 5: Data Management */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">5. Data Management & Privacy</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">5.1 Data Isolation</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Multi-Tenant Architecture:</strong> Complete logical separation between organizations</li>
                    <li><strong>Database-Level Isolation:</strong> Tenant-specific data access controls</li>
                    <li><strong>No Cross-Tenant Access:</strong> Users can only access their organization's data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">5.2 Data Backup</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Automated Backups:</strong> Daily automated backups of all data</li>
                    <li><strong>Encrypted Backups:</strong> All backups are encrypted</li>
                    <li><strong>Retention Policy:</strong> Backups retained for 30 days minimum</li>
                    <li><strong>Disaster Recovery:</strong> Documented disaster recovery procedures</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">5.3 Data Deletion</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Secure Deletion:</strong> Secure deletion procedures for account termination</li>
                    <li><strong>Retention Period:</strong> Data retained for 90 days after account deletion</li>
                    <li><strong>Right to Deletion:</strong> Users can request immediate data deletion</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 6: Compliance */}
            <section id="compliance" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <FileKey className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">6. Compliance & Certifications</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">6.1 Regulatory Compliance</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>GDPR:</strong> Compliant with EU General Data Protection Regulation</li>
                    <li><strong>CCPA:</strong> Compliant with California Consumer Privacy Act</li>
                    <li><strong>Data Privacy:</strong> Adherence to international data privacy standards</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">6.2 Industry Standards</h3>
                  <p className="text-muted-foreground mb-3">
                    We follow industry best practices and standards, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>OWASP (Open Web Application Security Project) guidelines</li>
                    <li>CIS (Center for Internet Security) benchmarks</li>
                    <li>NIST (National Institute of Standards and Technology) frameworks</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">
                    <strong>Note:</strong> We are committed to achieving SOC 2 Type II and ISO 27001 certifications. Current compliance status and certifications can be verified upon request.
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 7: Incident Response */}
            <section id="incident" className="mb-8 scroll-mt-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">7. Incident Response</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">7.1 Security Incident Management</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>24/7 Monitoring:</strong> Continuous security monitoring and alerting</li>
                    <li><strong>Incident Response Plan:</strong> Documented procedures for security incidents</li>
                    <li><strong>Rapid Response Team:</strong> Dedicated team for security incidents</li>
                    <li><strong>Post-Incident Analysis:</strong> Thorough analysis and remediation after incidents</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">7.2 Breach Notification</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li><strong>Timely Notification:</strong> Users will be notified promptly of any data breaches</li>
                    <li><strong>Regulatory Compliance:</strong> Notifications comply with applicable laws (GDPR, CCPA, etc.)</li>
                    <li><strong>Transparency:</strong> Clear communication about the nature and impact of incidents</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">7.3 Continuous Improvement</h3>
                  <p className="text-muted-foreground">
                    We continuously review and improve our security practices based on:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-2">
                    <li>Lessons learned from incidents</li>
                    <li>Emerging threats and vulnerabilities</li>
                    <li>Industry best practices</li>
                    <li>Customer feedback</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 8: Third-Party Security */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">8. Third-Party Security</h2>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We carefully vet all third-party service providers and ensure they meet our security standards:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Due Diligence:</strong> Security assessment of all vendors</li>
                  <li><strong>Compliance Verification:</strong> Vendors must meet relevant compliance standards</li>
                  <li><strong>Data Processing Agreements:</strong> Formal agreements with all data processors</li>
                  <li><strong>Regular Reviews:</strong> Periodic review of vendor security practices</li>
                  <li><strong>Limited Access:</strong> Third parties have minimum necessary access</li>
                </ul>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border mt-4">
                  <h4 className="font-semibold mb-2">Key Third-Party Services:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                    <li>Hosting: Vercel (enterprise-grade infrastructure)</li>
                    <li>Database: Neon/Supabase (encrypted PostgreSQL)</li>
                    <li>Authentication: NextAuth (industry-standard auth)</li>
                    <li>AI Services: OpenAI (with data retention controls)</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Section 9: Employee Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Employee Security Training</h2>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Our team is our first line of defense:
                </p>

                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Security Training:</strong> Regular security awareness training for all employees</li>
                  <li><strong>Secure Development Training:</strong> Specialized training for development team</li>
                  <li><strong>Access Reviews:</strong> Periodic review of employee access rights</li>
                  <li><strong>Confidentiality Agreements:</strong> All employees sign NDAs</li>
                  <li><strong>Offboarding Process:</strong> Immediate revocation of access upon termination</li>
                </ul>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Best Practices for Users */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">10. Security Best Practices for Users</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                You play an important role in keeping your account secure:
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Do This
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Use strong, unique passwords</li>
                    <li>✓ Enable two-factor authentication</li>
                    <li>✓ Keep your software updated</li>
                    <li>✓ Review access logs regularly</li>
                    <li>✓ Report suspicious activity</li>
                    <li>✓ Use secure networks</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Avoid This
                  </h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✗ Share your password</li>
                    <li>✗ Use public Wi-Fi without VPN</li>
                    <li>✗ Click suspicious links</li>
                    <li>✗ Ignore security warnings</li>
                    <li>✗ Use same password everywhere</li>
                    <li>✗ Leave accounts logged in</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Responsible Disclosure */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Responsible Disclosure</h2>

              <p className="text-muted-foreground mb-4">
                We welcome reports from security researchers:
              </p>

              <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <h3 className="font-semibold mb-3">Report a Security Vulnerability</h3>
                <p className="text-muted-foreground mb-4">
                  If you discover a security vulnerability, please report it responsibly:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                  <li>Email us at: <a href="mailto:security@wrkportal.com" className="text-green-600 hover:underline font-semibold">security@wrkportal.com</a></li>
                  <li>Provide detailed information about the vulnerability</li>
                  <li>Give us reasonable time to address the issue</li>
                  <li>Do not exploit the vulnerability beyond verification</li>
                </ul>
                <p className="text-sm text-muted-foreground italic">
                  We commit to acknowledging reports within 48 hours and keeping you informed of our progress.
                </p>
              </div>
            </section>

            <Separator className="my-8" />

            {/* Contact Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold">12. Security Questions?</h2>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you have questions about our security practices or need to report a security concern:
                </p>

                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                  <div className="space-y-2">
                    <p className="font-semibold">wrkportal.com Security Team</p>
                    <p className="text-muted-foreground">Security Issues: <a href="mailto:security@wrkportal.com" className="text-green-600 hover:underline">security@wrkportal.com</a></p>
                    <p className="text-muted-foreground">General Inquiries: <a href="mailto:support@wrkportal.com" className="text-green-600 hover:underline">support@wrkportal.com</a></p>
                    <p className="text-muted-foreground">Website: <a href="https://www.wrkportal.com" className="text-green-600 hover:underline">www.wrkportal.com</a></p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm">
                    <strong>Security Documentation:</strong> For detailed security documentation, compliance certificates, or to discuss enterprise security requirements, please contact our security team.
                  </p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/" className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

