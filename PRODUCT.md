# Product Specifications

Last updated: August 30, 2026.

Initiate is an AI-assisted marketplace and collaboration platform that helps small and medium-sized enterprises find, evaluate, buy, and implement AI and digital services from solution providers.

## Document Status

This file is the single source of truth for Initiate's product direction, scope, and current capabilities. Update it whenever a product decision or implementation change makes any section inaccurate.

## Customer Problem

SME owners often know the business outcome they want, such as an employee-onboarding chatbot, but do not know which product or provider fits their situation. General web search takes time, gives weak signals about provider quality, and makes pricing, credentials, and relevant experience hard to compare. The result is a slow sourcing process and a higher chance of choosing the wrong solution.

Solution providers face the other side of the same problem. They need qualified demand, a credible place to present their work, and a practical way to move from discovery into a managed customer engagement.

## Product Promise

Initiate shortens the path between a business need and a working solution. A buyer can describe a need, discover relevant providers, compare concrete offers, talk with a provider, place an order, and track delivery without assembling that process across unrelated tools.

AI helps with search, explanation, comparison, and decision support. It does not replace provider due diligence, contract decisions, payment authorization, or delivery accountability.

## Users

### Primary Users

- SME owners and business decision-makers use Initiate to find practical AI and digital services.
- Solution providers and startups use Initiate to publish services, reach buyers, and manage delivery.

### Supporting Users

- Company representatives manage an organization's profile, catalog, orders, members, and performance.
- Ecosystem partners contribute grants, documentation, programs, or provider referrals.
- Platform administrators manage shared resources, communications, and marketplace operations.
- Investors are supported as an account type, but the current product has no investment transaction, portfolio, or crowdfunding workflow.

## Jobs To Be Done

### For Buyers

- Turn a loosely defined business need into a useful search or problem statement.
- Find services that fit the buyer's industry, interests, budget, and intended outcome.
- Compare providers, service details, plans, pricing, reviews, and similar options.
- Contact a provider and clarify the work before committing.
- Place an order and follow its milestones, invoices, messages, and status.
- Find grants and practical documentation that can support adoption.

### For Providers

- Create an organization profile that explains the team's focus and credibility.
- Publish API, MCP, SaaS, or custom service offerings with clear plans and pricing.
- Receive qualified inquiries, community proposals, and service orders.
- Collaborate with buyers through messaging, attachments, voice calls, and video calls.
- Manage milestones and invoices through the delivery lifecycle.
- Review revenue, order activity, service performance, and AI-generated business insights.

## Core Experience

```mermaid
flowchart LR
  A[Complete Profile] --> B[Describe A Need]
  B --> C[Search Or Ask The AI Advisor]
  C --> D[Review Matched Services]
  D --> E[Compare Plans, Proof, And Pricing]
  E --> F[Message Or Call A Provider]
  F --> G[Place An Order]
  G --> H[Manage Milestones And Invoices]
  H --> I[Complete And Review]
```

The provider journey begins with organization setup, then service and plan creation. New demand reaches the provider through orders, messages, or community proposals. The provider manages the work and reviews its performance from the organization workspace.

## Product Areas

| Area                    | Current Capability                                                                                                                                                                    | Product Role                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Identity and onboarding | Authentication, user profiles, organization membership, customer, investor, company, and administrator account types.                                                                 | Gives recommendations and permissions the context they need.                  |
| Marketplace             | Service discovery, keyword and semantic search, profile-based recommendations, latest and popular listings, similar services, likes, reviews, and comparison for up to five services. | Helps buyers build and evaluate a shortlist.                                  |
| AI advisor              | Text chat, voice access, conversation history, suggested prompts, summaries, and problem-statement improvement.                                                                       | Helps a buyer move from uncertainty to a clearer next action.                 |
| Service catalog         | Organization profiles, service pages, API, MCP, SaaS, and custom service types, plans, pricing, features, and publishing status.                                                      | Gives providers a structured offer and buyers comparable information.         |
| Orders and delivery     | Order states, instructions, milestones, invoices, due dates, and buyer and provider workspaces.                                                                                       | Carries a match into an accountable engagement.                               |
| Payments                | Demo account balances, approved or declined demo payments, refunds, and invoice states. No real money moves.                                                                          | Validates the transaction experience before a production payment integration. |
| Messaging and calls     | Personal and organization rooms, real-time messages, attachments, conversation summaries, voice calls, video calls, and call history.                                                 | Keeps buyer and provider collaboration attached to the engagement.            |
| Community               | Posts, topics, follows, comments, likes, problem statements, proposals, and proposal decisions.                                                                                       | Lets demand emerge before a buyer knows which service to choose.              |
| Resources               | Grants, documentation, application links, eligibility criteria, processes, and organization-specific AI grant analysis.                                                               | Connects solution adoption with funding and implementation guidance.          |
| Provider analytics      | Revenue, recurring revenue, transaction count, average order value, top services, recent transactions, and AI insights.                                                               | Helps providers understand marketplace performance.                           |
| Notifications           | In-app and email notifications for order and platform activity.                                                                                                                       | Keeps time-sensitive work moving.                                             |

