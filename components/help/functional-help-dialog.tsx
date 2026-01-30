/**
 * Functional Help Dialog Component
 * Provides contextual help, FAQs, and workflow guidance for functional pages
 */

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HelpCircle, Search, Book, Workflow, ChevronRight, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type FunctionalArea = 
  | 'operations' 
  | 'sales' 
  | 'it' 
  | 'recruitment' 
  | 'finance' 
  | 'product-management'
  | 'developer'
  | 'customer-service'

interface FAQ {
  question: string
  answer: string
}

interface WorkflowStep {
  step: number
  title: string
  description: string
  details?: string[]
}

interface FunctionalHelpContent {
  area: FunctionalArea
  title: string
  description: string
  faqs: FAQ[]
  workflow: {
    title: string
    description: string
    steps: WorkflowStep[]
  }
}

const helpContent: Record<FunctionalArea, FunctionalHelpContent> = {
  operations: {
    area: 'operations',
    title: 'Operations Dashboard Help',
    description: 'Learn how to manage work orders, resources, inventory, and compliance',
    faqs: [
      {
        question: 'How do I create a work order?',
        answer: 'Navigate to the Work Orders tab and click "Create Work Order". Fill in the required details including title, description, priority, assigned resources, and due date. You can also attach files and set up notifications.',
      },
      {
        question: 'How do I track resource utilization?',
        answer: 'Go to the Resources tab to view all resources. You can see their current assignments, availability, and utilization metrics. Use filters to find specific resources or view by department.',
      },
      {
        question: 'How do I manage inventory?',
        answer: 'The Inventory tab allows you to track stock levels, view inventory history, set reorder points, and manage suppliers. You can create inventory items, update quantities, and view reports.',
      },
      {
        question: 'What is the Performance tab for?',
        answer: 'The Performance tab shows key metrics and KPIs for your operations including completion rates, resource efficiency, and compliance scores. Use it to identify areas for improvement.',
      },
      {
        question: 'How do I ensure compliance?',
        answer: 'The Compliance tab helps you track regulatory requirements, certifications, and audits. You can set up compliance checklists, schedule audits, and track certification renewals.',
      },
    ],
    workflow: {
      title: 'Operations Workflow Lifecycle',
      description: 'Complete guide to managing operations from start to finish',
      steps: [
        {
          step: 1,
          title: 'Plan & Create Work Orders',
          description: 'Start by creating work orders for tasks that need to be completed. Define the scope, priority, and requirements.',
          details: [
            'Navigate to Work Orders tab',
            'Click "Create Work Order"',
            'Fill in title, description, and priority',
            'Set due date and estimated duration',
            'Assign to appropriate resources',
          ],
        },
        {
          step: 2,
          title: 'Allocate Resources',
          description: 'Assign team members, equipment, and materials to work orders based on availability and skills.',
          details: [
            'Go to Resources tab',
            'Check resource availability',
            'Assign team members to work orders',
            'Allocate required equipment',
            'Reserve materials from inventory',
          ],
        },
        {
          step: 3,
          title: 'Manage Inventory',
          description: 'Ensure all required materials and supplies are available. Track stock levels and reorder when needed.',
          details: [
            'Check inventory levels in Inventory tab',
            'Reserve materials for work orders',
            'Set up reorder points',
            'Manage supplier relationships',
            'Track inventory movements',
          ],
        },
        {
          step: 4,
          title: 'Execute & Monitor',
          description: 'Track progress of work orders in real-time. Update status, log time, and document issues.',
          details: [
            'Monitor work order status',
            'Update progress regularly',
            'Log time and expenses',
            'Document issues and blockers',
            'Communicate with team members',
          ],
        },
        {
          step: 5,
          title: 'Review Performance',
          description: 'Analyze performance metrics, identify bottlenecks, and optimize processes.',
          details: [
            'View Performance dashboard',
            'Analyze completion rates',
            'Review resource utilization',
            'Identify improvement opportunities',
            'Adjust processes based on insights',
          ],
        },
        {
          step: 6,
          title: 'Ensure Compliance',
          description: 'Maintain compliance with regulations, complete audits, and renew certifications.',
          details: [
            'Track compliance requirements',
            'Complete scheduled audits',
            'Renew certifications',
            'Document compliance activities',
            'Generate compliance reports',
          ],
        },
      ],
    },
  },
  sales: {
    area: 'sales',
    title: 'Sales Dashboard Help',
    description: 'Learn how to manage leads, opportunities, quotes, orders, and sales analytics',
    faqs: [
      {
        question: 'How do I create a new lead?',
        answer: 'Go to the Leads tab and click "Create Lead". Enter contact information, company details, source, and any notes. You can also import leads from CSV files.',
      },
      {
        question: 'How do I convert a lead to an opportunity?',
        answer: 'Open the lead detail page and click "Convert to Opportunity". This will create a new opportunity with the lead information pre-filled. You can then add products, set probability, and track the sales process.',
      },
      {
        question: 'How do I create a quote?',
        answer: 'Navigate to the Quotes tab and click "Create Quote". Select the opportunity, add products with quantities and prices, apply discounts if needed, and generate the quote. You can send it directly to the customer.',
      },
      {
        question: 'What is the Forecast tab for?',
        answer: 'The Forecast tab shows predicted sales based on your pipeline. It helps you plan for future revenue and identify which opportunities are likely to close.',
      },
      {
        question: 'How do I track sales performance?',
        answer: 'Use the Analytics tab to view sales metrics, conversion rates, pipeline value, and performance by rep or product. The dashboard provides real-time insights into your sales performance.',
      },
    ],
    workflow: {
      title: 'Sales Workflow Lifecycle',
      description: 'Complete guide to managing the sales process from lead to order',
      steps: [
        {
          step: 1,
          title: 'Capture & Qualify Leads',
          description: 'Capture leads from various sources and qualify them based on your criteria.',
          details: [
            'Create leads from website, referrals, or imports',
            'Enter contact and company information',
            'Qualify leads based on BANT criteria',
            'Assign leads to sales reps',
            'Set follow-up reminders',
          ],
        },
        {
          step: 2,
          title: 'Convert to Opportunity',
          description: 'Convert qualified leads into opportunities and begin the sales process.',
          details: [
            'Convert lead to opportunity',
            'Set opportunity value and probability',
            'Define sales stage',
            'Add products or services',
            'Set expected close date',
          ],
        },
        {
          step: 3,
          title: 'Engage & Nurture',
          description: 'Build relationships with prospects through meetings, calls, and follow-ups.',
          details: [
            'Schedule meetings and calls',
            'Send proposals and presentations',
            'Track all interactions',
            'Address objections',
            'Build trust and rapport',
          ],
        },
        {
          step: 4,
          title: 'Create & Send Quotes',
          description: 'Generate professional quotes with pricing and terms for your prospects.',
          details: [
            'Create quote from opportunity',
            'Add products with pricing',
            'Apply discounts or promotions',
            'Review and approve quote',
            'Send to customer via email',
          ],
        },
        {
          step: 5,
          title: 'Negotiate & Close',
          description: 'Negotiate terms, handle objections, and close the deal.',
          details: [
            'Review customer feedback',
            'Negotiate pricing and terms',
            'Update quote if needed',
            'Get approval and signatures',
            'Convert quote to order',
          ],
        },
        {
          step: 6,
          title: 'Process Orders & Invoices',
          description: 'Create orders, generate invoices, and track payments.',
          details: [
            'Convert quote to order',
            'Process order fulfillment',
            'Generate invoice',
            'Track payment status',
            'Update opportunity status to "Won"',
          ],
        },
        {
          step: 7,
          title: 'Analyze & Forecast',
          description: 'Review sales performance, update forecasts, and identify trends.',
          details: [
            'View sales analytics dashboard',
            'Review conversion rates',
            'Update sales forecast',
            'Identify trends and patterns',
            'Plan for next period',
          ],
        },
      ],
    },
  },
  it: {
    area: 'it',
    title: 'IT Dashboard Help',
    description: 'Learn how to manage IT assets, tickets, projects, and infrastructure',
    faqs: [
      {
        question: 'How do I create a support ticket?',
        answer: 'Go to the Tickets tab and click "Create Ticket". Select the category, priority, assign it to a technician, and provide details about the issue. You can attach screenshots or files.',
      },
      {
        question: 'How do I manage IT assets?',
        answer: 'Navigate to the Assets tab to view all IT assets. You can add new assets, track their location, assign them to users, and monitor their lifecycle including warranties and maintenance.',
      },
      {
        question: 'What is the Projects tab for?',
        answer: 'The Projects tab helps you manage IT projects like system upgrades, migrations, or new implementations. Track project progress, assign resources, and manage timelines.',
      },
      {
        question: 'How do I track infrastructure health?',
        answer: 'Use the Infrastructure tab to monitor servers, networks, and systems. View uptime, performance metrics, and alerts. Set up monitoring and receive notifications for issues.',
      },
      {
        question: 'How do I manage user access?',
        answer: 'Go to the Access Management section to manage user accounts, permissions, and access rights. You can provision accounts, assign roles, and revoke access when needed.',
      },
    ],
    workflow: {
      title: 'IT Workflow Lifecycle',
      description: 'Complete guide to managing IT operations and support',
      steps: [
        {
          step: 1,
          title: 'Receive & Triage Tickets',
          description: 'Receive support requests and prioritize them based on urgency and impact.',
          details: [
            'Receive ticket via email, portal, or phone',
            'Categorize ticket (hardware, software, network)',
            'Set priority level',
            'Assign to appropriate technician',
            'Acknowledge ticket to user',
          ],
        },
        {
          step: 2,
          title: 'Investigate & Diagnose',
          description: 'Analyze the issue, gather information, and identify the root cause.',
          details: [
            'Review ticket details and history',
            'Gather additional information from user',
            'Check system logs and monitoring',
            'Reproduce issue if possible',
            'Identify root cause',
          ],
        },
        {
          step: 3,
          title: 'Resolve & Document',
          description: 'Fix the issue, test the solution, and document the resolution.',
          details: [
            'Implement solution',
            'Test to ensure issue is resolved',
            'Update ticket with resolution details',
            'Document solution in knowledge base',
            'Notify user of resolution',
          ],
        },
        {
          step: 4,
          title: 'Manage Assets',
          description: 'Track and maintain IT assets throughout their lifecycle.',
          details: [
            'Register new assets',
            'Assign assets to users',
            'Track asset location and status',
            'Schedule maintenance',
            'Manage warranties and renewals',
          ],
        },
        {
          step: 5,
          title: 'Plan & Execute Projects',
          description: 'Manage IT projects from planning to completion.',
          details: [
            'Create project plan',
            'Assign resources and set timeline',
            'Track project milestones',
            'Manage risks and issues',
            'Complete project and document lessons',
          ],
        },
        {
          step: 6,
          title: 'Monitor & Maintain',
          description: 'Continuously monitor infrastructure and maintain systems.',
          details: [
            'Monitor system health and performance',
            'Review alerts and notifications',
            'Perform routine maintenance',
            'Update systems and patches',
            'Optimize performance',
          ],
        },
      ],
    },
  },
  recruitment: {
    area: 'recruitment',
    title: 'Recruitment Dashboard Help',
    description: 'Learn how to manage job postings, candidates, interviews, and hiring',
    faqs: [
      {
        question: 'How do I create a job posting?',
        answer: 'Go to the Jobs tab and click "Create Job Posting". Enter job title, description, requirements, location, and salary range. You can publish it to job boards or keep it internal.',
      },
      {
        question: 'How do I add a candidate?',
        answer: 'Navigate to the Candidates tab and click "Add Candidate". Enter their information, upload resume, and link them to a job posting. You can also import candidates from ATS or CSV.',
      },
      {
        question: 'How do I schedule an interview?',
        answer: 'Open the candidate detail page and click "Schedule Interview". Select date, time, interviewers, and type (phone, video, or in-person). Send calendar invites automatically.',
      },
      {
        question: 'What is the Pipeline tab for?',
        answer: 'The Pipeline tab shows candidates at each stage of the hiring process. You can drag and drop candidates between stages and track their progress.',
      },
      {
        question: 'How do I make a hiring decision?',
        answer: 'Review all interview feedback, assessments, and candidate information. Update the candidate status to "Offer" or "Rejected" and add notes. For offers, you can generate offer letters.',
      },
    ],
    workflow: {
      title: 'Recruitment Workflow Lifecycle',
      description: 'Complete guide to the hiring process from job posting to onboarding',
      steps: [
        {
          step: 1,
          title: 'Create Job Posting',
          description: 'Define the role, requirements, and publish the job opening.',
          details: [
            'Create job posting with title and description',
            'Define required skills and qualifications',
            'Set salary range and location',
            'Publish to job boards',
            'Share on social media and company website',
          ],
        },
        {
          step: 2,
          title: 'Source & Collect Candidates',
          description: 'Attract and collect candidate applications from various sources.',
          details: [
            'Receive applications from job boards',
            'Import candidates from ATS',
            'Collect referrals from employees',
            'Source from LinkedIn and other platforms',
            'Organize candidates in pipeline',
          ],
        },
        {
          step: 3,
          title: 'Screen & Shortlist',
          description: 'Review resumes, assess qualifications, and shortlist candidates.',
          details: [
            'Review candidate resumes',
            'Assess qualifications against requirements',
            'Conduct initial phone screens',
            'Shortlist candidates for interviews',
            'Update candidate status',
          ],
        },
        {
          step: 4,
          title: 'Conduct Interviews',
          description: 'Schedule and conduct interviews with shortlisted candidates.',
          details: [
            'Schedule interviews with candidates',
            'Invite interviewers and send calendar invites',
            'Conduct phone, video, or in-person interviews',
            'Collect feedback from interviewers',
            'Update candidate status and notes',
          ],
        },
        {
          step: 5,
          title: 'Assess & Evaluate',
          description: 'Review all candidate information and make evaluation.',
          details: [
            'Review interview feedback',
            'Check references if needed',
            'Conduct background checks',
            'Evaluate cultural fit',
            'Make hiring decision',
          ],
        },
        {
          step: 6,
          title: 'Make Offer & Onboard',
          description: 'Extend offer, negotiate terms, and onboard new hire.',
          details: [
            'Generate and send offer letter',
            'Negotiate salary and terms',
            'Collect acceptance and signed documents',
            'Schedule onboarding',
            'Update candidate status to "Hired"',
          ],
        },
      ],
    },
  },
  finance: {
    area: 'finance',
    title: 'Finance Dashboard Help',
    description: 'Learn how to manage revenue, expenses, profitability, and financial reporting',
    faqs: [
      {
        question: 'How do I record revenue?',
        answer: 'Go to the Revenue tab and click "Record Revenue". Enter the amount, date, source, and link it to an invoice or project. You can also import revenue data from accounting systems.',
      },
      {
        question: 'How do I track expenses?',
        answer: 'Navigate to the Expenses tab to view and record expenses. You can create expense entries, categorize them, attach receipts, and approve expenses based on your workflow.',
      },
      {
        question: 'What is the Profitability tab for?',
        answer: 'The Profitability tab shows profit margins, cost analysis, and profitability by project, department, or product. Use it to identify profitable areas and optimize costs.',
      },
      {
        question: 'How do I manage rate cards?',
        answer: 'Go to the Rate Cards tab to create and manage billing rates for different roles, projects, or clients. You can set hourly rates, daily rates, or fixed project rates.',
      },
      {
        question: 'How do I generate financial reports?',
        answer: 'Use the Reports section to generate P&L statements, balance sheets, cash flow reports, and custom reports. You can export reports in various formats.',
      },
    ],
    workflow: {
      title: 'Finance Workflow Lifecycle',
      description: 'Complete guide to managing financial operations',
      steps: [
        {
          step: 1,
          title: 'Set Up Rate Cards',
          description: 'Define billing rates for different roles and services.',
          details: [
            'Create rate cards for different roles',
            'Set hourly, daily, or project rates',
            'Define rate tiers by experience level',
            'Link rates to projects or clients',
            'Review and approve rate cards',
          ],
        },
        {
          step: 2,
          title: 'Record Revenue',
          description: 'Track all incoming revenue from various sources.',
          details: [
            'Record revenue from invoices',
            'Link revenue to projects or clients',
            'Categorize revenue by type',
            'Track payment status',
            'Reconcile with bank statements',
          ],
        },
        {
          step: 3,
          title: 'Track Expenses',
          description: 'Monitor and categorize all business expenses.',
          details: [
            'Record expenses as they occur',
            'Categorize expenses by type',
            'Attach receipts and documentation',
            'Submit for approval if required',
            'Track expense approvals',
          ],
        },
        {
          step: 4,
          title: 'Manage Vendors',
          description: 'Maintain vendor relationships and process payments.',
          details: [
            'Add and manage vendor information',
            'Track vendor invoices',
            'Process vendor payments',
            'Manage vendor contracts',
            'Review vendor performance',
          ],
        },
        {
          step: 5,
          title: 'Analyze Profitability',
          description: 'Calculate and analyze profit margins and costs.',
          details: [
            'View profitability by project',
            'Analyze cost breakdowns',
            'Identify profit drivers',
            'Compare actual vs. budgeted',
            'Optimize pricing and costs',
          ],
        },
        {
          step: 6,
          title: 'Generate Reports',
          description: 'Create financial reports and share insights.',
          details: [
            'Generate P&L statements',
            'Create cash flow reports',
            'Build custom financial reports',
            'Share reports with stakeholders',
            'Use insights for decision-making',
          ],
        },
      ],
    },
  },
  'product-management': {
    area: 'product-management',
    title: 'Product Management Help',
    description: 'Learn how to manage products, roadmaps, features, and releases',
    faqs: [
      {
        question: 'How do I create a product?',
        answer: 'Go to the Products tab and click "Create Product". Enter product name, description, category, and key details. You can add product images, specifications, and pricing information.',
      },
      {
        question: 'How do I manage the product roadmap?',
        answer: 'Navigate to the Roadmap tab to view and manage your product roadmap. You can create roadmap items, set priorities, assign timelines, and track progress.',
      },
      {
        question: 'What is the Features tab for?',
        answer: 'The Features tab helps you manage product features from ideation to release. You can create feature requests, prioritize them, assign to sprints, and track implementation.',
      },
      {
        question: 'How do I plan a release?',
        answer: 'Go to the Releases tab and click "Create Release". Define the release name, version, target date, and select features to include. You can track release progress and communicate updates.',
      },
      {
        question: 'How do I gather customer feedback?',
        answer: 'Use the Feedback section to collect and organize customer feedback. You can link feedback to features, prioritize based on customer needs, and track implementation status.',
      },
    ],
    workflow: {
      title: 'Product Management Workflow Lifecycle',
      description: 'Complete guide to managing products from ideation to launch',
      steps: [
        {
          step: 1,
          title: 'Define Product Vision',
          description: 'Establish the product vision, goals, and strategy.',
          details: [
            'Define product vision and goals',
            'Identify target market and users',
            'Conduct market research',
            'Create product strategy',
            'Set success metrics',
          ],
        },
        {
          step: 2,
          title: 'Gather & Prioritize Requirements',
          description: 'Collect requirements from stakeholders and prioritize features.',
          details: [
            'Gather requirements from stakeholders',
            'Collect customer feedback',
            'Analyze market needs',
            'Prioritize features using frameworks',
            'Create feature backlog',
          ],
        },
        {
          step: 3,
          title: 'Plan Roadmap & Releases',
          description: 'Create product roadmap and plan releases.',
          details: [
            'Create product roadmap',
            'Plan release timelines',
            'Group features into releases',
            'Set release goals and milestones',
            'Communicate roadmap to stakeholders',
          ],
        },
        {
          step: 4,
          title: 'Design & Develop',
          description: 'Work with design and engineering teams to build features.',
          details: [
            'Create detailed feature specifications',
            'Work with design team on UX/UI',
            'Collaborate with engineering on implementation',
            'Track development progress',
            'Conduct design and code reviews',
          ],
        },
        {
          step: 5,
          title: 'Test & Validate',
          description: 'Test features and validate with users before release.',
          details: [
            'Conduct QA testing',
            'Perform user acceptance testing',
            'Gather beta user feedback',
            'Validate feature meets requirements',
            'Fix bugs and issues',
          ],
        },
        {
          step: 6,
          title: 'Launch & Monitor',
          description: 'Release features to users and monitor performance.',
          details: [
            'Plan launch strategy',
            'Communicate release to users',
            'Monitor feature adoption',
            'Track key metrics',
            'Gather post-launch feedback',
          ],
        },
        {
          step: 7,
          title: 'Iterate & Improve',
          description: 'Continuously improve products based on feedback and data.',
          details: [
            'Analyze feature performance',
            'Collect user feedback',
            'Identify improvement opportunities',
            'Plan next iteration',
            'Update roadmap based on learnings',
          ],
        },
      ],
    },
  },
  developer: {
    area: 'developer',
    title: 'Developer Dashboard Help',
    description: 'Learn how to manage code, deployments, APIs, and development workflows',
    faqs: [
      {
        question: 'How do I track code commits?',
        answer: 'The Code tab shows recent commits, pull requests, and code changes. You can view commit history, code reviews, and branch activity from your connected repositories.',
      },
      {
        question: 'How do I manage deployments?',
        answer: 'Go to the Deployments tab to view deployment history, status, and logs. You can trigger deployments, rollback if needed, and monitor deployment health.',
      },
      {
        question: 'What is the APIs tab for?',
        answer: 'The APIs tab helps you manage API endpoints, documentation, and monitoring. You can view API usage, test endpoints, and track performance metrics.',
      },
      {
        question: 'How do I monitor system health?',
        answer: 'Use the Monitoring tab to view system metrics, logs, and alerts. You can set up alerts for errors, performance issues, and system downtime.',
      },
      {
        question: 'How do I manage environments?',
        answer: 'Navigate to the Environments section to manage dev, staging, and production environments. You can view environment status, configurations, and access controls.',
      },
    ],
    workflow: {
      title: 'Developer Workflow Lifecycle',
      description: 'Complete guide to the software development lifecycle',
      steps: [
        {
          step: 1,
          title: 'Plan & Design',
          description: 'Plan features, design architecture, and create specifications.',
          details: [
            'Review requirements and user stories',
            'Design system architecture',
            'Create technical specifications',
            'Plan implementation approach',
            'Estimate effort and timeline',
          ],
        },
        {
          step: 2,
          title: 'Develop & Code',
          description: 'Write code, follow best practices, and conduct code reviews.',
          details: [
            'Create feature branch',
            'Write code following standards',
            'Write unit tests',
            'Submit pull request',
            'Address code review feedback',
          ],
        },
        {
          step: 3,
          title: 'Test & QA',
          description: 'Test code changes and ensure quality.',
          details: [
            'Run automated tests',
            'Perform manual testing',
            'Fix bugs and issues',
            'Update test coverage',
            'Get QA approval',
          ],
        },
        {
          step: 4,
          title: 'Deploy to Staging',
          description: 'Deploy changes to staging environment for validation.',
          details: [
            'Merge code to staging branch',
            'Trigger staging deployment',
            'Verify deployment success',
            'Test in staging environment',
            'Validate functionality',
          ],
        },
        {
          step: 5,
          title: 'Deploy to Production',
          description: 'Deploy approved changes to production.',
          details: [
            'Get approval for production deploy',
            'Merge to main branch',
            'Trigger production deployment',
            'Monitor deployment process',
            'Verify production health',
          ],
        },
        {
          step: 6,
          title: 'Monitor & Maintain',
          description: 'Monitor system health and maintain codebase.',
          details: [
            'Monitor application metrics',
            'Review error logs',
            'Respond to alerts',
            'Perform maintenance tasks',
            'Update documentation',
          ],
        },
      ],
    },
  },
  'customer-service': {
    area: 'customer-service',
    title: 'Customer Service Dashboard Help',
    description: 'Learn how to manage tickets, customer interactions, and service quality',
    faqs: [
      {
        question: 'How do I create a support ticket?',
        answer: 'Go to the Tickets tab and click "Create Ticket". Enter customer information, issue description, priority, and category. You can also create tickets from emails or phone calls.',
      },
      {
        question: 'How do I assign tickets?',
        answer: 'Open a ticket and click "Assign". Select an agent based on their expertise, workload, and availability. You can also use auto-assignment rules.',
      },
      {
        question: 'What is the Knowledge Base for?',
        answer: 'The Knowledge Base contains articles and solutions for common issues. You can search it when resolving tickets, and create new articles to help both agents and customers.',
      },
      {
        question: 'How do I track customer satisfaction?',
        answer: 'After resolving a ticket, customers receive a satisfaction survey. View results in the Analytics tab to see CSAT scores, response times, and agent performance.',
      },
      {
        question: 'How do I manage SLAs?',
        answer: 'Set up SLA rules based on ticket priority and category. The system automatically tracks response and resolution times, and alerts you when SLAs are at risk.',
      },
    ],
    workflow: {
      title: 'Customer Service Workflow Lifecycle',
      description: 'Complete guide to managing customer support from ticket creation to resolution',
      steps: [
        {
          step: 1,
          title: 'Receive & Triage Tickets',
          description: 'Receive customer requests and prioritize them appropriately.',
          details: [
            'Receive ticket via email, phone, chat, or portal',
            'Categorize ticket by type and priority',
            'Assign to appropriate agent or queue',
            'Set SLA based on priority',
            'Acknowledge receipt to customer',
          ],
        },
        {
          step: 2,
          title: 'Investigate & Research',
          description: 'Gather information and research the issue.',
          details: [
            'Review ticket details and history',
            'Check customer account information',
            'Search knowledge base for solutions',
            'Gather additional information if needed',
            'Identify root cause',
          ],
        },
        {
          step: 3,
          title: 'Resolve & Communicate',
          description: 'Provide solution and communicate with customer.',
          details: [
            'Provide solution or workaround',
            'Update ticket with resolution details',
            'Communicate solution to customer',
            'Confirm customer satisfaction',
            'Close ticket if resolved',
          ],
        },
        {
          step: 4,
          title: 'Escalate if Needed',
          description: 'Escalate complex issues to specialized teams.',
          details: [
            'Identify if escalation is needed',
            'Escalate to appropriate team',
            'Provide context and information',
            'Track escalation status',
            'Follow up until resolution',
          ],
        },
        {
          step: 5,
          title: 'Follow Up & Survey',
          description: 'Follow up with customers and collect feedback.',
          details: [
            'Send follow-up if needed',
            'Request customer satisfaction survey',
            'Review customer feedback',
            'Address any concerns',
            'Update knowledge base with learnings',
          ],
        },
        {
          step: 6,
          title: 'Analyze & Improve',
          description: 'Analyze performance and identify improvement opportunities.',
          details: [
            'Review ticket metrics and trends',
            'Analyze agent performance',
            'Identify common issues',
            'Update processes and training',
            'Improve knowledge base',
          ],
        },
      ],
    },
  },
}

