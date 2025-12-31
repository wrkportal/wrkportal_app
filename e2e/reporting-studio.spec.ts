/**
 * E2E Tests for Reporting Studio
 */

import { test, expect } from '@playwright/test'

test.describe('Reporting Studio', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Add authentication setup
    // For now, we'll test public pages or mock auth
  })

  test('should load Reporting Studio landing page', async ({ page }) => {
    await page.goto('/reporting-studio')
    
    await expect(page.locator('h2')).toContainText('Reporting & Analytics Solution')
    await expect(page.locator('text=Data Sources')).toBeVisible()
    await expect(page.locator('text=Datasets')).toBeVisible()
    await expect(page.locator('text=Visualizations')).toBeVisible()
    await expect(page.locator('text=Dashboards')).toBeVisible()
  })

  test('should navigate to Schedules page', async ({ page }) => {
    await page.goto('/reporting-studio')
    
    await page.click('text=Schedules')
    await expect(page).toHaveURL(/.*\/reporting-studio\/schedules/)
    await expect(page.locator('h1')).toContainText('Schedules')
  })

  test('should open create schedule dialog', async ({ page }) => {
    await page.goto('/reporting-studio/schedules')
    
    await page.click('text=New Schedule')
    await expect(page.locator('text=Create Schedule')).toBeVisible()
  })

  test('should show help dialog', async ({ page }) => {
    await page.goto('/reporting-studio')
    
    await page.click('button:has-text("Help")')
    await expect(page.locator('text=Help & Documentation')).toBeVisible()
  })

  test('should search help articles', async ({ page }) => {
    await page.goto('/reporting-studio')
    
    await page.click('button:has-text("Help")')
    await page.fill('input[placeholder*="Search"]', 'schedules')
    
    // Wait for search results
    await page.waitForTimeout(500)
    
    // Should show relevant articles
    const articles = page.locator('[data-testid="help-article"]')
    await expect(articles.first()).toBeVisible()
  })
})

