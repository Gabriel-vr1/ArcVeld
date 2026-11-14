import { expect, test } from '@playwright/test'

test('four pages support keyboard navigation, history and direct refresh', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  await page.getByRole('link', { name: 'Open Rotation Planner' }).click()
  await expect(page).toHaveURL(/#\/planner$/)
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Crop Rotation Planner' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Rotation Planner', exact: true })).toHaveAttribute('aria-current', 'page')

  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await nav.getByRole('link', { name: 'Earth Observations' }).click()
  await expect(page.getByRole('heading', { name: 'Earth Observations', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'See data provenance' }).click()
  await expect(page.getByRole('heading', { name: 'Research & Methodology' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Research & Methodology' })).toBeVisible()
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Scientific method' }).click()
  await expect(page).toHaveURL(/#\/research$/)
  await expect(page.locator('#method')).toBeFocused()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Earth Observations', level: 1 })).toBeVisible()
})

test('all workspaces fit at 360 px and use locally bundled data', async ({ page, baseURL }) => {
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Agricultural\s*Rotation Planning/)
  await expect(page.getByRole('img', { name: /Malawi and the Kasungu/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)

  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  for (const label of ['Rotation Planner', 'Earth Observations', 'Research & Sources']) {
    await nav.getByRole('link', { name: label }).click()
    await expect(nav.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(360)
  }
  expect(externalRequests).toEqual([])
})

test('planner edits and feasibility carry between routes while historical rainfall stays fixed', async ({ page }) => {
  await page.goto('/#/observations')
  const daily = page.getByRole('table', { name: 'Calendar, uniform and historical daily rainfall exposure' })
  const tie = page.getByText('Calendar and uniform-rainfall baselines tie.', { exact: true })
  const early = page.getByLabel('Earlier return (UTC)')
  const late = page.getByLabel('Later return (UTC)')
  const evidence = page.getByRole('complementary', { name: 'Daily evidence' })
  const rain = page.getByText('616.35 mm', { exact: true })

  await expect(tie).toBeVisible()
  await expect(daily.getByRole('cell', { name: '480.31' })).toHaveCount(2)
  await expect(daily.getByRole('cell', { name: '506.83' })).toBeVisible()
  await expect(daily.getByRole('cell', { name: '468.47' })).toBeVisible()
  await expect(page.getByText('−38.35 mm-equivalent', { exact: true })).toBeVisible()
  await expect(evidence.getByText('−10.4175 mm-equivalent')).toBeVisible()
  await expect(rain).toBeVisible()

  await page.getByRole('link', { name: 'Edit scenario' }).click()
  await late.fill('2022-12-07')
  await expect(page.getByText('468.47', { exact: true })).toHaveCount(0)
  await page.getByText('Check management constraints', { exact: true }).click()
  await page.getByLabel('Is the later date workable?').selectOption('no')
  await expect(page.getByText('blocked', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Inspect rainfall and cover' }).click()
  await expect(tie).toBeVisible()
  await expect(daily.getByRole('cell', { name: '468.47' })).toHaveCount(0)
  await expect(rain).toBeVisible()

  await page.getByRole('link', { name: 'Edit scenario' }).click()
  await expect(late).toHaveValue('2022-12-07')
  await expect(page.getByText('blocked', { exact: true })).toBeVisible()
  await late.fill('2023-01-05')
  await expect(page.getByText('blocked', { exact: true })).toHaveCount(0)
  await expect(page.getByText('A residue schedule extends past the window.', { exact: true })).toBeVisible()
  await expect(tie).toHaveCount(0)
  await late.fill('2022-11-15')
  await expect(page.getByText('506.83', { exact: true })).toHaveCount(2)

  await early.fill('2022-11-16')
  await expect(page.getByText('Analysis unavailable.')).toBeVisible()
  await page.getByRole('link', { name: 'Inspect rainfall and cover' }).click()
  await expect(daily).toHaveCount(0)
  await page.getByRole('link', { name: 'Edit scenario' }).click()

  await page.getByRole('button', { name: 'Reset research scenario' }).click()
  await expect(early).toHaveValue('2022-11-15')
  await expect(late).toHaveValue('2022-12-06')
  await page.getByText('Edit illustrative ground-cover assumptions', { exact: true }).click()
  await page.getByLabel('Baseline cover (%)').fill('25')
  await page.getByRole('link', { name: 'Inspect rainfall and cover' }).click()
  await expect(daily.getByRole('cell', { name: '468.47' })).toHaveCount(0)
  await expect(rain).toBeVisible()
})

test('daily evidence can be investigated by keyboard, chart events and a table', async ({ page }) => {
  await page.goto('/#/observations')
  const day = page.getByLabel('Inspect UTC date')
  await expect(day).toHaveValue('2022-12-27')
  await day.focus()
  await page.keyboard.press('ArrowUp')
  await expect(day).toHaveValue('2022-12-26')
  await page.getByRole('button', { name: 'Next UTC day' }).click()
  await expect(day).toHaveValue('2022-12-27')
  const plot = page.locator('.plot-hit')
  const bounds = (await plot.boundingBox())!
  await plot.click({ position: { x: bounds.width * 0.15, y: 30 } })
  await expect(day).toHaveValue('2022-11-12')

  await page.getByText('View all 76 days as a table').click()
  const table = page.getByRole('table', { name: 'Daily NASA rainfall and illustrative ground cover' })
  await expect(table.getByRole('row')).toHaveCount(77)
  await expect(table.getByRole('row', { name: /2022-12-27/ })).toContainText('−10.4175')

  await page.getByRole('button', { name: /27 Dec/ }).click()
  await expect(page.getByRole('button', { name: /27 Dec/ })).toHaveAttribute('aria-pressed', 'true')
})
