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
        try {
            await mailgunClient({
                method: 'POST',
                url: `/v3/lists/${seedInput.mailingList}/members`,
                params: {
                    address: seedInput.identifier,
                    upsert: "yes"
                }
            });
        } catch (error) {
            const seedError = {
                location: 'mailgunDataPoints/seed',
                time: new Date().toLocaleString(),
                cause: 'Please check seedInput'
            }

            console.error(seedError)
            throw (error)
        }
    },
    /**
     * Get all mailing lists that the user belongs to
     */

    access: async (identifier: string): Promise<AccessResponse> => {
        try {            
            // Set the starting URL for mailing lists
            const url = '/v3/lists/pages';
            
            //Get all mailing lists for the organization
            const addressList = await getLists(url);
            console.log(addressList)
            // Create an array of promises
            const requests = addressList.map( async( address ) => {
                const response = await mailgunClient({
                    method: 'GET',
                    url: `/v3/lists/${address}/members/${identifier}`,
                    // I want to continue the execution of this function with a 404 response
                    validateStatus: function (status) {
                        return status === 404 || status === 200;
                    }
                });
                /**
                 * This method allows the lookup to take place server-side.
                 * This should be faster than requesting all members and looping through to find the target member.
                 * It also prevents us from needing pagination for this section.
                 * 
                 * I don't like how many calls need to be made here - it works with the mocked data
                 * but there is a good chance this would run into a rate limit errors in production. 
                 * Those errors could be addressed with exponential backoff using a package like axios-retry
                */
                
                if (response.status === 200) {
                    return address
                }
            });

            const results = await Promise.all( requests )

            // Returns an array of the promise values that did not resolve to null
            const addressesWithUser: (string | undefined)[] = results.filter(n => n);

            return {
                data: addressesWithUser,
                contextDict: {
                    mailingLists: addressesWithUser
                }
            };
        } catch (error) {
            const accessError = {
                location: 'mailgunDataPoints/access',
                time: new Date().toLocaleString(),
                cause: 'Please check identifier'
            }

            console.error(accessError);
            throw (error);
        }
    },
    /**
     * Remove the user from all mailing lists.
     * NOTE: Erasure runs an Access (access()) before it to
     * fetch the context data it might need.
    */
    erasure: async (identifier: string, contextDict?: object): Promise<void> => {
        try {
            const mailingLists = contextDict["mailingLists"]
            for (let i = 0; i < mailingLists.length; i++) {
                const address = mailingLists[i]
                await mailgunClient({
                    method: 'DELETE',
                    url: `/v3/lists/${address}/members/${identifier}`,
                });
            }; 
        } catch (error) {
            const erasureError = {
                location: 'mailgunDataPoints/erasure',
                time: new Date().toLocaleString(),
                cause: 'Make sure access is running successfully'
            }

            console.error(erasureError);
            throw (error);
        }
    },
    };
   
// Function to get all mailing lists for the organization
async function getLists (url: string): Promise<string[]> {
    const allMailingLists = await mailgunClient({
        method: 'GET',
        url: url,
        params: {
            limit: 100
        }
    });

    // const addressList: string[] = [];

    // Extract the mailing list addresses if a list has members
    const addressList: string[] = allMailingLists.data["items"].map((item) => {
        if (item["members_count"] > 0) {
            return item["address"]
        }
    });

    // For pagination - recursively calls the getLists function 
    const num_items = allMailingLists.data["items"].length
    if (num_items === 100) {
        const next_url = allMailingLists.data["paging"]["next"];
        // Trim the base url from the full url for the next page to pass to getLists function
        const trimmed_next_url =  'v3/lists/pages?'.concat(next_url.substring(49, next_url.length - 10));
        addressList.concat(await getLists(trimmed_next_url));
    };

    return addressList.filter(n => n);
};