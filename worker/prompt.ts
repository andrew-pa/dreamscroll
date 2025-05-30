import WordPOS from "wordpos";

// ---------------------------------------------------------------------------
// Internal AST for the parsed template
// ---------------------------------------------------------------------------
type TemplateToken =
    | { kind: "literal"; text: string }
    | { kind: "placeholder"; key: string; count: number; random: boolean };

// ---------------------------------------------------------------------------
// Public definitions
// ---------------------------------------------------------------------------
export interface PromptDef {
    template: string;
    choices?: Record<string, string[]>;
}

/**
 * Compiled prompt that can be sampled efficiently.
 *
 * Features added in this revision
 * --------------------------------
 * • `{noun}`, `{verb}`, `{adjective}`, `{adverb}` placeholders backed by the
 *   *wordpos* dictionary – chosen with WordPOS's **random** APIs, not by
 *   loading the full list.
 * • Extensible default registry via `Prompt.registerDefaultChoice()`.
 */
export class Prompt {
    // -------------------------------------------------------------------------
    // Static: default provider registry
    // -------------------------------------------------------------------------
    private static defaultChoiceProviders: Record<
        string,
        (count: number) => Promise<string[]>
    > = {};

    /**
     * Register (or replace) a default provider.
     *
     * The provider **must** return at least `count` strings (duplicates allowed
     * if the underlying source cannot guarantee uniqueness).
     */
    static registerDefaultChoice(
        key: string,
        provider: (count: number) => Promise<string[]>,
    ) {
        Prompt.defaultChoiceProviders[key] = provider;
    }

    // -------------------------------------------------------------------------
    // Instance state
    // -------------------------------------------------------------------------
    private readonly tokens: TemplateToken[];
    private readonly explicitChoices: Record<string, string[]>;

    constructor(def: PromptDef) {
        if (!def.template || typeof def.template !== "string") {
            throw new TypeError(
                "PromptDef.template must be a non‑empty string",
            );
        }

        this.tokens = Prompt.parseTemplate(def.template);
        this.explicitChoices = def.choices ?? {};

        // Early validation: every placeholder must be satisfiable
        for (const tok of this.tokens) {
            if (tok.kind !== "placeholder") continue;

            if (
                !(tok.key in this.explicitChoices) &&
                !(tok.key in Prompt.defaultChoiceProviders)
            ) {
                throw new Error(
                    `No choices supplied (explicit or default) for key "${tok.key}"`,
                );
            }

            if (
                tok.key in this.explicitChoices &&
                this.explicitChoices[tok.key].length < tok.count
            ) {
                throw new Error(
                    `Placeholder "${tok.key}" requests ${tok.count} option(s) ` +
                        `but only ${this.explicitChoices[tok.key].length} given`,
                );
            }
        }
    }

    // -------------------------------------------------------------------------
    // Public: generate N prompts
    // -------------------------------------------------------------------------
    async sample(n: number): Promise<string[]> {
        if (!Number.isInteger(n) || n <= 0) {
            throw new RangeError("`n` must be a positive integer");
        }

        const out: string[] = [];
        for (let i = 0; i < n; i++) {
            out.push(await this.renderOnce());
        }
        return out;
    }

    // -------------------------------------------------------------------------
    // PRIVATE: single prompt rendering
    // -------------------------------------------------------------------------
    private async renderOnce(): Promise<string> {
        let result = "";

        for (const tok of this.tokens) {
            if (tok.kind === "literal") {
                result += tok.text;
                continue;
            }

            // Placeholder ---------------------------------------------------------
            const { key, count, random } = tok;
            const actualCount = random
                ? Math.floor(Math.random() * (count + 1))
                : count;

            if (key in this.explicitChoices) {
                // User‑provided list
                const pool = this.explicitChoices[key];
                result +=
                    actualCount === 1
                        ? Prompt.pickOne(pool)
                        : Prompt.pickMany(pool, actualCount).join(", ");
            } else {
                if (actualCount > 0) {
                    const provider = Prompt.defaultChoiceProviders[key];
                    const words = await provider(actualCount);
                    if (!Array.isArray(words) || words.length < actualCount) {
                        throw new Error(
                            `Default provider for "${key}" returned fewer than ${actualCount} item(s)`,
                        );
                    }
                    result += actualCount === 1 ? words[0] : words.join(", ");
                }
            }
        }

        return result;
    }

