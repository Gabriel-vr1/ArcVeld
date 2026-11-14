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
  await expect(page.getByRole('table', { name: 'Historical daily rainfall exposure' })).toBeVisible()

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
  await expect(page.getByRole('table', { name: 'Historical daily rainfall exposure' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
  expect(externalRequests).toEqual([])
})

test('research results recalculate on date edits and reset', async ({ page }) => {
  await page.goto('/#nasa-analysis')
  const daily = page.getByRole('table', { name: 'Historical daily rainfall exposure' })
  const rain = page.getByText(/616\.35 mm across 76 UTC days/)
  const tie = page.getByText('Calendar and uniform-rainfall baselines tie.', { exact: true })
  const early = page.getByLabel('Earlier return (UTC)')
  const late = page.getByLabel('Later return (UTC)')

  await expect(tie).toBeVisible()
  await expect(daily.getByRole('cell', { name: '506.83' })).toBeVisible()
  await expect(daily.getByRole('cell', { name: '468.47' })).toBeVisible()
  await expect(page.getByText(/27 December 2022.*[−-]10\.4175 mm-equivalent/)).toBeVisible()

  await late.fill('2022-12-07')
  await expect(tie).toBeVisible()
  await expect(daily.getByRole('cell', { name: '468.47' })).toHaveCount(0)
  await expect(rain).toBeVisible()

  await late.fill('2023-01-05')
  await expect(page.getByText('A residue schedule extends past the window.', { exact: true })).toBeVisible()
  await expect(tie).toHaveCount(0)
  await expect(daily.getByRole('cell', { name: '506.83' })).toBeVisible()
  await expect(rain).toBeVisible()

  await late.fill('2022-11-15')
  await expect(daily.getByRole('cell', { name: '506.83' })).toHaveCount(2)
  await expect(page.getByText('The daily rainfall estimates also tie within calculation tolerance.', { exact: false })).toBeVisible()

  await early.fill('2022-11-16')
  await expect(page.getByText('Analysis unavailable')).toBeVisible()
  await expect(daily).toHaveCount(0)

  await page.getByRole('button', { name: 'Reset research dates' }).click()
  await expect(early).toHaveValue('2022-11-15')
  await expect(late).toHaveValue('2022-12-06')
  await expect(daily.getByRole('cell', { name: '468.47' })).toBeVisible()
})
