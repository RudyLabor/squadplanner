import { CallHistory } from '../pages/CallHistory'

export function meta() {
  return [
    { title: "Historique d'appels - Squad Planner" },
  ]
}

export default function CallHistoryRoute() {
  return <CallHistory />
}
