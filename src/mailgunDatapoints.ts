// external
import * as rp from 'request-promise';
import axios from 'axios';
import got from 'got';

// types
import { AccessResponse, IntegrationDatapoints, SeedInput } from './types';
import { TEST_DATA } from './constants';
import { resolve } from 'path';

// The API key
export const MAILGUN_API_KEY = 'FILL IN FROM ACCOUNT';

// The API key should not be hard-coded here, but rather taken from an environment variable
 
// The base instance to build API calls
const mailgunClient = axios.create({
    baseURL: 'https://api.mailgun.net/',
    timeout: 1000,
    auth: {
        username: 'api',
        password: MAILGUN_API_KEY
      }
  });

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

  /**
   * TODO: 
   * Get the lists JSON from Mailgun API
   * Iterate through the json to find the member
   * Add that email list address to the list of email lists
   * 
   */
  access: async (identifier: string): Promise<AccessResponse> => {
    try {
        // Define an array for all mailing list addresses for this company
        const addressList: string[] = [];
        
        // Define an array for mailing lists that include the target user
        const addressWithUser: string[] = [];

        const response = await mailgunClient({
            method: 'GET',
            url: '/v3/lists/pages',
            params: {
                limit: 100
            }
        });
            // Extract the mailing list addresses  
        response.data["items"].forEach((item) => {
            addressList.push(item["address"])
        });

        // Iterate through each address to find if the target is a member

        for (let i = 0; i < addressList.length; i++) {
            const address = addressList[i]
            const response = await mailgunClient({
                method: 'GET',
                url: `/v3/lists/${address}/members/pages`,
            });
            
            response.data["items"].forEach((item) => {
                if (item["address"] === TEST_DATA.identifier) {
                    addressWithUser.push(addressList[i])
                }
            });
            
        };

        // Instructions said to return a list.
        // In order to run correctly, I needed to wrap it in a hash/dictionary.
        const return_value = {
            data: addressWithUser
        };

        return return_value;

      } catch (error) {
        throw(error);
      }
      
    // throw new Error('Access not implemented!');
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