## Product Principles

### Match Business Intent

Search should understand the outcome a buyer wants, not only the words used in a listing. Recommendations must show enough context for the buyer to understand why an option is relevant.

### Make Trust Inspectable

Pricing, provider identity, experience, reviews, service details, and delivery terms should be visible before commitment. AI-generated confidence must never substitute for evidence.

### Keep The Handoff In One Place

Discovery is only useful if the buyer can act on it. Messaging, ordering, milestones, invoices, and reviews belong to the same engagement record.

### Give Both Sides Accountability

Buyers need clear status and deliverables. Providers need clear instructions, decisions, and payment state. Product changes should improve that shared record rather than favor one side at the other's expense.

### Preserve External Authority

Initiate can explain and recommend government resources, but the issuing body remains authoritative. Grant applications stay on the issuing body's official platform. Initiate helps users understand their options and reach the correct application page.

## What Makes Initiate Different

- The marketplace starts with a business problem, then uses semantic matching and an advisor to narrow the options.
- The product continues past discovery into provider communication, ordering, delivery tracking, and reviews.
- Community problems and proposals create a second path to a match when no existing listing fits.
- The resource center connects service adoption with grants and guidance instead of treating funding as a separate search task.

## Commercial Model

The proposed commercial model starts with a 10 percent transaction commission, later increasing to 12 percent, with advertising as a later revenue stream. These are unvalidated commercial hypotheses. The current product does not calculate commissions, display advertising, or process real payments.

Before launch, the team must decide the initial commission model, who pays it, when it is recognized, and how refunds, disputes, taxes, and provider payouts affect it.

## Success Measures

The main product outcome is a qualified match that progresses into a completed engagement. Targets remain to be set, but the product should measure:

- Median time from a buyer's stated need to a useful shortlist.
- Search-to-service-view, service-view-to-conversation, and conversation-to-order conversion.
- The share of new providers that publish at least one active service and plan.
- Order confirmation, completion, cancellation, dispute, and repeat-purchase rates.
- Buyer ratings, provider ratings, and repeat engagement between the same parties.
- The share of community problems that receive a qualified proposal.
- Grant analysis usage and clicks from a resource to its official application page.
- Provider response time and time spent in each delivery state.

## Current Boundaries

- Initiate is a web product. It does not have a native mobile client.
- Payments and refunds are simulated. The product must not claim that it moves or holds customer funds.
- Initiate does not submit or own government grant applications.
- Investment matching, crowdfunding, portfolio tracking, and equity transactions are outside the implemented product.
- Automated API-key creation, SaaS account provisioning, and provider-side deployment are planned workflow concepts, not current platform capabilities.
- Provider verification exists as a data attribute, but a complete vetting policy and operational workflow still need definition.

## Next Product Decisions

1. Choose whether the first market is specifically SME procurement of AI services or a broader startup, investor, and customer network. The current application is strongest in SME procurement.
2. Define what qualifies a provider and which credentials buyers should be able to verify.
3. Replace demo payments with a production transaction model, including commissions, payouts, refunds, disputes, and compliance.
4. Define match-quality signals and measure whether semantic recommendations lead to better conversations and completed orders.
5. Decide how negotiated work should become a structured plan, order, milestone schedule, and invoice set.
6. Expand the resource hub only where partner data is reliable and every recommendation can link back to an authoritative source.
7. Decide whether API and SaaS provisioning integrations belong in the first production release or after the managed-service workflow is proven.

## Open Questions

- Which geography and provider category should Initiate serve first?
- What minimum information must a buyer provide before the product can claim a match is qualified?
- What evidence earns provider verification, and who reviews it?
- Does Initiate guarantee any part of delivery, or does it only provide marketplace and workflow tools?
- Which party pays the platform fee, and at what point in the order lifecycle?
- How should the product handle custom quotes that do not fit a published plan?
- Which community behaviors improve marketplace outcomes, and which create noise or moderation risk?
- What partner agreements are required before government or institutional resources can be personalized?