interface FunctionalHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  area: FunctionalArea
}

export function FunctionalHelpDialog({ open, onOpenChange, area }: FunctionalHelpDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const content = helpContent[area]

  if (!content) {
    return null
  }

  const filteredFAQs = content.faqs.filter(
    (faq) =>
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl md:max-w-3xl lg:max-w-2xl max-h-[85vh] md:max-h-[80vh] lg:max-h-[75vh] w-[95vw] md:w-[90vw] lg:w-auto overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="workflow" className="w-full max-w-full overflow-hidden flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 max-w-full flex-shrink-0">
            <TabsTrigger value="workflow">
              <Workflow className="h-4 w-4 mr-2" />
              How Should I Start?
            </TabsTrigger>
            <TabsTrigger value="faqs">
              <Book className="h-4 w-4 mr-2" />
              FAQs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workflow" className="space-y-4 mt-4 max-w-full overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="space-y-2 max-w-full min-w-0 flex-shrink-0">
              <h3 className="text-lg md:text-base lg:text-base font-semibold break-words">{content.workflow.title}</h3>
              <p className="text-sm md:text-xs lg:text-xs text-muted-foreground break-words">{content.workflow.description}</p>
            </div>

            <ScrollArea className="flex-1 pr-4 overflow-x-hidden max-w-full min-h-0">
              <div className="space-y-4 max-w-full min-w-0">
                {content.workflow.steps.map((step) => (
                  <Card key={step.step} className="overflow-hidden max-w-full min-w-0">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        setExpandedStep(expandedStep === step.step ? null : step.step)
                      }
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                            {step.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base md:text-sm lg:text-sm">{step.title}</CardTitle>
                            <CardDescription className="mt-1 text-sm md:text-xs lg:text-xs">{step.description}</CardDescription>
                          </div>
                        </div>
                        {expandedStep === step.step ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </CardHeader>
                    {expandedStep === step.step && step.details && (
                      <CardContent className="pt-0">
                        <ul className="space-y-2 list-none pl-11">
                          {step.details.map((detail, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm md:text-xs lg:text-xs min-w-0">
                              <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                              <span className="break-words">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="faqs" className="space-y-4 mt-4 max-w-full overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="flex gap-2 max-w-full min-w-0 flex-shrink-0">
              <Input
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={() => setSearchQuery('')}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 overflow-x-hidden max-w-full min-h-0">
              <div className="space-y-4 max-w-full min-w-0">
                {filteredFAQs.length === 0 ? (
                  <Card className="max-w-full min-w-0">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground text-sm md:text-xs lg:text-xs">No FAQs found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredFAQs.map((faq, index) => (
                    <Card key={index} className="overflow-hidden max-w-full min-w-0">
                      <CardHeader>
                        <CardTitle className="text-base md:text-sm lg:text-sm flex items-start gap-2 min-w-0">
                          <HelpCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                          <span className="break-words">{faq.question}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm md:text-xs lg:text-xs text-muted-foreground whitespace-pre-wrap break-words">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
