import Parser from "rss-parser"
import { parse as parseHTML } from 'node-html-parser'
import fs from 'fs'
const parser = new Parser()

const internalMemory = {}
let rss_algorithm
let rss_summarization

export default {
    functions: {
        get_rss: async function (args) {
            const maxContext = args.context || 4000
            console.log(`RSS: Max tokens set to ${maxContext}`)
            rss_algorithm = args.algorithm

            if (rss_algorithm) {
                console.log("RSS: Using TF-IDF")
                rss_summarization = 50
            } else {
                console.log("RSS: Using basic")
                rss_summarization = 4000
            }

            if (!args.update) {
                if (internalMemory.rss_feed != null) {
                    console.log("RSS Found on memory")
                    const compressed_feed_str = JSON.stringify(internalMemory.rss_feed)
                    console.log(`RSS Estimated Token Count: ${compressed_feed_str.length / 4} (compressed)`)
                    return compressed_feed_str
                }
                console.log("RSS: Fetching...")
            } else {
                console.log("RSS: Update forced")
            }

            const source = "https://alistapart.com/main/feed/"
            const parsed_rss = await parser.parseURL(source)
            

            do {
                const compressed_articles = parsed_rss.items.map(internalFunctions.cleanArticle)
                const compressed_feed = {
                    source: source,
                    items: compressed_articles,
                    algorithm: rss_algorithm
                }
                const compressed_feed_str = JSON.stringify(compressed_feed)
                if (compressed_feed_str.length / 4 > maxContext) {
                    const factor = (maxContext / (compressed_feed_str.length / 4)) * 0.95
                    console.log(`RSS: Exceeded token limit (${compressed_feed_str.length / 4}), factor: ${factor}`)
                    rss_summarization = Math.floor(rss_summarization * factor)
                    continue;
                }
                internalMemory.rss_feed = compressed_feed
                console.log(`RSS Estimated Token Count: ${compressed_feed_str.length / 4} (compressed)`)
                return compressed_feed_str
            } while (true)
        }
    },
    config: [
        {
            type: 'function',
            function: {
                name: 'get_rss',
                description: 'Get the newest RSS Feed',
                parameters: {
                    type: 'object',
                    properties: {
                        algorithm: {
                            type: 'boolean',
                            description: 'Must be JSON boolean. If true a variation of the TF-IDF algorithm is used to summarize the article content, if false only the first 400 words of each article will be sent.'
                        },
                        update: {
                            type: 'boolean',
                            description: "Must be JSON boolean. If true it will force a feed update, if false it will retrieve the newest feed from memory if possible (faster)."
                        },
                        context: {
                            type: 'number',
                            description: "Must be JSON number. A integer that defines the maximum amount of tokens that should be sent as response, default is 4000."
                        }
                    },
                    required: ['algorithm', 'update']
                }
            }
        }
    ],
    hasContext: {
        get_temperature: true,
        get_rss: false
    }
}

const internalFunctions = {
    cleanArticle: function (item) {
        const raw     = item.content ?? item.contentSnippet ?? item.description ?? "";
        const text    = internalFunctions.stripHTML(raw);

        // Keep first 400 words — enough context for the model, not the whole article
        const snippet = rss_algorithm ? internalFunctions.extractKeySentences(text, rss_summarization) : text.split(" ").slice(0, rss_summarization).join(" ");

        return {
            title:   item.title.replace(/\t|\n/g, '')   ?? "(no title)",
            link:    item.link.replace(/\t|\n/g, '')    ?? "",
            snippet
        };
    },
    stripHTML: function (raw) {
        return parseHTML(raw)
            .text                      // plain text, entities decoded (&amp; → &)
            .replace(/\s+/g, " ")      // collapse whitespace
            .trim();
    },
    extractKeySentences: function (text, maxSentences = 10) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        
        // word frequency map
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);

        // score each sentence by its words' frequencies
        const scored = sentences.map(s => ({
            text: s.trim(),
            score: s.toLowerCase().match(/\b\w+\b/g)
            ?.reduce((sum, w) => sum + (freq[w] || 0), 0) ?? 0
        }));

        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .map(s => s.text)
            .join(" ");
    }
}