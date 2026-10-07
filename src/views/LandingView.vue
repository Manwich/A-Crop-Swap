<template>
    <section class="hero">
        <div class="hero__inner">
            <p class="eyebrow">Your neighborhood harvest exchange</p>
            <h1 class="hero__title">
                Give fruit today.<br />
                <span>Redeem it when it ripens.</span>
            </h1>
            <p class="hero__lead">
                A Crop Swap is where neighbors trade backyard fruit and handmade goods. Every gift earns a credit,
                and credits let you reserve a share of next month's harvest from the tree down the street.
            </p>
            <div class="hero__actions">
                <template v-if="session.user">
                    <RouterLink to="/home" class="btn btn--primary">Go to the Backyard Feed</RouterLink>
                    <RouterLink to="/post" class="btn btn--outline">Post a listing</RouterLink>
                </template>
                <template v-else>
                    <RouterLink to="/signup" class="btn btn--primary">Join your neighbors</RouterLink>
                    <RouterLink to="/login" class="btn btn--outline">Log in</RouterLink>
                </template>
            </div>
        </div>
    </section>

    <section id="how-it-works" class="section">
        <div class="section__inner">
            <h2 class="section__title">What you can do here</h2>
            <div class="features">
                <article v-for="f in features" :key="f.title" class="feature">
                    <div class="feature__icon" aria-hidden="true">{{ f.icon }}</div>
                    <h3>{{ f.title }}</h3>
                    <p>{{ f.body }}</p>
                </article>
            </div>
        </div>
    </section>

    <section class="section section--alt">
        <div class="section__inner credits">
            <div>
                <h2 class="section__title section__title--left">How credits work</h2>
                <p class="muted">One flat credit per trade. No prices, no haggling.</p>
            </div>
            <ol class="steps">
                <li>
                    <strong>Give something away.</strong>
                    When you and the neighbor receiving it both confirm the handoff, you earn 1 credit.
                </li>
                <li>
                    <strong>Spot a harvest that isn't ripe yet.</strong>
                    Reserve it for 1 credit, so it's held for you.
                </li>
                <li>
                    <strong>Pick it up when it's ready.</strong>
                    The grower marks it ready, you both confirm pickup, and you're done.
                </li>
                <li>
                    <strong>Never ripened? No loss.</strong>
                    If a reservation is cancelled, your credit comes straight back.
                </li>
            </ol>
        </div>
    </section>

    <section v-if="!session.user" class="section cta">
        <div class="section__inner">
            <h2>That lemon tree is about to drop another hundred lemons.</h2>
            <p class="muted">Sign up free and start trading with your neighbors.</p>
            <div class="hero__actions">
                <RouterLink to="/signup" class="btn btn--primary">Create an account</RouterLink>
                <RouterLink to="/login" class="btn btn--outline">I already have one</RouterLink>
            </div>
        </div>
    </section>
</template>

<script setup>
import { session } from '../lib/session.js';

const features = [
    {
        icon: '🍋',
        title: 'Share what grows',
        body: 'Post backyard fruit that is ready now, or a harvest that is still ripening on the branch.',
    },
    {
        icon: '🧺',
        title: 'Trade handmade goods',
        body: 'Jam, bread, knitted scarves, seedlings. Anything you make by hand can be swapped too.',
    },
    {
        icon: '🌱',
        title: 'Reserve future harvests',
        body: 'Spend a credit to hold a share of fruit that is not ripe yet, and collect it when it is.',
    },
];
</script>

<style scoped>
.hero {
    background: linear-gradient(180deg, var(--hero-from), var(--hero-to));
    border-bottom: 1px solid var(--line);
}
.hero__inner {
    max-width: 760px;
    margin: 0 auto;
    padding: clamp(3.5rem, 10vw, 6.5rem) 1rem;
    text-align: center;
}
.eyebrow {
    display: inline-block;
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--brand-strong);
    background: var(--brand-soft);
    padding: 0.25rem 0.75rem;
    border-radius: 999px;
    margin-bottom: 1.25rem;
}
.hero__title {
    font-size: clamp(2.25rem, 6vw, 3.5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: 1.25rem;
}
.hero__title span {
    color: var(--brand);
}
.hero__lead {
    font-size: 1.125rem;
    color: var(--ink-muted);
    max-width: 600px;
    margin: 0 auto 2rem;
}
.hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
}

.section {
    padding: clamp(3rem, 8vw, 5rem) 1rem;
    background: var(--surface);
}
.section--alt {
    background: var(--surface-alt);
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
}
.section__inner {
    max-width: var(--page-width);
    margin: 0 auto;
}
.section__title {
    text-align: center;
    font-size: clamp(1.5rem, 3.5vw, 2rem);
    margin-bottom: 2rem;
}
.section__title--left {
    text-align: left;
    margin-bottom: 0.5rem;
}

.features {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.feature {
    padding: 1.5rem;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
}
.feature__icon {
    font-size: 2rem;
    width: 56px;
    height: 56px;
    display: grid;
    place-items: center;
    background: var(--brand-soft);
    border-radius: var(--radius);
    margin-bottom: 1rem;
}
.feature p {
    color: var(--ink-muted);
    margin: 0;
}

.credits {
    display: grid;
    gap: 2rem;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
    align-items: start;
}
.steps {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: step;
    display: grid;
    gap: 0.875rem;
}
.steps li {
    counter-increment: step;
    position: relative;
    padding: 1rem 1.125rem 1rem 3.5rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    color: var(--ink-muted);
}
.steps li::before {
    content: counter(step);
    position: absolute;
    left: 1rem;
    top: 1rem;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--brand);
    color: var(--on-brand);
    font-weight: 700;
    font-size: 0.875rem;
}
.steps strong {
    display: block;
    color: var(--ink);
}

.cta {
    text-align: center;
}
.cta h2 {
    max-width: 640px;
    margin: 0 auto 0.75rem;
    font-size: clamp(1.375rem, 3vw, 1.75rem);
}

@media (max-width: 720px) {
    .credits {
        grid-template-columns: 1fr;
    }
}
</style>
