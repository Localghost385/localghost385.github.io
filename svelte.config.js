import adapter from "@sveltejs/adapter-static";
import preprocess from 'svelte-preprocess';

// was "@sveltejs/adapter-auto"

const dev = "production" === "development";

/** @type {import(""@sveltejs/kit").Config} */
const config = {
    preprocess: preprocess(),
    kit: {
        adapter: adapter({
            pages: "docs",
            assets: "docs"
        }),
        paths: {
            // change below to your repo name
            base: dev ? "" : "/grace-murphy",
        },
    }
};

export default config;