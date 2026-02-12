export interface FAQItem {
  question: string
  answer: string
  category: string
}

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  text: string
  timestamp: number
}

export const QUICK_ACTIONS = [
  'Créer une squad',
  'Score de fiabilité',
  'Party vocale',
  'Premium',
  'Supprimer mon compte',
]

export const GREETING_MESSAGE: ChatMessage = {
  id: 'greeting',
  role: 'bot',
  text: "Salut ! Je suis l'assistant Squad Planner. Pose-moi une question sur l'app !",
  timestamp: Date.now(),
}

const NO_MATCH_RESPONSE =
  "Je n'ai pas trouvé de réponse précise. Tu peux contacter le support via le formulaire ci-dessus ou reformuler ta question."

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

export function findBestMatch(input: string, faqItems: FAQItem[]): string | null {
  const normalizedInput = normalize(input)
  const inputWords = normalizedInput.split(/\s+/).filter((w) => w.length > 2)

  if (inputWords.length === 0) return null

  let bestScore = 0
  let bestAnswer: string | null = null

  for (const item of faqItems) {
    const normalizedQ = normalize(item.question)
    const normalizedA = normalize(item.answer)
    const combined = normalizedQ + ' ' + normalizedA

    let score = 0
    for (const word of inputWords) {
      if (combined.includes(word)) {
        score += normalizedQ.includes(word) ? 2 : 1
      }
    }

    const normalizedScore = score / inputWords.length

    if (normalizedScore > bestScore) {
      bestScore = normalizedScore
      bestAnswer = item.answer
    }
  }

  if (bestScore < 1) return null
  return bestAnswer
}

export function getNoMatchResponse(): string {
  return NO_MATCH_RESPONSE
}
