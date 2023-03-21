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
                // Trim the base url from the full url for the next page to pass to getLists function
                const trimmed_next_url =  'v3/lists/pages?'.concat(next_url.substring(49, next_url.length - 10));
                getLists(trimmed_next_url);
            };
        };

        await getLists(url);

        // Call each address to find if the target is a member

        for (let i = 0; i < addressList.length; i++) {
            const address = addressList[i]
            const response = await mailgunClient({
                method: 'GET',
                url: `/v3/lists/${address}/members/${TEST_DATA.identifier}`,
                // I don't want to throw an error for a 404
                validateStatus: function (status) {
                    return status === 404 || status === 200;
                }
            });

            // This method allows the lookup to take place server-side.
            // This should be faster than requesting all members and looking through them.
            // It also prevents us from needing pagination for this section.
            if (response.status === 200) {
                addressWithUser.push(address)
            }
        };

        const return_value = {
            data: addressWithUser
        };

        return return_value;

      } catch (error) {
        throw(error);
      }
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
