import type { HeadersArgs } from 'react-router'
import Auth from '../pages/Auth'

export function headers(_args: HeadersArgs) {
  return {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  }
}

export function meta() {
  return [
    { title: "Connexion - Squad Planner" },
    { name: "description", content: "Connecte-toi ou crée ton compte Squad Planner pour planifier tes sessions gaming." },
  ]
}

export default function Component() {
  return <Auth />
}
