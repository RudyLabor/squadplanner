import Auth from '../pages/Auth'

export function meta() {
  return [
    { title: "Connexion - Squad Planner" },
    { name: "description", content: "Connecte-toi ou crée ton compte Squad Planner pour planifier tes sessions gaming." },
  ]
}

export default function AuthRoute() {
  return <Auth />
}