    // -------------------------------------------------------------------------
    // PRIVATE: template parsing
    // -------------------------------------------------------------------------
    private static parseTemplate(tpl: string): TemplateToken[] {
        const tokens: TemplateToken[] = [];
        const re = /{([^}]+)}/g;
        let last = 0,
            m: RegExpExecArray | null;

        while ((m = re.exec(tpl))) {
            if (m.index > last) {
                tokens.push({
                    kind: "literal",
                    text: tpl.slice(last, m.index),
                });
            }

            const inside = m[1].trim();
            const parts = inside.split(",").map(s => s.trim());
            const key = parts[0];
            if (!key) throw new SyntaxError(`Empty placeholder "${m[0]}"`);
            let countRaw: string;
            let random = false;
            if (parts.length === 1) {
                countRaw = "1";
            } else if (parts.length === 2) {
                countRaw = parts[1];
            } else if (parts.length === 3) {
                if (parts[2] !== "?")
                    throw new SyntaxError(
                        `Bad placeholder syntax in "${m[0]}"`,
                    );
                random = true;
                countRaw = parts[1];
            } else {
                throw new SyntaxError(`Bad placeholder syntax in "${m[0]}"`);
            }
            const count = countRaw ? Number.parseInt(countRaw, 10) : 1;
            if (!Number.isFinite(count) || count <= 0)
                throw new SyntaxError(`Bad count in "${m[0]}"`);
            tokens.push({ kind: "placeholder", key, count, random });
            last = m.index + m[0].length;
        }
        if (last < tpl.length)
            tokens.push({ kind: "literal", text: tpl.slice(last) });

        return tokens;
    }

    // -------------------------------------------------------------------------
    // PRIVATE: random helpers for explicit lists
    // -------------------------------------------------------------------------
    private static pickOne<T>(arr: readonly T[]) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    private static pickMany<T>(arr: readonly T[], k: number): T[] {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0 && k > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy.slice(0, k);
    }
}

// ===========================================================================
// Default dictionary providers – use WordPOS **random** helpers
// ===========================================================================
const wordpos = new WordPOS();

/** Helper to wrap WordPOS random methods so the signature matches `(count)=>Promise<string[]>` */
function wp(method: keyof typeof WordPOS) {
    return async (count: number): Promise<string[]> => {
        // WordPOS random APIs always return an array; fall back to single‑word form
        // if the lib returns a string for count == 1 (older versions do this).
        // @ts-ignore – indexing by `method` is fine at runtime
        const res = await wordpos[method](count);
        return Array.isArray(res) ? res.slice(0, count) : [res];
    };
}

Prompt.registerDefaultChoice("noun", wp("randNoun"));
Prompt.registerDefaultChoice("verb", wp("randVerb"));
Prompt.registerDefaultChoice("adjective", wp("randAdjective"));
Prompt.registerDefaultChoice("adverb", wp("randAdverb"));

/* ------------------------------------------------------------------------- *
 * Example
 * ------------------------------------------------------------------------- */
// const p = new Prompt({ template: "A {adjective} {noun} eating {noun,3}." });
// console.log(await p.sample(3));
/** Returns true if `x` is a PromptDef */
export function isPromptDef(x: unknown): x is PromptDef {
    if (typeof x !== "object" || x === null) return false;
    const obj = x as Record<string, unknown>;

    // check template
    if (typeof obj.template !== "string") return false;

    if (!obj.choices) return true;

    // check choices is an object
    if (typeof obj.choices !== "object" || obj.choices === null) return false;
    const choices = obj.choices as Record<string, unknown>;

    // each key => array of strings
    for (const [key, val] of Object.entries(choices)) {
        if (!Array.isArray(val)) return false;
        for (const elt of val) {
            if (typeof elt !== "string") return false;
        }
    }

    return true;
}
