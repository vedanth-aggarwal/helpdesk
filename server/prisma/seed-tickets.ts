import "dotenv/config";
import { prisma } from "../src/db";
import type { Prisma } from "../src/generated/prisma/client";

type Category = "GENERAL_QUESTION" | "TECHNICAL_QUESTION" | "REFUND_REQUEST" | null;
type Status = "OPEN" | "RESOLVED" | "CLOSED";

interface Requester {
  name: string;
  email: string;
}

const requesters: Requester[] = [
  { name: "Sam Rivera", email: "sam.rivera@gmail.com" },
  { name: "Jane Doe", email: "jane.doe@outlook.com" },
  { name: "Priya Patel", email: "priya.patel@brightpathlogistics.com" },
  { name: "Marcus Chen", email: "marcus.chen@yahoo.com" },
  { name: "Aaliyah Johnson", email: "aaliyah.johnson@gmail.com" },
  { name: "Diego Fernandez", email: "diego.fernandez@acmehardware.com" },
  { name: "Emily Carter", email: "emily.carter@icloud.com" },
  { name: "Noah Williams", email: "noah.williams@northstarmfg.com" },
  { name: "Olivia Martin", email: "olivia.martin@gmail.com" },
  { name: "Liam O'Brien", email: "liam.obrien@outlook.com" },
  { name: "Sofia Rossi", email: "sofia.rossi@harborviewrealty.com" },
  { name: "Ethan Brooks", email: "ethan.brooks@gmail.com" },
  { name: "Grace Kim", email: "grace.kim@yahoo.com" },
  { name: "Benjamin Clarke", email: "ben.clarke@summitconsulting.com" },
  { name: "Hannah Lee", email: "hannah.lee@gmail.com" },
  { name: "Lucas Silva", email: "lucas.silva@outlook.com" },
  { name: "Isabella Novak", email: "isabella.novak@brightpathlogistics.com" },
  { name: "Mason Turner", email: "mason.turner@gmail.com" },
  { name: "Chloe Anderson", email: "chloe.anderson@icloud.com" },
  { name: "Ryan Murphy", email: "ryan.murphy@acmehardware.com" },
  { name: "Zoe Campbell", email: "zoe.campbell@gmail.com" },
  { name: "Nathan Cooper", email: "nathan.cooper@yahoo.com" },
  { name: "Mia Torres", email: "mia.torres@harborviewrealty.com" },
  { name: "Alexander Reid", email: "alex.reid@gmail.com" },
  { name: "Ava Mitchell", email: "ava.mitchell@outlook.com" },
  { name: "Jacob Foster", email: "jacob.foster@northstarmfg.com" },
  { name: "Lily Nguyen", email: "lily.nguyen@gmail.com" },
  { name: "Daniel Ross", email: "daniel.ross@summitconsulting.com" },
  { name: "Ella Fitzgerald", email: "ella.fitzgerald@gmail.com" },
  { name: "Henry Wallace", email: "henry.wallace@yahoo.com" },
  { name: "Amara Okafor", email: "amara.okafor@icloud.com" },
  { name: "Owen Bennett", email: "owen.bennett@gmail.com" },
  { name: "Layla Hassan", email: "layla.hassan@outlook.com" },
  { name: "Caleb Morgan", email: "caleb.morgan@acmehardware.com" },
  { name: "Nora Jensen", email: "nora.jensen@gmail.com" },
  { name: "Wyatt Perry", email: "wyatt.perry@brightpathlogistics.com" },
  { name: "Victoria Adams", email: "victoria.adams@gmail.com" },
  { name: "Julian Scott", email: "julian.scott@yahoo.com" },
  { name: "Penelope Diaz", email: "penelope.diaz@northstarmfg.com" },
  { name: "Gabriel Reyes", email: "gabriel.reyes@gmail.com" },
];

const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
const plans = ["Starter", "Pro", "Business", "Enterprise"];
const orderNumbers = [
  "48213", "51890", "39044", "60712", "27655", "44981", "33120", "58847",
  "41256", "36790", "52108", "29663", "47530", "38294", "55617", "31882",
];

function randomOf<T>(arr: readonly T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (item === undefined) throw new Error("empty array");
  return item;
}

