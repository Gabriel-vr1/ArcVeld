import { expect, test } from '@playwright/test'

test('keyboard navigation reaches the scenarios, analysis and provenance', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  await page.getByRole('link', { name: 'Explore scenarios' }).click()
  await expect(page).toHaveURL(/#scenarios$/)
  await expect(page.getByRole('region', { name: 'Two crop sequences, three management options' })).toBeFocused()

  await page.getByRole('navigation').getByRole('link', { name: 'NASA analysis' }).click()
  await expect(page).toHaveURL(/#nasa-analysis$/)
  await expect(page.getByText('Analysis unavailable')).toBeVisible()

  await page.getByRole('link', { name: 'See data provenance' }).click()
  await expect(page).toHaveURL(/#sources$/)
  await expect(page.getByRole('heading', { name: 'Where the evidence comes from' })).toBeVisible()
})

test('the research example is readable at 360 px without third-party requests', async ({ page, baseURL }) => {
  const externalRequests: string[] = []
  const origin = new URL(baseURL!).origin
  await page.setViewportSize({ width: 360, height: 800 })
  await page.route('**/*', (route) => {
    const url = route.request().url()
    if (new URL(url).origin === origin) return route.continue()
    externalRequests.push(url)
    return route.abort()
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Soil-cover\s*continuity/)
  await expect(page.getByRole('img', { name: /illustrated maize rows/i })).toBeVisible()

  await page.getByRole('link', { name: 'View research example' }).click()
  await expect(page).toHaveURL(/#research-example$/)
  await expect(page.getByText('NASA POWER · MERRA-2 reanalysis')).toBeVisible()
  await page.getByText('Illustrative return dates', { exact: true }).click()
  await expect(page.getByText(/15 November 2022/)).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
  expect(externalRequests).toEqual([])
})
