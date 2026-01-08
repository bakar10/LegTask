# Reflection

## Issues Faced

1. **Arabic Text Extraction** - Spacing patterns varied between documents. Solved by using flexible regex with `\s*` and `\s+`.

2. **Principles Extraction** - Initial regex failed. Changed to two-step approach: extract section first, then split by pattern.

3. **Type Errors (null vs undefined)** - Parser returned `null`, types expected `undefined`. Fixed by standardizing on `null` for database compatibility.

4. **Search Function Error** - `pg_trgm` extension wasn't enabled. Created setup script to enable it.

---

## What I Would Improve

1. **Search** - Add Elasticsearch for better Arabic morphological search
2. **Processing** - Add worker queues for parallel batch processing
3. **Testing** - Add unit tests for extractors
4. **API** - Add authentication, rate limiting, and Swagger docs
5. **Error Handling** - Add structured error classes and request tracking

---

## What I Would Change in Task Description

1. **More sample documents** - Include edge cases (missing sections, different formats)
2. **Expected output examples** - Show sample JSON for each document type
3. **Search clarity** - Specify if fuzzy matching or exact match is expected