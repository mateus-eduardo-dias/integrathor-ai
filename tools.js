import Parser from "rss-parser"
import { parse as parseHTML } from 'node-html-parser'
import fs from 'fs'
import { createHash } from "crypto"
const parser = new Parser()

let rss_algorithm

export default {
    functions: {
        get_temperature: function (args) {
            let parsed_args = JSON.parse(args)
            return JSON.stringify({city: parsed_args.city, temperature: 22, unit: 'Celsius'})
        },
        get_rss: async function (args) {
            let parsed_args = JSON.parse(args)
            let parsed = await parser.parseURL("https://alistapart.com/main/feed/")
            
            
            fs.writeFileSync('./test-uncompressed.json', JSON.stringify(parsed, null, 2))
            console.log(parsed_args)
            rss_algorithm = parsed_args.algorithm
            let compressed = parsed.items.map(internalFunctions.cleanArticle)
            fs.writeFileSync('./test-compressed.json', JSON.stringify(compressed, null, 2))
            console.log(JSON.stringify(compressed).length / 4)
            return JSON.stringify({information: 'no feed was found, come back after some hours', status: 404});
        }
    },
    config: [
        {
            type: 'function',
            function: {
                name: 'get_temperature',
                description: 'Get the temperature of a certain city',
                parameters: {
                    type: 'object',
                    properties: {
                        city: {
                            type: 'string',
                            description: 'City name'
                        },
                    },
                    required: ['city']
                }
            }
        },
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
                            description: 'If true the TF-IDF algorithm is used, if false only the first 400 words of each article will be sent.'
                        },
                        update: {
                            type: 'boolean',
                            description: "If true it will force a update, if not it will retrieve the newest feed from memory"
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
        const snippet = rss_algorithm ? internalFunctions.extractKeySentences(text, 20) : text.split(" ").slice(0, 400).join(" ");

        // Fingerprint: SHA-256 of title + first 100 chars of snippet
        // Same article polled tomorrow → same hash → skip it
        const hash = createHash("sha256")
        .update(item.title + snippet.slice(0, 100))
        .digest("hex");

        return {
            title:   item.title   ?? "(no title)",
            link:    item.link    ?? "",
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