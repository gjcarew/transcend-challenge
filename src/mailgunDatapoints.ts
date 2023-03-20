// external
import * as rp from 'request-promise';
import axios from 'axios';
import got from 'got';

// types
import { AccessResponse, IntegrationDatapoints, SeedInput } from './types';

// The API key
export const MAILGUN_API_KEY = 'FILL IN FROM ACCOUNT';

export const mailgunDataPoints: IntegrationDatapoints = {
  /**
   * Create mailing lists and Seed user(s) onto them
   */
  seed: async (seedInput: SeedInput): Promise<void> => {
    throw new Error('Seeding not implemented!');
  },
  /**
   * Get all mailing lists that the user belongs to
   */
  access: async (identifier: string): Promise<AccessResponse> => {
    throw new Error('Access not implemented!');
  },
  /**
   * Remove the user from all mailing lists.
   * NOTE: Erasure runs an Access (access()) before it to
   * fetch the context data it might need.
   */
  erasure: async (identifier: string, contextDict?: object): Promise<void> => {
    throw new Error('Erasure not implemented!');
  },
};
