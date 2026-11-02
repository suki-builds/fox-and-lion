# Roadmap

Features that have been discussed and planned but not built yet. Move an item
out of this file once it ships.

## Guest commenting

Let readers comment without signing up. Comments currently need an account.

- A comment form that takes a display name and no account.
- Automatic spam and profanity filters. Anything they catch is flagged for
  review.
- Decide before building: whether flagged comments stay hidden until reviewed,
  and who reviews them.

## LinkedIn login

Add "Sign in with LinkedIn" next to the Google button. About an hour, most of
it setup.

1. In the LinkedIn developer portal, create an app tied to the Fox and Lion
   Company Page.
2. Add the product "Sign In with LinkedIn using OpenID Connect" (free).
3. Add the Supabase callback URL as an allowed redirect.
4. In Supabase, go to Authentication > Providers > LinkedIn (OIDC) and paste in
   the Client ID and Secret.
5. In the code, add a button like `components/GoogleSignInButton.js` using
   provider `linkedin_oidc`, and show it in `components/SignInForm.js`.

Notes:

- LinkedIn gives name, email and photo only, not job title or employer.
- Accounts with the same email on Google and LinkedIn merge automatically. A
  different email creates a separate account.

## Shop and subscriptions

Sell merch, stationery, physical issues and subscriptions through Stripe,
without a separate Shopify store. Customers pay on Stripe's hosted checkout
page.

| Phase | Work | Effort |
|---|---|---|
| 0 | Stripe Payment Link for one product, such as a pre-order of Issue 1. No code. | About an hour |
| 1 | `/shop` pages, `/api/checkout`, `/api/stripe/webhook`, orders saved to Supabase | 1–2 days |
| 2 | Subscriptions, Stripe Customer Portal, "Manage subscription" link on `/account` | About 1 day |
| 3 | Basket, stock counts, print-on-demand, Stripe Tax | As needed |

How it fits together:

- **Stripe:** holds products, prices, shipping rates and the Customer Portal.
- **Prismic:** a new "Product" type with title, images, description, Stripe
  price ID and a sold-out switch.
- **Supabase:** new `orders`, `order_items` and `subscriptions` tables, filled
  by the webhook.

Needed before taking real money:

- Vercel Pro. The Hobby plan is non-commercial only.
- Terms of sale and a returns page, covering the 14-day UK cancellation right.
- A privacy policy line naming Stripe as payment processor.
- Stripe Tax near the VAT threshold, or sooner if selling to the EU.

Decisions needed:

1. First product list and rough prices.
2. Which countries to ship to.
3. What a subscription is: print issues, supporter membership, or paid access
   to articles.
4. Pack orders in-house or use print-on-demand.

## Most Discussed tab

Add a "Most Discussed" tab beside "Most Popular" on the homepage
(`components/MostPopular.js`). The box was built with a second tab in mind.
