import { Router, Request, Response } from 'express';

const router = Router();

const privacyPolicyHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - UGC Video Creator API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        .last-updated {
            color: #7f8c8d;
            margin-bottom: 30px;
            font-size: 0.9em;
        }

        h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.8em;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
        }

        h3 {
            color: #2c3e50;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 1.3em;
        }

        p {
            margin-bottom: 15px;
            text-align: justify;
        }

        ul {
            margin: 15px 0;
            padding-left: 30px;
        }

        li {
            margin-bottom: 10px;
        }

        .highlight {
            background: #ecf0f1;
            padding: 15px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
        }

        .contact {
            background: #e8f4f8;
            padding: 20px;
            border-radius: 5px;
            margin-top: 30px;
        }

        a {
            color: #3498db;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy</h1>
        <p class="last-updated"><strong>Last Updated:</strong> November 17, 2025</p>

        <p>Welcome to the UGC Video Creator API ("Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our API service.</p>

        <div class="highlight">
            <strong>Important:</strong> This is an API service designed for use with Custom GPTs and other automated systems. We do not collect personal information directly from end users browsing a website.
        </div>

        <h2>1. Information We Collect</h2>

        <h3>1.1 API Usage Data</h3>
        <p>When you use our API, we collect:</p>
        <ul>
            <li><strong>External User IDs:</strong> Anonymous identifiers provided by Custom GPT (e.g., "chatgpt:username")</li>
            <li><strong>Product URLs:</strong> Links to products you submit for scraping</li>
            <li><strong>Project Data:</strong> Avatar settings, script preferences, and video generation parameters</li>
            <li><strong>Payment Information:</strong> Stripe session IDs and payment status (credit card details are handled exclusively by Stripe)</li>
            <li><strong>Technical Data:</strong> API request logs, IP addresses, timestamps, and error logs</li>
        </ul>

        <h3>1.2 Automatically Collected Information</h3>
        <p>We automatically collect certain information when you interact with our API:</p>
        <ul>
            <li>Request timestamps and response times</li>
            <li>API endpoint accessed</li>
            <li>Authentication headers (excluding the actual secret)</li>
            <li>Error messages and stack traces (for debugging)</li>
        </ul>

        <h2>2. How We Use Your Information</h2>

        <p>We use the collected information for the following purposes:</p>

        <h3>2.1 Service Delivery</h3>
        <ul>
            <li>Process product scraping requests via Firecrawl</li>
            <li>Generate avatar images and UGC scripts</li>
            <li>Create and manage video generation projects</li>
            <li>Process payments through Stripe</li>
            <li>Track user credits and billing status</li>
        </ul>

        <h3>2.2 Service Improvement</h3>
        <ul>
            <li>Monitor API performance and reliability</li>
            <li>Debug errors and improve functionality</li>
            <li>Analyze usage patterns to optimize service</li>
            <li>Prevent fraud and abuse</li>
        </ul>

        <h3>2.3 Legal Compliance</h3>
        <ul>
            <li>Comply with legal obligations</li>
            <li>Enforce our terms of service</li>
            <li>Protect against legal liability</li>
        </ul>

        <h2>3. Data Storage and Security</h2>

        <h3>3.1 Database</h3>
        <p>We store data in Supabase (PostgreSQL), a secure cloud database service:</p>
        <ul>
            <li>User accounts with external IDs</li>
            <li>Project information (product URLs, avatar settings, scripts)</li>
            <li>Video generation records and URLs</li>
            <li>Payment records and credit balances</li>
        </ul>

        <h3>3.2 Security Measures</h3>
        <p>We implement industry-standard security measures:</p>
        <ul>
            <li>HTTPS/TLS encryption for all API communications</li>
            <li>Shared-secret authentication for API access</li>
            <li>Database access restricted to service role keys</li>
            <li>Regular security updates and monitoring</li>
            <li>Stripe-verified webhook signatures for payment processing</li>
        </ul>

        <h3>3.3 Data Retention</h3>
        <p>We retain your data for as long as necessary to provide the service and comply with legal obligations:</p>
        <ul>
            <li><strong>Project Data:</strong> Retained indefinitely unless you request deletion</li>
            <li><strong>Payment Records:</strong> Retained for 7 years for tax and accounting purposes</li>
            <li><strong>API Logs:</strong> Retained for 90 days for debugging and security</li>
        </ul>

        <h2>4. Third-Party Services</h2>

        <p>We use the following third-party services that may collect or process your data:</p>

        <h3>4.1 Stripe (Payment Processing)</h3>
        <ul>
            <li><strong>Purpose:</strong> Process credit card payments and manage checkout sessions</li>
            <li><strong>Data Shared:</strong> Email, payment amounts, session IDs</li>
            <li><strong>Privacy Policy:</strong> <a href="https://stripe.com/privacy" target="_blank">https://stripe.com/privacy</a></li>
        </ul>

        <h3>4.2 Firecrawl (Web Scraping)</h3>
        <ul>
            <li><strong>Purpose:</strong> Scrape product data from URLs</li>
            <li><strong>Data Shared:</strong> Product URLs you submit</li>
            <li><strong>Privacy Policy:</strong> <a href="https://firecrawl.dev/privacy" target="_blank">https://firecrawl.dev/privacy</a></li>
        </ul>

        <h3>4.3 Supabase (Database Hosting)</h3>
        <ul>
            <li><strong>Purpose:</strong> Store and manage all database records</li>
            <li><strong>Data Shared:</strong> All project, user, and payment data</li>
            <li><strong>Privacy Policy:</strong> <a href="https://supabase.com/privacy" target="_blank">https://supabase.com/privacy</a></li>
        </ul>

        <h3>4.4 fal.ai (Video Generation)</h3>
        <ul>
            <li><strong>Purpose:</strong> Generate UGC videos from avatars and scripts</li>
            <li><strong>Data Shared:</strong> Avatar images and script text</li>
            <li><strong>Privacy Policy:</strong> <a href="https://fal.ai/privacy" target="_blank">https://fal.ai/privacy</a></li>
        </ul>

        <h2>5. Data Sharing and Disclosure</h2>

        <p>We do not sell, rent, or trade your information. We may share your data only in the following circumstances:</p>

        <h3>5.1 Service Providers</h3>
        <p>With third-party services listed above that help us operate the API.</p>

        <h3>5.2 Legal Requirements</h3>
        <p>When required by law, court order, or government regulation.</p>

        <h3>5.3 Business Transfers</h3>
        <p>In connection with a merger, acquisition, or sale of assets (users will be notified).</p>

        <h3>5.4 Protection of Rights</h3>
        <p>To protect our rights, property, safety, or that of our users.</p>

        <h2>6. Your Rights</h2>

        <p>Depending on your location, you may have the following rights:</p>

        <h3>6.1 Access and Portability</h3>
        <ul>
            <li>Request a copy of your data</li>
            <li>Request data in a machine-readable format</li>
        </ul>

        <h3>6.2 Correction</h3>
        <ul>
            <li>Request correction of inaccurate data</li>
        </ul>

        <h3>6.3 Deletion</h3>
        <ul>
            <li>Request deletion of your data (subject to legal retention requirements)</li>
        </ul>

        <h3>6.4 Objection</h3>
        <ul>
            <li>Object to certain processing activities</li>
        </ul>

        <p>To exercise these rights, please contact us using the information below.</p>

        <h2>7. International Data Transfers</h2>

        <p>Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.</p>

        <h2>8. Children's Privacy</h2>

        <p>Our Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.</p>

        <h2>9. California Privacy Rights (CCPA)</h2>

        <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):</p>
        <ul>
            <li>Right to know what personal information is collected</li>
            <li>Right to know whether personal information is sold or disclosed</li>
            <li>Right to say no to the sale of personal information</li>
            <li>Right to access your personal information</li>
            <li>Right to equal service and price</li>
        </ul>

        <p><strong>Note:</strong> We do not sell personal information.</p>

        <h2>10. European Privacy Rights (GDPR)</h2>

        <p>If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):</p>
        <ul>
            <li>Right to access, rectification, erasure, and restriction</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
            <li>Right to withdraw consent</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
        </ul>

        <p><strong>Legal Basis for Processing:</strong> We process your data based on:</p>
        <ul>
            <li>Contract performance (to provide the API service)</li>
            <li>Legitimate interests (service improvement, fraud prevention)</li>
            <li>Legal obligations (tax, accounting)</li>
        </ul>

        <h2>11. Cookies and Tracking</h2>

        <p>Our API does not use cookies or browser-based tracking technologies. All data collection occurs through API requests.</p>

        <h2>12. Changes to This Privacy Policy</h2>

        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by:</p>
        <ul>
            <li>Updating the "Last Updated" date at the top of this policy</li>
            <li>Posting a notice on our API documentation</li>
            <li>Sending a notification to registered API users (if applicable)</li>
        </ul>

        <p>Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy.</p>

        <div class="contact">
            <h2>13. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or want to exercise your privacy rights, please contact us:</p>
            <p>
                <strong>Email:</strong> <a href="mailto:privacy@nabilnet.org">privacy@nabilnet.org</a><br>
                <strong>GitHub:</strong> <a href="https://github.com/NABILNET-ORG/gpt-ugc-content-creator" target="_blank">NABILNET-ORG/gpt-ugc-content-creator</a>
            </p>
        </div>

        <div class="footer">
            <p>&copy; 2025 UGC Video Creator API. All rights reserved.</p>
            <p><a href="/">Back to Home</a> | <a href="/health">API Status</a></p>
        </div>
    </div>
</body>
</html>
`;

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(privacyPolicyHTML);
});

export default router;
