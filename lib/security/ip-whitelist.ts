/**
 * IP Whitelisting Service
 * 
 * Restricts access to the application based on IP addresses or IP ranges
 */

import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export interface IPWhitelistRule {
  id: string
  tenantId: string
  name: string
  ipAddress?: string // Single IP
  ipRange?: string // CIDR notation (e.g., 192.168.1.0/24)
  isActive: boolean
  createdAt: Date
}

/**
 * Check if an IP address matches a CIDR range
 */
function ipMatchesCIDR(ip: string, cidr: string): boolean {
  const [range, prefixLength] = cidr.split('/')
  const mask = parseInt(prefixLength, 10)
  
  const ipToNumber = (ip: string): number => {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
  }
  
  const rangeNum = ipToNumber(range)
  const ipNum = ipToNumber(ip)
  const maskNum = (0xFFFFFFFF << (32 - mask)) >>> 0
  
  return (ipNum & maskNum) === (rangeNum & maskNum)
}

/**
 * Check if an IP address is whitelisted for a tenant
 */
export async function isIPWhitelisted(
  ipAddress: string,
  tenantId: string
): Promise<{ allowed: boolean; rule?: IPWhitelistRule }> {
  // Get client IP from request
  const clientIP = ipAddress || '0.0.0.0'
  
  // Check if tenant has IP whitelisting enabled
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { 
      id: true,
      settings: true 
    }
  })
  
  if (!tenant) {
    return { allowed: false }
  }
  
  const settings = tenant.settings as any
  const ipWhitelistEnabled = settings?.security?.ipWhitelistEnabled ?? false
  
  // If IP whitelisting is not enabled, allow all
  if (!ipWhitelistEnabled) {
    return { allowed: true }
  }
  
  // Check IP whitelist rules (stored in Tenant.settings for now, can be moved to separate table)
  const whitelistRules = settings?.security?.ipWhitelistRules || []
  
  // If no rules, deny access (fail secure)
  if (whitelistRules.length === 0) {
    return { allowed: false }
  }
  
  // Check if IP matches any rule
  for (const rule of whitelistRules) {
    if (!rule.isActive) continue
    
    // Check single IP
    if (rule.ipAddress && rule.ipAddress === clientIP) {
      return { allowed: true, rule }
    }
    
    // Check CIDR range
    if (rule.ipRange && ipMatchesCIDR(clientIP, rule.ipRange)) {
      return { allowed: true, rule }
    }
  }
  
  return { allowed: false }
}

/**
 * Get client IP address from Next.js request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for real IP (behind proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback if no IP headers are present
  return '0.0.0.0'
}

/**
 * Middleware to check IP whitelisting
 */
export async function checkIPWhitelist(
  request: NextRequest,
  tenantId: string
): Promise<{ allowed: boolean; error?: string }> {
  const clientIP = getClientIP(request)
  const { allowed } = await isIPWhitelisted(clientIP, tenantId)
  
  if (!allowed) {
    return {
      allowed: false,
      error: `Access denied. IP address ${clientIP} is not whitelisted.`
    }
  }
  
  return { allowed: true }
}

/**
 * Add IP whitelist rule to tenant settings
 */
export async function addIPWhitelistRule(
  tenantId: string,
  rule: Omit<IPWhitelistRule, 'id' | 'tenantId' | 'createdAt'>
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true }
  })
  
  if (!tenant) {
    throw new Error('Tenant not found')
  }
  
  const settings = (tenant.settings as any) || {}
  if (!settings.security) {
    settings.security = {}
  }
  if (!settings.security.ipWhitelistRules) {
    settings.security.ipWhitelistRules = []
  }
  
  const newRule = {
    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...rule,
    createdAt: new Date()
  }
  
  settings.security.ipWhitelistRules.push(newRule)
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settings }
  })
}

/**
 * Remove IP whitelist rule
 */
export async function removeIPWhitelistRule(
  tenantId: string,
  ruleId: string
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true }
  })
  
  if (!tenant) {
    throw new Error('Tenant not found')
  }
  
  const settings = (tenant.settings as any) || {}
  if (settings.security?.ipWhitelistRules) {
    settings.security.ipWhitelistRules = settings.security.ipWhitelistRules.filter(
      (r: any) => r.id !== ruleId
    )
    
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings }
    })
  }
}

/**
 * Enable/disable IP whitelisting for tenant
 */
export async function setIPWhitelistEnabled(
  tenantId: string,
  enabled: boolean
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true }
  })
  
  if (!tenant) {
    throw new Error('Tenant not found')
  }
  
  const settings = (tenant.settings as any) || {}
  if (!settings.security) {
    settings.security = {}
  }
  
  settings.security.ipWhitelistEnabled = enabled
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settings }
  })
}

