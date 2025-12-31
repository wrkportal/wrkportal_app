/**
 * Beta Testing Program Page
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Bug, Lightbulb, MessageSquare, Star } from 'lucide-react'
import Link from 'next/link'
import { FeedbackButton } from '@/components/feedback/feedback-button'
import { getBetaFeatures } from '@/lib/feature-flags/feature-flags'

export default function BetaPage() {
  const betaFeatures = getBetaFeatures()

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-purple-500">Beta Program</Badge>
        <h1 className="text-4xl font-bold mb-4">Join Our Beta Testing Program</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Help shape the future of Reporting Studio by testing new features and providing feedback
        </p>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle>Early Access</CardTitle>
            <CardDescription>
              Get access to new features before everyone else
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Star className="h-8 w-8 text-yellow-500 mb-2" />
            <CardTitle>Influence Development</CardTitle>
            <CardDescription>
              Your feedback directly influences product development
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle>Direct Support</CardTitle>
            <CardDescription>
              Priority support from our development team
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Beta Features */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Beta Features Available</CardTitle>
          <CardDescription>
            Features currently in beta testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {betaFeatures.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{feature.key}</h3>
                    <Badge variant="outline" className="bg-purple-50">
                      Beta
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {feature.description}
                  </p>
                </div>
                <Badge
                  variant={feature.enabled ? 'default' : 'secondary'}
                >
                  {feature.enabled ? 'Active' : 'Coming Soon'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to Participate */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>How to Participate</CardTitle>
          <CardDescription>
            Simple steps to get involved
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Explore Beta Features</h3>
                <p className="text-sm text-muted-foreground">
                  Try out beta features and see what's new
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Report Issues</h3>
                <p className="text-sm text-muted-foreground">
                  Found a bug? Report it using the feedback button
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Share Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Share your thoughts, ideas, and suggestions
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Stay Updated</h3>
                <p className="text-sm text-muted-foreground">
                  Get notified when beta features are updated
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Types */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Bug className="h-6 w-6 text-red-500 mb-2" />
            <CardTitle>Report Bugs</CardTitle>
            <CardDescription>
              Help us identify and fix issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Describe what happened</li>
              <li>• Include steps to reproduce</li>
              <li>• Add screenshots if possible</li>
              <li>• Specify which feature</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Lightbulb className="h-6 w-6 text-yellow-500 mb-2" />
            <CardTitle>Suggest Features</CardTitle>
            <CardDescription>
              Share your ideas for improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Describe the feature</li>
              <li>• Explain the use case</li>
              <li>• Share examples</li>
              <li>• Prioritize importance</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">
              Ready to Help Shape the Future?
            </h2>
            <p className="text-muted-foreground mb-6">
              Start by submitting your first piece of feedback
            </p>
            <div className="flex justify-center gap-4">
              <FeedbackButton />
              <Link href="/reporting-studio">
                <Button variant="outline">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


