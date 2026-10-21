import { test, expect } from '@playwright/test';

test.describe('CardioCare End-to-End Assessment Flow', () => {
  test('Completes the multi-step assessment wizard and views risk results', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/CardioCare — Hypertension Risk Predictor/);
    await expect(page.getByText('Prevent Hypertension with Precision AI')).toBeVisible();

    // 2. Click CTA "Check My Risk"
    const ctaButton = page.getByRole('link', { name: /Check My Risk/i });
    await ctaButton.click();
    await expect(page).toHaveURL(/.*assessment/);

    // 3. Step 1: Biometrics
    await expect(page.getByText(/Demographics & Physical Metrics/i)).toBeVisible();
    // Advance to Step 2
    await page.getByRole('button', { name: /Continue/i }).click();

    // 4. Step 2: Lifestyle Indicators
    await expect(page.getByText(/Behavioral & Environmental Factors/i)).toBeVisible();
    // Advance to Step 3
    await page.getByRole('button', { name: /Continue/i }).click();

    // 5. Step 3: Clinical & Family History
    await expect(page.getByText(/Clinical & Family History/i)).toBeVisible();

    // Submit prediction
    const submitBtn = page.getByRole('button', { name: /Calculate Risk Profile/i });
    await submitBtn.click();

    // 6. Result verification
    await expect(page).toHaveURL(/.*result/);
    await expect(page.getByText(/Patient Risk Assessment Report/i)).toBeVisible();
    await expect(page.getByText(/Predicted Probability/i)).toBeVisible();
    await expect(page.getByText(/Top Contributing Risk Factors/i)).toBeVisible();
    await expect(page.getByText(/Simulate Targeted Lifestyle Interventions/i)).toBeVisible();
  });
});
