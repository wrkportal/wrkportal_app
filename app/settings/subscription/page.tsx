'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, XCircle, CreditCard, Calendar, AlertCircle } from 'lucide-react'
import { useAuthStore, fetchAuthenticatedUser } from '@/stores/authStore'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function SubscriptionPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [userSubscription, setUserSubscription] = useState<any>(null)

  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (user?.id) {
      fetchUserSubscription()
    }
  }, [user?.id])

  useEffect(() => {
    if (success && sessionId) {
      // Refresh user data to get updated subscription
      fetchAuthenticatedUser().then(() => {
        fetchUserSubscription()
      })
    }
  }, [success, sessionId])

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch(`/api/subscriptions/status`)
      if (response.ok) {
        const data = await response.json()
        setUserSubscription(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  const handleSubscribe = async (planId: string, billingPeriod: 'monthly' | 'yearly') => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingPeriod }),
      })

      const data = await response.json()

      if (data.error) {
        alert(data.error + (data.message ? ': ' + data.message : ''))
        setLoading(false)
        return
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to create checkout session')
        setLoading(false)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.error) {
        alert(data.error)
      } else {
        alert('Subscription canceled successfully')
        fetchUserSubscription()
        fetchAuthenticatedUser()
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentTier = (user as any)?.subscriptionTier || 'free'
  const subscriptionStatus = (user as any)?.subscriptionStatus || 'none'

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      monthlyPrice: 8,
      yearlyPrice: 76,
      description: 'Best for growing teams and small businesses',
      features: [
        'Up to 10 users',
        '100 projects',
        '20 GB storage',
        '100 automations/month',
        'Email support',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      monthlyPrice: 15,
      yearlyPrice: 144,
      description: 'For professional teams that need AI-powered insights',
      features: [
        'Up to 50 users',
        'Unlimited projects',
        '100 GB storage',
        '500 automations/month',
        'Priority support',
        'AI features',
      ],
      popular: true,
    },
    {
      id: 'business',
      name: 'Business',
      monthlyPrice: 25,
      yearlyPrice: 240,
      description: 'For businesses that need advanced features',
      features: [
        'Up to 200 users',
        'Unlimited projects',
        '500 GB storage',
        'Unlimited automations',
        '24/7 support',
        'Advanced AI features',
        'Custom integrations',
      ],
    },
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription plan and billing</p>
      </div>

      {/* Success/Cancel Messages */}
      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            Your subscription has been activated successfully. Welcome to {currentTier}!
          </AlertDescription>
        </Alert>
      )}

      {canceled && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <XCircle className="h-5 w-5 text-yellow-600" />
          <AlertTitle>Checkout Canceled</AlertTitle>
          <AlertDescription>
            No charges were made. You can try again anytime.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current subscription status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={currentTier === 'free' ? 'secondary' : 'default'} className="text-lg px-3 py-1">
                  {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
                </Badge>
                {subscriptionStatus && subscriptionStatus !== 'none' && (
                  <Badge variant={subscriptionStatus === 'active' ? 'default' : 'destructive'}>
                    {subscriptionStatus}
                  </Badge>
                )}
              </div>
              {(user as any)?.subscriptionEndDate && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Renews on {new Date((user as any).subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
            {subscriptionStatus === 'active' && currentTier !== 'free' && (
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Available Plans</h2>
        <p className="text-muted-foreground">Choose the plan that's right for you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentTier === plan.id
          const isUpgrade = ['free', 'starter', 'professional'].indexOf(currentTier) < ['free', 'starter', 'professional'].indexOf(plan.id)

          return (
            <Card key={plan.id} className={plan.popular ? 'border-primary border-2' : ''}>
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  ${plan.yearlyPrice}/user/year (save 20%)
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    Current Plan
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleSubscribe(plan.id, 'monthly')}
                      disabled={loading}
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Subscribe Monthly
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSubscribe(plan.id, 'yearly')}
                      disabled={loading}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Subscribe Yearly (Save 20%)'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Free Plan Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Free Plan</CardTitle>
          <CardDescription>Perfect for individuals and small teams getting started</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Up to 10 users</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">1 project</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">100 MB storage</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">10 automations/month</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Basic support</span>
            </li>
          </ul>
          {currentTier === 'free' ? (
            <Button disabled className="w-full" variant="outline">
              Current Plan
            </Button>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are currently on a paid plan. Canceling will switch you back to Free at the end of your billing period.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <SubscriptionPageInner />
    </Suspense>
  )
}
