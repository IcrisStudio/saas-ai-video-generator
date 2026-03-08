# Cloudflare R2 Setup Guide

This project stores media files (images and videos) in **Cloudflare R2** instead of Convex file storage. Metadata (URLs, user info, prompts) stays in Convex.

## 1. Create an R2 bucket

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **R2 Object Storage** in the left sidebar.
3. Click **Create bucket**.
4. Choose a **Bucket name** (e.g. `my-app-media`).
5. Leave location as **Automatic** (or pick a region if you prefer).
6. Click **Create bucket**.

## 2. Enable public access (for public URLs)

To get URLs that the frontend can use to load images/videos:

1. Open your bucket → **Settings**.
2. Under **Public access**, click **Allow Access**.
3. Either:
   - Use the **R2.dev subdomain** Cloudflare gives you (e.g. `https://pub-xxxxx.r2.dev`), or  
   - Add a **Custom domain** (e.g. `assets.yourdomain.com`) and point it to the bucket.

Note the **base URL** you will use (e.g. `https://pub-xxxxx.r2.dev` or `https://assets.yourdomain.com`). You will set this as `R2_PUBLIC_URL` below.

## 3. Create API tokens (S3-compatible)

1. In the Cloudflare dashboard, go to **R2** → **Overview**.
2. On the right, under **R2 API Tokens**, click **Manage R2 API Tokens**.
3. Click **Create API token**.
4. Name it (e.g. `my-app-upload`).
5. Permissions: **Object Read & Write** (or **Admin Read & Write** if you prefer).
6. Specify your bucket (or “Apply to all buckets”).
7. Click **Create API token**.
8. Copy the **Access Key ID** and **Secret Access Key** (you won’t see the secret again).

You also need your **Account ID**:

- On the R2 Overview page, it’s in the right sidebar under **Account details**.

## 4. Environment variables

Add these to your backend environment (e.g. `.env` or `.env.local` in the project root, or your host’s env config). **Do not commit real keys to git.**

```bash
# Cloudflare R2 (required for media uploads)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

- **R2_ACCOUNT_ID**: Your Cloudflare account ID (R2 Overview → Account details).
- **R2_ACCESS_KEY_ID**: From the R2 API token you created.
- **R2_SECRET_ACCESS_KEY**: From the same token.
- **R2_BUCKET_NAME**: The exact bucket name (e.g. `my-app-media`).
- **R2_PUBLIC_URL**: The base URL for public access (e.g. `https://pub-xxxxx.r2.dev` or your custom domain). No trailing slash.

If any of these are missing, the upload endpoints will return 503 and ask you to set the R2 env vars.

## 5. Where things live in the project

| What | Where |
|------|--------|
| R2 upload helper (S3 client, upload logic) | `server/r2Upload.ts` |
| Upload API routes | `server.ts` (e.g. `/api/upload-r2`, `/api/ingest-url`, `/api/ingest-text`) |
| Frontend upload helpers | `src/services/storageService.ts` (`uploadBlobToR2`, `ingestUrlToR2`, `clientFetchAndUploadToR2`) |
| Convex (metadata only) | `convex/` (projects, generations, community, etc.) — no Convex file storage used for new uploads |

## 6. Dependencies

R2 is used via the S3-compatible API. The app already depends on:

- `@aws-sdk/client-s3`

If you add a new backend from scratch, install it with:

```bash
npm install @aws-sdk/client-s3
```

## 7. Flow summary

1. **User generates or uploads media** (e.g. image/video from AI or file upload).
2. **Frontend** sends the file or URL to your backend (e.g. `POST /api/upload-r2` with body, or `POST /api/ingest-url` with `{ url }`).
3. **Backend** (`server/r2Upload.ts`) uploads to R2 using the S3 client and returns the **public URL**.
4. **Frontend** saves that URL in Convex (e.g. in `generations`, `projects`, `generatedImages`, `generatedVideos`) via existing mutations.
5. **UI** loads media using the stored R2 URL.

No Convex file storage APIs are used for new uploads; only R2 and Convex (for metadata and URLs).

## 8. Workflow JSON in R2

When you save a workspace, nodes and edges are stored in R2 under fixed keys per project:

- `workflows/<projectId>/nodes.json`
- `workflows/<projectId>/edges.json`

Each save overwrites the previous file, so there are no duplicate workflow entries. The backend endpoint is `POST /api/workflow-save` (see `server.ts` and `src/services/storageService.ts` → `uploadWorkflowToR2`).

## 9. Groq API (workspace AI)

The workspace AI chat uses [Groq](https://console.groq.com/docs/models) for suggestions and prompt help. Add to your env:

```bash
GROQ_API_KEY=your_groq_api_key
```

Get a key from [Groq Console](https://console.groq.com). The server uses the model `llama-3.3-70b-versatile` by default (see `server/groq.ts`). If `GROQ_API_KEY` is missing, the chat will return an error.
