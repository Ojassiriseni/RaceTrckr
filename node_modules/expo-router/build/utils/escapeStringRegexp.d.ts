/**
 * Escapes the characters that have a special meaning in a regular expression, so `value` matches
 * literally. `-` becomes `\x2d` because `\-` is not a valid escape outside a character class in
 * Unicode-mode patterns.
 */
export declare function escapeStringRegexp(value: string): string;
