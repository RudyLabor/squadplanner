import { redirect } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'

/**
 * BUG FIX #3: Redirect /login to /auth
 * Users may try to access /login, but the auth page is at /auth.
 * This loader redirect ensures old links and bookmarks still work.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  // Preserve query params (e.g., ?redirect_to=/home)
  const searchParams = url.search
  return redirect(`/auth${searchParams}`)
}

export default function Login() {
  // This component never renders — loader always redirects
  return null
}
