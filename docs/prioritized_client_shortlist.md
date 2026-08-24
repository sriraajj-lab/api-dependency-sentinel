# API Dependency Sentinel — Prioritized Early Client Shortlist

**Purpose:** Focus the founder’s limited outreach capacity on companies most likely to have a real provider-change review problem and a technical owner who can test a $149/month pilot. This is not a claim that any prospect will purchase.

## Recommended Focus

The strongest immediate candidates are **Activepieces, n8n, Novu, and Medusa**. They are developer-facing platforms with public evidence of supported-provider complexity and a technical product surface that is compatible with Sentinel’s current TypeScript/Node and read-only GitHub wedge. Cal.com is a reasonable secondary Stripe-only test. Vapi is an attractive future voice/AI candidate, but its code-matching fit is not yet public and should be qualified before any sales effort.

| Priority | Prospect | Evidence-based reason to target | Recommended first ask | Outreach status |
|---:|---|---|---|---|
| 1 | Activepieces | Public Stripe surface spans payment, subscription, refund, dispute, checkout, and webhook-related workflows. [1] | “How do you route a Stripe change to the correct Piece and reviewer today?” | **Submitted through official sales form**; wait for reply rather than sending duplicates. |
| 2 | n8n | Public OpenAI and Twilio documentation shows a broad customer-facing integration surface, including OpenAI actions and Twilio messaging operations. [2] | “Would source-backed evidence help route provider changes to the right node or runtime owner?” | Approved but not yet submitted; use the official sales form, not a legal channel. |
| 3 | Novu | Public Twilio integration has delivery tracking, while the public TypeScript monorepo manages multi-channel provider complexity. [3] [4] | “Does a Twilio/provider revision ever create manual work to find the right provider adapter, workflow, and reviewer?” | New target; prepare a personalized draft and request individual approval before contact. |
| 4 | Medusa | Public Stripe module documentation includes API credentials, webhooks, multiple payment provider IDs, and TypeScript configuration. [5] | “Would a source-backed signal reduce review effort when Stripe changes affect the payment module or webhook behavior?” | New target; prepare a personalized draft and request individual approval before contact. |
| 5 | Cal.com | Public Stripe payments integration creates a focused, technically verifiable use case. [6] | “How does the team decide whether a Stripe change affects the payments path?” | Approved but submission not confirmed; proceed only after the founder completes the sales form. |
| 6 | Vapi | Public site lists OpenAI and Twilio integrations, but repository-language and access fit are not yet public. [7] | “Would a narrow source-to-code review be useful for a voice platform’s OpenAI/Twilio integration surface?” | Research only; do not prioritize above the top four. |

## Who Not to Target First

Do not prioritize generic SaaS companies that merely accept Stripe payments, teams without a repository owner, or companies using unsupported languages without a compelling TypeScript/Node integration service. Also defer products that are being sunset, even when they show technical relevance.

The prior Voiceflow route should be **deprioritized**, not pursued further, unless a clear technical owner independently responds. It is a weaker early pilot than the integration platforms above because the available demo process is optimized for Voiceflow customers rather than a peer engineering workflow discussion.

## Next Revenue Sequence

1. Wait for the Activepieces reply and send one non-automated follow-up only after five business days.
2. Submit the already approved n8n message through its official sales route.
3. Prepare **one** tailored Novu draft and **one** tailored Medusa draft; obtain separate approval for each.
4. Use every discovery call to test the $149, 30-day read-only monitoring pilot—not a vague partnership or generic demo.
5. Stop adding prospects until the first 6–10 conversations reveal a repeated objection or pain pattern.

## What Counts as a Good Prospect Reply

| Reply signal | Meaning | Next action |
|---|---|---|
| “We recently had to handle a provider deprecation/change.” | Strong pain evidence. | Book a discovery call and request a repository-scope discussion. |
| “Our integration team owns this.” | Clear buyer/reviewer path. | Ask for a 30-minute workflow interview. |
| “Can you show us on one repository?” | Trust and technical relevance. | Offer the read-only Risk Map and explain permission scope. |
| “We already have monitoring.” | Potential objection, not automatic rejection. | Ask whether monitoring identifies likely code and owner, then compare the workflow. |
| “We cannot grant code access.” | Current pilot blocker. | Keep as research; do not force the trial. |

## References

[1]: https://www.activepieces.com/pieces/stripe "Activepieces — Stripe integrations"
[2]: https://n8n.io/integrations/openai/and/twilio/ "n8n — OpenAI and Twilio integration"
[3]: https://novu.co/integrations/twilio/ "Novu — Twilio integration"
[4]: https://github.com/novuhq/novu "Novu — GitHub repository"
[5]: https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider/stripe "Medusa — Stripe Module Provider"
[6]: https://cal.com/features/payments "Cal.com — Payments"
[7]: https://vapi.ai/ "Vapi — Official site"
