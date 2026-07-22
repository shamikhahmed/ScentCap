/** Playwright route mocks for Fraganty catalog API */
export const FRAGANTY_SEARCH = '**/fraganty.ai/api/search**';
export const FRAGANTY_PERFUME = '**/fraganty.ai/api/perfumes/**';

export const fragantySuccessBody = {
  results: [
    {
      name: 'Oud Wood Eau de Parfum',
      brand: 'Tom Ford',
      slug: 'tom-ford-oud-wood',
      image: 'https://example.com/oud-wood.png',
    },
  ],
};

export async function mockFragantySuccess(page: { route: (url: string, handler: (route: { fulfill: (o: object) => Promise<void> }) => Promise<void>) => Promise<void> }) {
  await page.route(FRAGANTY_SEARCH, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fragantySuccessBody),
    });
  });
}

export async function mockFragantyEmpty(page: { route: (url: string, handler: (route: { fulfill: (o: object) => Promise<void> }) => Promise<void>) => Promise<void> }) {
  await page.route(FRAGANTY_SEARCH, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [] }) });
  });
}

export async function mockFragantyError(page: { route: (url: string, handler: (route: { fulfill: (o: object) => Promise<void> }) => Promise<void>) => Promise<void> }) {
  await page.route(FRAGANTY_SEARCH, async (route) => {
    await route.fulfill({ status: 500, body: 'error' });
  });
}
