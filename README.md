# How to Optimize Queries to The Graph by Detecting Inactive Browser Tabs Using Graph-Client

## Introduction

The below steps will explain how we setup this example implementation of Graph Client in NextJS.

This project was setup using `npx create-next-app`, If you need instructions on how to set up a NextJS project read the following [documentation](https://nextjs.org/learn-pages-router/basics/create-nextjs-app/setup) to get started quickly.

## Dependencies (Already installed)

The following dependencies have already been installed into this project but are here for reference.

yarn:

```bash
yarn add -D @graphprotocol/client-cli @graphprotocol/client-polling-live
```

npm:

```bash
npm install --save-dev @graphprotocol/client-cli @graphprotocol/client-polling-live
```

## Configuration

Enabling live queries:

```yaml
plugins:
    - pollingLive:
          defaultInterval: 11000
```

Setting the endpoint:

```yaml
# .graphclientrc.yml
sources:
    - name: mainnet
      handler:
          graphql:
              endpoint: https://gateway-arbitrum.network.thegraph.com/api/<APIKEY>/subgraphs/id/HUZDsRpEVP2AvzDCyzDHtdc64dyDxx8FQjzsmqSg4H3B
```

Loading the queries folder which will contain the GraphQL queries:

```yaml
documents:
    - "./queries/*.graphql"
```

An example query for Uniswap v3:

```js
query MyQuery @live {
    transactions(first: 1, orderBy: timestamp, orderDirection: desc) {
        swaps(first: 1) {
            amountUSD
            amount0
            amount1
            pool {
                token1 {
                    name
                }
                token0 {
                    name
                }
            }
        }
    }
}
```

To generate the unified schema, artifacts and `index.tsx` file. To do this run

```bash
yarn graphclient build
```

Example output:

```bash
yarn run v1.22.21
$ /Users/crashoverride/my-app/node_modules/.bin/graphclient build
💡 GraphClient Cleaning existing artifacts
💡 GraphClient Reading the configuration
💡 GraphClient Generating the unified schema
💡 GraphClient Generating artifacts
💡 GraphClient Generating index file in TypeScript
💡 GraphClient Writing index.ts for ESM to the disk.
💡 GraphClient Cleanup
💡 GraphClient Done! => /Users/kevinjones/my-app/.graphclient
✨  Done in 2.87s.
```

If you would like to test your Graph Client configuration. You can load the Yoga GraphiQL server by running

```bash
yarn graphclient serve-dev
```

This will launch the GraphiQL interface in a new browser window. Add the query from above and click the Execute Query button.

Example response:

```json
{
    "data": {
        "transactions": [
            {
                "swaps": [
                    {
                        "amount0": "-536.190827804100513073",
                        "amount1": "0.402278485649731011",
                        "amountUSD": "1288.501022062263933522516181107626",
                        "pool": {
                            "token0": {
                                "name": "Safe Token"
                            },
                            "token1": {
                                "name": "Wrapped Ether"
                            }
                        }
                    }
                ]
            }
        ]
    },
    "isLive": true
}
```

Set `pauseOnBackground` to true so that only active browser sessions will perform live queries. The default value for this directive is `true`, however it is recommended to explicitly define it for anyone reviewing the configuration will know the behavior of your application.

```yaml
plugins:
    - pollingLive:
          defaultInterval: 10000
          pauseOnBackground: true
```

## Frontend Configuration

Edit the main page under `app/page.tsx`:

```t
import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { MyQueryDocument,
   MyQueryQuery,
   subscribe
} from "../.graphclient";
import { ExecutionResult } from "graphql";
```

The most notable configuration changes here are the imports of the types that were generated earlier using Graph Client cli along with the type definitions from the GraphQL library.

Next, within the Next application, fetch the data, since this is a live query the configuration should use the `subscribe()` function to fetch the data we need in our application.

```t
  const [result, setResult] = useState<ExecutionResult<MyQueryQuery> | null>(null);

  useEffect(() => {
    let shouldContinue = true;

    const fetchData = async () => {
      try {
        const fetchedResult = await subscribe(MyQueryDocument, {});
        if ("data" in fetchedResult) {
          if (shouldContinue) {
            setResult(fetchedResult);
          }
        } else {
          for await (const result of fetchedResult) {
            if (!shouldContinue) break;
            setResult(result);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();

    return () => {
      shouldContinue = false;
    };
  }, []);
```

Lastly, an example render:

```t
 return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Query The Graph</span>
          </h1>
        </div>
        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <ul>
            {result?.data?.transactions.map((transaction, txnIndex) =>
              transaction.swaps.map((swap, swapIndex) => (
                <li key={`${txnIndex}-${swapIndex}`}>
                  <div>Amount0: {swap?.amount0 ?? "N/A"}</div>
                  <div>Amount1: {swap?.amount1 ?? "N/A"}</div>
                  <div>USD Amount: {swap?.amountUSD ?? "N/A"}</div>
                  <div>Pool Token0: {swap?.pool.token0?.name ?? "Unknown"}</div>
                  <div>Pool Token1: {swap?.pool.token1?.name ?? "Unknown"}</div>
                </li>
              )),
            )}
          </ul>
        </div>
      </div>
    </>
  );

```

## Documentation Links

GitHub docs for Live Queries (https://github.com/graphprotocol/graph-client/blob/main/docs/live.md)
Live Queries [The Guild] (https://the-guild.dev/graphql/mesh/docs/plugins/live-queries)

## Conclusion

Graph Client provides a way to sync the queries you make to The Graph network while also pausing the requests when the user tabs out of the application.
