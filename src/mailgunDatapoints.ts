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

  access: async (identifier: string): Promise<AccessResponse> => {
    try {
        // Define an array for all mailing list addresses for this company
        const addressList: string[] = [];
        
        // Define an array for mailing lists that include the target user
        const addressWithUser: string[] = [];

        // Set the starting URL for mailing lists
        const url = '/v3/lists/pages';

        // Function to get all mailing lists for the organization
        async function getLists (url) { 
            const allMailingLists = await mailgunClient({
                method: 'GET',
                url: url,
                params: {
                    limit: 100
                }
            });

            // Extract the mailing list addresses if there is more than one member
            allMailingLists.data["items"].forEach((item) => {
                if (item["members_count"] > 0) {
                    addressList.push(item["address"])
                }
            });

            // For pagination - recursively calls the getLists function 
            const num_items = allMailingLists.data["items"].length
            if (num_items === 100) {
                const next_url = allMailingLists.data["paging"]["next"];
                // Trim the base url from the full url to pass to getLists function
                const trimmed_next_url =  'v3/lists/pages?'.concat(next_url.substring(49, next_url.length - 10));
                getLists(trimmed_next_url);
            };
        };

        await getLists(url);

        // Iterate through each address to find if the target is a member

        for (let i = 0; i < addressList.length; i++) {
            const address = addressList[i]
            const response = await mailgunClient({
                method: 'GET',
                url: `/v3/lists/${address}/members/pages`,
            });
            
            /** There's a lot of code smell here.
             * 
             * Each fetch here will most likely take at least a second, so if we're looping through
             * hundreds of mailing list addresses, this would take minutes to complete. Unfortunately 
             * I haven't found a better way to do this via Mailgun's API.
             * 
             * Nested loops are also generally slow, especially if our mailing lists contain hundreds of users.
             * 
             * A better solution would be to:
             * 
             * 1. Increase the status code that will throw an error (so 404 statuses don't throw errors)
             * by adding 
             * validateStatus: function (status) {
                return status <= 404
               }
             * to the request config.
             * 2. Change the URL in the config to `/v3/lists/${address}/members/${TEST_DATA.identifier}`
             * 3. Add a conditional statement to push the address of any request that returns status 200
             * 
             * ex: 
             * if (response.status === 200) {
             *      addressWithUser.push(address)}
             * 
             * This way they're looking for the member on the server side, which should be faster
             * than doing it client side. This method is not available with the mock data
             */
            response.data["items"].forEach((item) => {
                if (item["address"] === TEST_DATA.identifier) {
                    addressWithUser.push(address)
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
