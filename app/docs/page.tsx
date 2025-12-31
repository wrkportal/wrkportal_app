/**
 * Documentation Hub
 * Central location for all documentation
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Book,
  Code,
  Shield,
  Users,
  Rocket,
  FileText,
  Video,
  GraduationCap,
} from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
  const docCategories = [
    {
      title: 'User Guides',
      description: 'Learn how to use Reporting Studio',
      icon: Users,
      color: 'text-blue-500',
      docs: [
        {
          title: 'Reporting Studio Guide',
          description: 'Complete guide to using Reporting Studio',
          href: '/docs/user-guide/reporting-studio-guide',
        },
        {
          title: 'Quick Start Guide',
          description: 'Get started in 5 minutes',
          href: '/docs/quick-start/quick-start-guide',
        },
      ],
    },
    {
      title: 'API Documentation',
      description: 'Integrate with our API',
      icon: Code,
      color: 'text-green-500',
      docs: [
        {
          title: 'API Reference',
          description: 'Complete API documentation',
          href: '/docs/api/api-reference',
        },
      ],
    },
    {
      title: 'Admin Guide',
      description: 'Manage your platform',
      icon: Shield,
      color: 'text-purple-500',
      docs: [
        {
          title: 'Admin Guide',
          description: 'Administrative tasks and configuration',
          href: '/docs/admin/admin-guide',
        },
      ],
    },
    {
      title: 'Developer Guide',
      description: 'Extend and customize the platform',
      icon: Code,
      color: 'text-orange-500',
      docs: [
        {
          title: 'Developer Guide',
          description: 'Development setup and best practices',
          href: '/docs/developer/developer-guide',
        },
      ],
    },
  ]

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 mt-4 sm:mt-6 lg:mt-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Documentation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Everything you need to know about using and managing the Reporting Platform
        </p>
      </div>

      {/* Documentation Categories */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {docCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`h-6 w-6 ${category.color}`} />
                  <CardTitle>{category.title}</CardTitle>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.docs.map((doc) => (
                    <Link
                      key={doc.title}
                      href={doc.href}
                      className="block p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {doc.description}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Common resources and guides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/reporting-studio">
              <Button variant="outline" className="w-full justify-start">
                <Rocket className="h-4 w-4 mr-2" />
                Reporting Studio
              </Button>
            </Link>
            <Link href="/reporting-studio/schedules">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Schedules
              </Button>
            </Link>
            <Link href="/reporting-studio/templates/marketplace">
              <Button variant="outline" className="w-full justify-start">
                <Book className="h-4 w-4 mr-2" />
                Marketplace
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

