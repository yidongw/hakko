import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  async autoCreateToken(params: any): Promise<any> {
    let browser;
    try {
      browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.goto('https://www.doubleup.fun/pumpup/create', { waitUntil: 'networkidle2' });

      // Fill in basic information
      await page.type('input[name="name"]', params.name);
      await page.type('input[name="symbol"]', params.symbol);
      await page.type('textarea[name="description"]', params.description);

      // Fill in image URL
      if (params.imageUrl) {
        await page.type('input[name="imageUrl"]', params.imageUrl);
      }

      // Expand more options
      const showMoreBtn = await page.$x("//*[contains(text(), 'show more options')]");
      if (showMoreBtn.length) await showMoreBtn[0].click();

      // Select Migration Target
      if (params.migrationTarget) {
        await page.select('select', params.migrationTarget);
      } else {
        await page.select('select', 'Bluefin');
      }

      // Fill in social links
      if (params.twitterLink) await page.type('input[name="twitterLink"]', params.twitterLink);
      if (params.telegramLink) await page.type('input[name="telegramLink"]', params.telegramLink);
      if (params.websiteLink) await page.type('input[name="websiteLink"]', params.websiteLink);

      // Submit the form
      const createBtn = await page.$x("//*[contains(text(), 'Create Token')]");
      if (createBtn.length) await createBtn[0].click();

      // Wait for result page or popup
      await page.waitForTimeout(5000);

      this.logger.log(`Token created: ${params.name} (${params.symbol})`);
      return { success: true, message: 'Token creation process triggered.' };
    } catch (error) {
      this.logger.error('Token automation failed', error);
      throw new InternalServerErrorException('Token automation failed: ' + error.message);
    } finally {
      if (browser) await browser.close();
    }
  }
} 