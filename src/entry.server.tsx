import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { StrictMode } from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { isbot } from 'isbot'

const ABORT_DELAY = 5_000

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
) {
  const userAgent = request.headers.get('user-agent')
  const isCrawler = userAgent ? isbot(userAgent) : false

  const stream = await renderToReadableStream(
    <StrictMode>
      <ServerRouter context={entryContext} url={request.url} />
    </StrictMode>,
    {
      signal: AbortSignal.timeout(ABORT_DELAY),
      onError(error: unknown) {
        responseStatusCode = 500
        console.error('[SSR Error]', error)
      },
    }
  )

  // For bots/crawlers, wait for the full HTML to be ready (better SEO)
  if (isCrawler) {
    await stream.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')

  return new Response(stream, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
