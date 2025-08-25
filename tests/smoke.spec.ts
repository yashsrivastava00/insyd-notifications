import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
  test('Basic notification workflow', async ({ page }) => {
  // Increase timeouts for test since we're dealing with real API calls
  test.setTimeout(60000); // 60 seconds
    // Visit the notifications page
    await page.goto('/notifications');

    // Wait for user selector to be ready
    await page.waitForSelector('select');
    
    // Reseed data first
    await page.click('button:has-text("Reseed Data")');
    await page.waitForSelector('select:not([disabled])');

    // Wait for seeding to complete and users to be loaded
    await page.waitForFunction(() => {
      const select = document.querySelector('select');
      return select && select.options.length > 1;
    }, { timeout: 10000 });

    // Wait for multiple users to be available in the dropdown
    await page.waitForFunction(() => {
      const select = document.querySelector('select');
      return select && select.options.length >= 3; // Need at least 3 users for interactions
    }, { timeout: 10000 });

    // Try selecting users until we find one that works
    for (let i = 1; i <= 3; i++) {
      // Select a user
      const select = page.locator('select');
      await select.selectOption({ index: i });
      
      try {
        // Make sure the user context is properly updated
        await page.waitForSelector('text=You can now create and interact with notifications', { timeout: 2000 });
        break; // Successfully selected a valid user
      } catch (e: any) {
        if (i === 3) throw new Error('Failed to find a valid user after 3 attempts');
        // Try the next user
        continue;
      }
    }
    
    // Wait for either the empty state or loading spinner
    try {
      await Promise.race([
        page.waitForSelector('.text-center .text-4xl'),  // Empty state
        page.waitForSelector('.animate-spin')  // Loading state
      ]);
    } catch (e: any) {
      if (e.name !== 'TimeoutError') throw e;
      // If neither appears quickly, something is wrong with our state
      const content = await page.content();
      throw new Error(`Neither empty state nor loading indicator found. Current content: ${content.slice(0, 500)}...`);
    }
    
    // Create a new post and handle loading/error states
    await page.click('button:has-text("New Post")');
    
    try {
      // Try to catch any error toast
      const errorToast = await page.waitForSelector('.bg-red-600', { timeout: 1000 });
      if (errorToast) {
        const errorText = await errorToast.textContent();
        throw new Error(`Error toast shown: ${errorText}`);
      }
    } catch (e: any) {
      if (e.name !== 'TimeoutError') throw e;
      // No error toast, continue
    }
    
    // Wait for success toast
    await page.waitForSelector('.bg-green-600', { timeout: 10000 });
    await page.waitForSelector('text=Demo post created', { timeout: 1000 });
    
    // Wait for loading states
    try {
      await page.waitForSelector('.animate-spin', { state: 'attached' });
      await page.waitForSelector('.animate-spin', { state: 'detached' });
    } catch (e: any) {
      if (e.name !== 'TimeoutError') throw e;
      // Loading spinner might be too quick to catch
    }

    // Verify notification appears
    await page.waitForSelector('text=created a new post');

    // Try marking a notification as read
    await page.click('button:has-text("Mark as Read")');
    await page.waitForSelector('text=Marked as read');

    // Switch to AI ranking
    await page.click('button:has-text("AI Ranked")');
    await page.waitForSelector('.text-center .text-4xl', { state: 'hidden', timeout: 10000 });

    // Create a follow notification
    await page.click('button:has-text("Follow")');
    await page.waitForSelector('text=Demo follow created');

    // Verify follow notification appears
    await page.waitForSelector('text=started following you');
  });
});
