**1\. Overview**

This application parses Egyptian legal documents (Fatwas, Laws, Court Judgments) from DOCX files, stores them in PostgreSQL, and provides a REST API for searching and retrieving documents.

**2\. Quick Start**

**Prerequisites:**

- Node.js 18+
- PostgreSQL 14+

**Installation Steps:**

Copy code

Step 1: Install dependencies

\> npm install

Step 2: Configure environment

\> cp .env.example .env

\> Edit .env with your database credentials

\# 3. Run the Insertion Script

npx ts-node scripts/main.ts

Step 4: Create search indexes

\> npm run db:indexes

Step 5: Load documents (place .docx files in samples/ folder)

\> npm run load

Step 6: Start API server

\> npm run api

API runs at: [http://localhost:3000](http://localhost:3000/)

**3\. Tech Stack**

| **Component** | **Technology** | **Rationale** |
| --- | --- | --- |
| Runtime | Node.js + TypeScript | Type safety, async handling |
| Database | PostgreSQL | Required, excellent for structured data |
| DOCX Parsing | Mammoth.js | Reliable Arabic text extraction |
| API Framework | Express.js | Simple, well-documented |
| Search | pg_trgm + GIN indexes | Fast pattern matching for Arabic |

**4\. Database Schema**

**4.1 Design Rationale**

**Why Three Separate Tables?**

Each document type has unique fields and structure. Separate tables provide:

- Clear data modeling specific to each type
- Optimized queries and indexes per type
- Easier maintenance and evolution
- Better performance for type-specific searches

**5.2 Schema Diagram**

**FATWAS Table:**

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | SERIAL | Primary key |
| issuing_authority | TEXT | الجهة المصدرة |
| number | INTEGER | رقم الفتوى (UNIQUE with year) |
| year | INTEGER | السنة (UNIQUE with number) |
| file_number | TEXT | رقم الملف |
| issue_date | DATE | تاريخ الإصدار |
| session_date | DATE | تاريخ الجلسة |
| entity | TEXT | الجهة |
| principles | JSONB | المبادئ |
| facts | TEXT | الوقائع |
| application | TEXT | التطبيق |
| opinion | TEXT | الرأى |
| full_text | TEXT | النص الكامل (indexed) |
| created_at | TIMESTAMP | تاريخ الإنشاء |

**LAWS Table:**

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | SERIAL | Primary key |
| issuing_authority | TEXT | الجهة المصدرة |
| number | INTEGER | رقم القانون (UNIQUE with year) |
| year | INTEGER | السنة (UNIQUE with number) |
| title | TEXT | عنوان القانون |
| president_name | TEXT | اسم الرئيس |
| issue_date | DATE | تاريخ الإصدار |
| publish_date | DATE | تاريخ النشر |
| effective_date | DATE | تاريخ السريان |
| gazette_ref | TEXT | مرجع الجريدة الرسمية |
| preamble | TEXT | الديباجة |
| articles | JSONB | المواد |
| full_text | TEXT | النص الكامل (indexed) |
| created_at | TIMESTAMP | تاريخ الإنشاء |

**JUDGMENTS Table:**

| **Column** | **Type** | **Description** |
| --- | --- | --- |
| id  | SERIAL | Primary key |
| issuing_authority | TEXT | الجهة المصدرة |
| court_name | TEXT | اسم المحكمة |
| case_type | TEXT | نوع القضية |
| case_number | INTEGER | رقم الطعن (UNIQUE with year) |
| case_year | INTEGER | سنة الطعن (UNIQUE with number) |
| session_date | DATE | تاريخ الجلسة |
| technical_office | INTEGER | مكتب فني |
| volume_number | INTEGER | رقم الجزء |
| page_number | INTEGER | رقم الصفحة |
| rule_number | INTEGER | رقم القاعدة |
| reference_number | TEXT | الرقم المرجعي |
| panel | TEXT | الهيئة |
| principles | JSONB | المبادئ القانونية |
| facts | TEXT | الوقائع |
| reasoning | TEXT | الحيثيات |
| ruling | TEXT | منطوق الحكم |
| full_text | TEXT | النص الكامل (indexed) |
| created_at | TIMESTAMP | تاريخ الإنشاء |

**5.3 Index Strategy**

| **Index Name** | **Type** | **Column** | **Purpose** |
| --- | --- | --- | --- |
| idx_fatwas_full_text_trgm | GIN | full_text | Fast Arabic text search |
| idx_fatwas_number_year | B-tree | (number, year) | Unique constraint, lookups |
| idx_laws_full_text_trgm | GIN | full_text | Fast Arabic text search |
| idx_laws_title_trgm | GIN | title | Search in titles |
| idx_laws_number_year | B-tree | (number, year) | Unique constraint, lookups |
| idx_judgments_full_text_trgm | GIN | full_text | Fast Arabic text search |
| idx_judgments_case_number_year | B-tree | (case_number, case_year) | Unique constraint |
| idx_judgments_court_name | B-tree | court_name | Filter by court |

**6\. Assumptions**

**6.1 Fatwa Documents**

| **Field** | **Extraction Method** | **Assumption** |
| --- | --- | --- |
| Header | First line regex | Format: authority - الفتوى رقم X لسنة Y بتاريخ... |
| Entity | Keyword search | Text after "الجهة" keyword |
| Principles | Pattern matching | Numbered as "مبدأ 1", "مبدأ 2" |
| Facts | Section detection | Between "الوقائع" and "التطبيق" |
| Application | Section detection | Between "التطبيق" and "الرأى" |
| Opinion | Section detection | After "الرأى" until end |

**6.2 Law Documents**

| **Field** | **Extraction Method** | **Assumption** |
| --- | --- | --- |
| Number/Year | Regex | Pattern: قانون رقم X لسنة YYYY |
| Title | Keyword search | Text after "بشأن" |
| Gazette | Keyword search | Line with "الجريدة الرسمية" |
| President | Keyword search | Text after "توقيع" |
| Articles | Pattern matching | Numbered as "المادة 1", "المادة 2" |
| Preamble | Position-based | Text before first article |

**6.3 Judgment Documents**

| **Field** | **Extraction Method** | **Assumption** |
| --- | --- | --- |
| Header | First line split | Format: جمهورية مصر العربية - محكمة النقض - مدني |
| Case Info | Regex | Pattern: الطعن رقم X لسنة Y ق |
| Session Date | Regex | Pattern: تاريخ الجلسة: DD/MM/YYYY |
| Panel | Section detection | Between "الهيئة" and "المبادئ" |
| Principles | Split by pattern | Separated by "مبدأ رقم X" |
| Facts | Section detection | Between "الوقائع" and "الحيثيات" |
| Reasoning | Section detection | Between "الحيثيات" and ruling |
| Ruling | Keyword search | Starts with "لما تقدم" |

**7\. API Endpoints**

**7.1 Health Check**

**Endpoint:** GET /health

**Response:**

json

Copy code

{

"status": "ok",

"database": "connected",

"timestamp": "2024-01-15T12:00:00.000Z"

}

**7.2 Search Documents**

**Endpoint:** GET /documents

**Parameters:**

| **Parameter** | **Type** | **Default** | **Description** |
| --- | --- | --- | --- |
| type | string | all | fatwa, law, judgment |
| q   | string |     | Search text |
| page | number | 1   | Page number |
| pageSize | number | 10  | Results per page |

**Example Request:**

Copy code

GET /documents?type=judgment&q=الشركاء&page=1&pageSize=10

**Example Response:**

json

Copy code

{

"data": \[

{

"id": 1,

"type": "judgment",

"issuing_authority": "جمهورية مصر العربية",

"court_name": "محكمة النقض",

"case_number": 1784,

"case_year": 54,

"preview": "الشركاء على الشيوع..."

}

\],

"pagination": {

"page": 1,

"pageSize": 10,

"total": 1,

"totalPages": 1

},

"filters": {

"type": "judgment",

"q": "الشركاء"

}

}

**7.3 Type-Specific Endpoints**

| **Endpoint** | **Description** |
| --- | --- |
| GET /fatwas | List all fatwas |
| GET /fatwas/:id | Get single fatwa |
| GET /laws | List all laws |
| GET /laws/:id | Get single law |
| GET /judgments | List all judgments |
| GET /judgments/:id | Get single judgment |

**8\. Search & Indexing**

**8.1 Implementation**

We use PostgreSQL's pg_trgm extension:

sql

Copy code

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_judgments_full_text_trgm

ON judgments USING gin (full_text gin_trgm_ops);

**8.2 Why Trigram?**

| **Feature** | **Benefit** |
| --- | --- |
| Arabic Support | No language configuration needed |
| Partial Matching | ILIKE '%text%' is fast with index |
| Built-in | No external dependencies |

**9\. Scalability Considerations**

**9.1 Current Implementation**

| **Feature** | **How It's Implemented** |
| --- | --- |
| Idempotency | ON CONFLICT DO NOTHING |
| Deduplication | Unique constraints (number, year) |
| Logging | Tracks inserted/skipped/errors |
| Search | GIN trigram indexes |

**9.2 For Hundreds of Thousands of Documents**

| **Challenge** | **Solution** |
| --- | --- |
| Batch Ingestion | Process in chunks of 1000 |
| Parallel Processing | Worker queues (Bull/Redis) |
| Retry Strategy | Exponential backoff |
| Monitoring | Structured logging, metrics |
| Search at Scale | Elasticsearch |
| Database Scaling | Partitioning, read replicas |

**10\. Limitations**

- **Arabic Search** - Using ILIKE, not morphological search
- **No OCR** - Only text-selectable DOCX files
- **Sequential Processing** - Single-threaded loader
- **No Authentication** - API is open
- **No Caching** - Every request hits database
- **Date Formats** - Assumes specific formats

**11\. Future Improvements**

**Short Term:**

- Add request validation (Joi/Zod)
- Add API rate limiting
- Add response caching (Redis)
- Add authentication (JWT)

**Medium Term:**

- Elasticsearch for advanced search
- Worker queues for parallel processing
- Docker Compose setup
- API documentation (Swagger)

**Long Term:**

- Arabic morphological search
- OCR for scanned documents
- Machine learning for extraction
- Real-time document processing