function daysAgo(days: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Weighted status pick: mostly resolved/closed for older tickets, mostly open for recent ones,
// so sorting by status/createdAt together shows a realistic mix rather than pure randomness.
function statusForAge(days: number): Status {
  const r = Math.random();
  if (days < 3) return r < 0.75 ? "OPEN" : r < 0.9 ? "RESOLVED" : "CLOSED";
  if (days < 14) return r < 0.35 ? "OPEN" : r < 0.75 ? "RESOLVED" : "CLOSED";
  return r < 0.1 ? "OPEN" : r < 0.4 ? "RESOLVED" : "CLOSED";
}

interface TicketSeed {
  subject: string;
  body: string;
  category: Category;
}

const generalQuestions: TicketSeed[] = [
  { subject: "How do I reset my password?", body: "I forgot my password and the reset email never arrived. Can someone help me regain access to my account?" },
  { subject: "What are your business hours?", body: "I'd like to know what hours your support team is available, including weekends and holidays." },
  { subject: "Do you ship internationally?", body: "I'm based in Canada - can I place an order and have it shipped there? What are the delivery times?" },
  { subject: "How do I change my billing address?", body: "My company moved offices and I need to update the billing address on file before the next invoice goes out." },
  { subject: "What payment methods do you accept?", body: "Do you accept ACH transfers or only credit cards? We'd prefer to pay by bank transfer for our annual plan." },
  { subject: "How do I cancel my subscription?", body: "I want to cancel my subscription before the next renewal date. Can you walk me through the steps?" },
  { subject: "Can I get an invoice for my last purchase?", body: "Our accounting team needs a formal invoice for the payment made last month. Could you send one over?" },
  { subject: "How do I update the email on my account?", body: "I switched jobs and need to update the email address associated with my account to my new one." },
  { subject: "Where can I download my receipt?", body: "I can't find a way to download receipts from the billing page. Is there somewhere else to look?" },
  { subject: "What is your return policy?", body: "Before I place a larger order I wanted to check what your return window and policy look like." },
  { subject: "Can I add more seats to my plan?", body: "We're growing the team and need to add 5 more seats to our current plan. How does billing work for that?" },
  { subject: "How do I export my data?", body: "I need a full export of our account data for an internal audit. What formats are supported?" },
  { subject: "Do you offer a student discount?", body: "I'm a student and was wondering if there's a discounted plan available for individual use." },
  { subject: "How do I add a second admin to the account?", body: "I want to give my colleague admin access as a backup in case I'm out of office." },
  { subject: "Is there a mobile app available?", body: "I use the web dashboard daily and was wondering if there's a mobile app for iOS or Android." },
  { subject: "How do I switch from monthly to annual billing?", body: "We'd like to switch our plan to annual billing to take advantage of the discount. How do we do that?" },
  { subject: "Can I get a demo before upgrading?", body: "Before we upgrade to the Business plan, is it possible to get a walkthrough of the extra features?" },
  { subject: "What happens to my data if I downgrade?", body: "If we downgrade from Pro to Starter, will we lose any historical data or reports?" },
  { subject: "How do I set up two-factor authentication?", body: "I'd like to enable 2FA on my account for extra security but can't find the setting." },
  { subject: "Do you have an API for integrations?", body: "We want to connect this to our internal tools - is there a public API and documentation available?" },
  { subject: "Can I change my company name on the account?", body: "We recently rebranded and need the company name updated across our invoices and account." },
  { subject: "How long is your free trial?", body: "I'm evaluating a few options for my team - how many days does the free trial last and does it require a card?" },
  { subject: "Where do I find my account ID?", body: "Support asked me for my account ID in a previous ticket but I can't find where that's listed." },
  { subject: "Can I pause my subscription instead of cancelling?", body: "We're going through a slow season - is there an option to pause billing instead of fully cancelling?" },
  { subject: "How do I transfer ownership of the account?", body: "I'm leaving the company and need to transfer account ownership to my manager before my last day." },
];

const technicalQuestions: TicketSeed[] = [
  { subject: "App crashes on startup after the latest update", body: "Since updating to the newest version, the app crashes immediately on launch on my {browser} browser. Clearing cache didn't help." },
  { subject: "Unable to log in - getting a 500 error", body: "Every time I try to log in I get a server error page. I've tried resetting my password but the issue persists." },
  { subject: "API returns 401 even with a valid token", body: "Our integration started failing overnight with 401 Unauthorized responses even though the API token hasn't changed." },
  { subject: "Dashboard charts not loading in {browser}", body: "The analytics charts on the dashboard just show a spinner forever when I use {browser}. Works fine in other browsers though." },
  { subject: "Two-factor authentication code never arrives", body: "I enabled 2FA and now the SMS code never arrives when I try to log in, so I'm locked out of my account." },
  { subject: "Export to CSV button is unresponsive", body: "Clicking the export button on the reports page does nothing - no download, no error message, nothing happens." },
  { subject: "Integration with Slack keeps disconnecting", body: "Our Slack integration disconnects every day or two and we have to manually reconnect it each time." },
  { subject: "Mobile app won't sync with the desktop version", body: "Changes I make on the desktop app don't show up on my phone until I force-quit and reopen the mobile app." },
  { subject: "Getting a blank page after login on {browser}", body: "After entering my credentials the page just goes blank instead of loading the dashboard on {browser}." },
  { subject: "Webhook events are not being delivered", body: "We stopped receiving webhook events three days ago with no changes on our end. Can you check the delivery logs?" },
  { subject: "SSO login redirects to an error page", body: "When our employees try to log in via SSO they get redirected to a generic error page instead of the dashboard." },
  { subject: "File uploads fail for files over 10MB", body: "Any file I try to upload larger than about 10MB fails silently. Smaller files upload without any issue." },
  { subject: "Search results are not updating in real time", body: "When I add a new record it doesn't show up in search results until I manually refresh the whole page." },
  { subject: "Dark mode toggle resets on every page load", body: "I switch to dark mode but it reverts back to light mode every time I navigate to a different page." },
  { subject: "API rate limit errors during normal usage", body: "We're getting 429 rate limit errors even though our request volume hasn't changed from last month." },
  { subject: "Push notifications stopped working after iOS update", body: "Since updating my iPhone, I no longer receive push notifications from the app even though they're enabled in settings." },
  { subject: "Calendar sync is duplicating events", body: "Every event from our synced calendar is showing up twice in the app. This started a few days ago." },
  { subject: "Password reset link expires immediately", body: "The password reset link in the email says it's expired the moment I click it, even seconds after receiving it." },
  { subject: "Report generation times out for large datasets", body: "Generating a report for our full year of data always times out. Smaller date ranges work fine." },
  { subject: "Custom domain SSL certificate not renewing", body: "Our custom domain's SSL certificate expired and the automatic renewal doesn't seem to have kicked in." },
  { subject: "Bulk import fails with a generic error", body: "Uploading our CSV of 500 contacts fails with 'something went wrong' and no further detail in the error." },
  { subject: "Timezone settings not being respected", body: "All timestamps in the app are showing in UTC instead of the timezone I configured in my profile settings." },
  { subject: "Keyboard shortcuts stopped working", body: "The keyboard shortcuts for navigating between tickets used to work but stopped after the last release." },
  { subject: "Attachments disappear after being uploaded", body: "I attach a file to a ticket, it uploads successfully, but then it's gone when I reload the page." },
  { subject: "Session logs me out every few minutes", body: "I keep getting logged out roughly every 5 minutes even though I'm actively using the app." },
  { subject: "Copy-paste from Excel breaks table formatting", body: "Pasting a table from Excel into the notes field scrambles the formatting and merges unrelated columns." },
  { subject: "Notifications are delayed by several hours", body: "I'm receiving email notifications about new tickets 3-4 hours after they were actually created." },
  { subject: "Cannot delete an old integration", body: "There's an old, unused integration in our settings that I can't remove - the delete button just spins forever." },
  { subject: "Broken image icons throughout the settings page", body: "Every icon on the account settings page is showing as a broken image placeholder since this morning." },
  { subject: "Custom fields not saving on ticket detail page", body: "I fill in a custom field value on a ticket, hit save, but the value reverts back to blank on reload." },
  { subject: "Login page stuck on infinite loading spinner", body: "The login page just shows a spinner and never loads the form, tried on {browser} and on my phone." },
  { subject: "Data export missing several columns", body: "When I export tickets to CSV, the category and status columns are missing from the file entirely." },
  { subject: "App unusably slow since the last update", body: "Every page takes 10+ seconds to load since updating - it was fast just yesterday." },
  { subject: "Duplicate tickets created from a single email", body: "One customer email seems to have created three identical tickets in our system instead of just one." },
  { subject: "Cannot upload a profile picture", body: "Every time I try to upload a profile photo I get an 'unsupported format' error even with a standard JPEG." },
  { subject: "Filters reset every time I switch tabs", body: "Any filters I apply to the tickets list reset back to default the moment I switch to another browser tab and back." },
  { subject: "Billing page shows the wrong plan name", body: "My billing page says I'm on the Starter plan, but I upgraded to {plan} weeks ago and I'm being charged the higher rate." },
  { subject: "Emails from support are landing in spam", body: "All notification emails from your support team are going straight to our spam folder, even after marking as not spam." },
  { subject: "Cannot reorder columns in the tickets table", body: "Dragging a column header to reorder the tickets table doesn't do anything - the columns stay in the same order." },
  { subject: "Account locked after too many failed login attempts", body: "I mistyped my password a few times and now my account says it's locked, with no instructions on how to unlock it." },
];

const refundRequests: TicketSeed[] = [
  { subject: "Requesting a refund for order #{order}", body: "I'd like to request a full refund for order #{order} - the product didn't meet my expectations." },
  { subject: "Charged twice for the same subscription", body: "I was billed twice this month for the same {plan} subscription. Please refund the duplicate charge." },
  { subject: "Refund request - product not as described", body: "The item I received for order #{order} doesn't match the description on the listing at all. I'd like a refund." },
  { subject: "Refund for accidental annual upgrade", body: "I accidentally clicked upgrade to annual billing instead of staying monthly. Could you refund the difference?" },
  { subject: "Please refund my last invoice, cancelled before renewal", body: "I cancelled my plan before the renewal date but was still charged for the next cycle. Requesting a refund." },
  { subject: "Refund request due to service outage last week", body: "Given the outage last week that lasted almost two days, I'd like a partial refund for that period." },
  { subject: "Double billed this month, need a refund", body: "My card statement shows two identical charges for order #{order} this month. Please refund one of them." },
  { subject: "Refund needed - duplicate purchase", body: "I accidentally purchased the same {plan} plan twice within a few minutes. Please refund the second charge." },
  { subject: "Unhappy with product, requesting money back", body: "After using it for a week, this just isn't working for our team. We'd like a refund on order #{order}." },
  { subject: "Refund request for unused seats", body: "We downsized the team and have 4 unused seats left on our {plan} plan. Can we get a prorated refund?" },
  { subject: "Refund for order #{order} that never arrived", body: "It's been three weeks and order #{order} still hasn't arrived. I'd like a refund instead of waiting longer." },
  { subject: "Wrong item charged, requesting refund", body: "I was charged for the {plan} plan but signed up for a lower tier. Please refund the price difference." },
  { subject: "Refund request after downgrading mid-cycle", body: "I downgraded from {plan} to a lower plan mid-billing-cycle and expected a prorated refund that I haven't seen." },
  { subject: "Requesting refund - didn't authorize this charge", body: "There's a charge on my card for order #{order} that I don't recognize authorizing. Please refund it." },
  { subject: "Refund request for a defective shipment", body: "The items in order #{order} arrived damaged. I'd rather have a refund than a replacement at this point." },
  { subject: "Billing error - charged after cancellation confirmed", body: "I received a cancellation confirmation email but was still charged the next month. Please refund and confirm cancellation." },
  { subject: "Refund for trial that converted without warning", body: "My free trial converted to a paid {plan} subscription without any warning email. I'd like a full refund." },
  { subject: "Requesting refund for order #{order} - wrong size", body: "The size I ordered doesn't match what arrived for order #{order}. I'd prefer a refund over an exchange." },
  { subject: "Refund request - service never activated", body: "I paid for the {plan} upgrade over a week ago but the features still haven't been activated on our account." },
  { subject: "Accidental purchase, requesting immediate refund", body: "I meant to add this to my cart for later but it went through as a purchase immediately. Please refund order #{order}." },
];

function fill(template: string): string {
  return template
    .replace(/\{browser\}/g, randomOf(browsers))
    .replace(/\{plan\}/g, randomOf(plans))
    .replace(/\{order\}/g, randomOf(orderNumbers));
}

function buildTickets(): Prisma.TicketCreateManyInput[] {
  const pools: { seeds: TicketSeed[]; count: number; category: Category }[] = [
    { seeds: generalQuestions, count: 25, category: "GENERAL_QUESTION" },
    { seeds: technicalQuestions, count: 40, category: "TECHNICAL_QUESTION" },
    { seeds: refundRequests, count: 20, category: "REFUND_REQUEST" },
    // Uncategorized: reuses a mix of templates across all three pools with category left
    // null, mirroring the real app behavior where nothing classifies tickets automatically yet.
    { seeds: [...generalQuestions, ...technicalQuestions, ...refundRequests], count: 15, category: null },
  ];

  const tickets: Prisma.TicketCreateManyInput[] = [];
  let dayOffset = 0;

  for (const pool of pools) {
    for (let i = 0; i < pool.count; i++) {
      const seed = pool.seeds[i % pool.seeds.length];
      if (!seed) continue;
      const requester = randomOf(requesters);
      dayOffset += Math.floor(Math.random() * 4); // spread unevenly across ~150 days total
      const createdAt = daysAgo(dayOffset, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      tickets.push({
        subject: fill(seed.subject),
        body: fill(seed.body),
        requesterName: requester.name,
        requesterEmail: requester.email,
        status: statusForAge(dayOffset),
        category: pool.category,
        createdAt,
      });
    }
  }

  return tickets;
}

async function main() {
  const tickets = buildTickets();
  const { count } = await prisma.ticket.createMany({ data: tickets });
  console.log(`Created ${count} tickets.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
