// ==UserScript==
// @name            LeetCode2Sheet_DirectTest
// @namespace       Test Google Sheets Integration
// @version         1.0.0
// @description     Test Google Sheets Integration directly
// @match           https://script.google.com/macros/*
// @grant           GM.xmlHttpRequest
// @connect         script.google.com
// @connect         script.googleusercontent.com
// @license         GPL-2.0
// ==/UserScript==

(function() {
    'use strict';

    const googleScriptUrl = 'https://script.google.com/macros/s/AKfycby3U5afzgs2FZBWXVJHrUX5BtyxEpAN8rSUA4HD18jnRqdcshF_p697b6hwBbje92G4/exec';
    
    // Add a test button
    function addTestButton() {
        const button = document.createElement('button');
        button.innerText = 'Test Google Sheets API';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '9999';
        button.style.padding = '10px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        
        button.addEventListener('click', testSheetApi);
        document.body.appendChild(button);
        
        console.log("Test button added to page");
    }
    
    // Test the Google Sheets API
    async function testSheetApi() {
        console.log("Testing Google Sheets API...");
        
        // Sample data
        const testData = {
            id: "test-123",
            title: "Test Problem",
            difficulty: "Medium",
            tags: ["array", "dynamic-programming"],
            url: "https://leetcode.com/problems/test-problem/",
            status: "Testing"
        };
        
        try {
            // First try a GET request to check if the endpoint is accessible
            await checkEndpoint();
            console.log("Endpoint is accessible. Sending test data...");
            
            // Now try the actual POST
            await sendData(testData);
            console.log("Test successful!");
            alert("Test successful! Check your Google Sheet for the test entry.");
        } catch (error) {
            console.error("Test failed:", error);
            alert(`Test failed: ${error.message}`);
        }
    }
    
    // Check if the endpoint is accessible
    function checkEndpoint() {
        return new Promise((resolve, reject) => {
            console.log("Checking endpoint accessibility...");
            
            GM.xmlHttpRequest({
                method: 'GET',
                url: googleScriptUrl,
                onload: (response) => {
                    console.log("Endpoint check response:", response.status);
                    console.log("Response headers:", response.responseHeaders);
                    console.log("Response text:", response.responseText);
                    resolve();
                },
                onerror: (error) => {
                    console.error("Endpoint check failed:", error);
                    reject(new Error("Could not access the Google Sheets endpoint"));
                }
            });
        });
    }
    
    // Send test data to Google Sheets
    function sendData(data) {
        return new Promise((resolve, reject) => {
            console.log("Sending data to Google Sheets:", data);
            
            GM.xmlHttpRequest({
                method: 'POST',
                url: googleScriptUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: JSON.stringify(data),
                onload: (response) => {
                    console.log("Response status:", response.status);
                    console.log("Response headers:", response.responseHeaders);
                    console.log("Response text:", response.responseText);
                    
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            // Check if the response is HTML
                            if (response.responseText.trim().toLowerCase().startsWith('<!doctype') ||
                                response.responseText.trim().toLowerCase().startsWith('<html')) {
                                console.log("Received HTML response, assuming success");
                                resolve();
                                return;
                            }
                            
                            // Try to parse as JSON
                            const jsonResponse = JSON.parse(response.responseText);
                            console.log("Parsed response:", jsonResponse);
                            
                            if (jsonResponse.result === "success" || !jsonResponse.error) {
                                resolve(jsonResponse);
                            } else {
                                reject(new Error(jsonResponse.error || "Unknown error"));
                            }
                        } catch (e) {
                            console.error("Error parsing JSON response:", e);
                            // If status is 200, consider it a success even if JSON parsing fails
                            if (response.status === 200) {
                                resolve();
                            } else {
                                reject(new Error("Failed to parse response"));
                            }
                        }
                    } else {
                        reject(new Error(`Request failed with status ${response.status}`));
                    }
                },
                onerror: (error) => {
                    console.error("Request error:", error);
                    reject(new Error("Request failed"));
                }
            });
        });
    }
    
    // Initialize
    addTestButton();
    console.log("LeetCode2Sheet_DirectTest loaded");
})();
