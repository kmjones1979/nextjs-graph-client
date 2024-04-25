"use client";

// Updated import statements and proper use of the imports
import { useEffect, useState } from "react";
import { MyQueryDocument, MyQueryQuery, subscribe } from "../.graphclient";
import { ExecutionResult } from "graphql";
import type { NextPage } from "next";

const Home: NextPage = () => {
    // Initialize `useState` to handle the GraphQL query result with proper typing and default value
    const [result, setResult] = useState<ExecutionResult<MyQueryQuery> | null>(
        null
    );

    useEffect(() => {
        let shouldContinue = true; // Flag to control the subscription lifecycle

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
                        console.log(result);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };

        fetchData();

        return () => {
            shouldContinue = false; // Clean up the subscription when the component unmounts
        };
    }, []); // Ensures it runs only once

    return (
        <>
            <div className="flex items-center flex-col flex-grow pt-10">
                <div className="px-5">
                    <h1 className="text-center">
                        <span className="block text-4xl font-bold">
                            Query The Graph
                        </span>
                    </h1>
                </div>
                <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
                    <ul>
                        {result?.data?.transactions.map(
                            (transaction, txnIndex) =>
                                transaction.swaps.map((swap, swapIndex) => (
                                    <li key={`${txnIndex}-${swapIndex}`}>
                                        <div>
                                            Amount0: {swap?.amount0 ?? "N/A"}
                                        </div>
                                        <div>
                                            Amount1: {swap?.amount1 ?? "N/A"}
                                        </div>
                                        <div>
                                            USD Amount:{" "}
                                            {swap?.amountUSD ?? "N/A"}
                                        </div>
                                        <div>
                                            Pool Token0:{" "}
                                            {swap?.pool.token0?.name ??
                                                "Unknown"}
                                        </div>
                                        <div>
                                            Pool Token1:{" "}
                                            {swap?.pool.token1?.name ??
                                                "Unknown"}
                                        </div>
                                    </li>
                                ))
                        )}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default Home;
