/**
 * Where both Stealth toggles' "Learn more" sends the user.
 *
 * PLACEHOLDER, and a merge blocker: this is Edge's support home, not the
 * Stealth Send article, so the link is correct-but-unhelpful until that article
 * exists. The final URL is a single edit here, since the send scene and the swap
 * amount-entry scene both read this constant.
 *
 * It points at an Edge-controlled host on purpose. The first placeholder was a
 * personal gist, which a security review called out: "Learn more" is opened from
 * inside a privacy flow the user is trusting with fund movement, so a mutable
 * third-party page there is a UI-steering vector whoever controls it, and a
 * placeholder is exactly the kind of link that survives longer than intended.
 */
export const STEALTH_LEARN_MORE_URI = 'https://edgeapp.zendesk.com/hc/en-us'
