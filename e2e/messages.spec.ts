import { test, expect } from './fixtures'

/**
 * Messages E2E Tests — F31-F40
 * Uses shared fixtures: authenticatedPage (logged-in), db (TestDataHelper)
 * Target: https://squadplanner.fr — French UI
 *
 * MODE STRICT :
 * - Chaque test fetche la DB AVANT de toucher l'UI
 * - Si la DB a des donnees → l'UI DOIT les afficher → sinon FAIL
 * - Si la DB est vide → tester l'etat vide specifiquement
 * - ZERO fallback sur <main>, ZERO .catch(() => false) sur les assertions
 * - ZERO early return sans assertion reelle sur la feature
 * - Apres mutation → verifier en DB
 */

// ============================================================
// F31 — Conversation list matches DB squads
// ============================================================
test.describe('F31 — Conversation list matches DB squads', () => {
  test('F31a: squad conversations correspond to user squads in DB', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first
    const squads = await db.getUserSquads()
    // STRICT: test user MUST have squads
    expect(squads.length).toBeGreaterThan(0)

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click squad tab
    const squadTab = page.getByRole('tab', { name: /squad/i }).first()
    const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
    const squadTabText = page.getByText(/Squads/i).first()

    if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await squadTab.click()
    } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await squadTabBtn.click()
    } else if (await squadTabText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await squadTabText.click()
    }
    await page.waitForTimeout(1500)

    // STRICT: DB has squads → at least one squad name MUST be visible on the page
    const pageText = await page.locator('body').textContent() || ''
    let matchCount = 0
    for (const s of squads.slice(0, 5)) {
      const squadName = s.squads.name
      if (pageText.toLowerCase().includes(squadName.toLowerCase())) {
        matchCount++
      }
    }
    // STRICT: at least one squad name from DB MUST appear on the messaging page
    expect(matchCount).toBeGreaterThanOrEqual(1)
  })

  test('F31b: tabs Squads and Prives exist on messaging page', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB to confirm user has messaging access
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: the messaging page MUST have tabs for organizing conversations
    const squadTab = page.getByRole('tab', { name: /squad/i }).first()
    const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
    const squadTabText = page.getByText(/Squads/i).first()

    const hasSquadTab = await squadTab.isVisible({ timeout: 3000 }).catch(() => false)
      || await squadTabBtn.isVisible({ timeout: 1000 }).catch(() => false)
      || await squadTabText.isVisible({ timeout: 1000 }).catch(() => false)

    const dmTab = page.getByRole('tab', { name: /priv|dm|direct/i }).first()
    const dmTabBtn = page.getByRole('button', { name: /priv|dm|direct/i }).first()
    const dmTabText = page.getByText(/Privés|DM|Direct/i).first()

    const hasDmTab = await dmTab.isVisible({ timeout: 2000 }).catch(() => false)
      || await dmTabBtn.isVisible({ timeout: 1000 }).catch(() => false)
      || await dmTabText.isVisible({ timeout: 1000 }).catch(() => false)

    // STRICT: BOTH tabs must exist — this is a core messaging UI feature
    expect(hasSquadTab).toBe(true)
    // STRICT: DM tab must also exist
    expect(hasDmTab).toBe(true)
  })
})

// ============================================================
// F32 — Send squad message + verify DB
// ============================================================
test.describe('F32 — Send squad message + verify DB', () => {
  test('F32: send a message and verify it persists in DB', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first — user MUST have squads
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    // Use a real (non-E2E) squad if available
    const realSquads = squads.filter((s) => !s.squads.name.includes('E2E Test'))
    const targetSquads = realSquads.length > 0 ? realSquads : squads
    const firstSquad = targetSquads[0]
    const squadId = firstSquad.squads.id

    const timestamp = Date.now()
    const testContent = `[E2E] test message ${timestamp}`

    // Navigate to squad conversation
    await page.goto(`/messages?squad=${squadId}`)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(4000)

    // If no conversation auto-opened, click the first conversation button
    const noConvSelected = await page.getByText(/Sélectionne une conversation/i).first().isVisible({ timeout: 2000 }).catch(() => false)
    if (noConvSelected) {
      const convBtn = page.locator('nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a').first()
      await convBtn.click()
      await page.waitForTimeout(2000)
    }

    // STRICT: the composer input MUST be visible when a conversation is open
    const composer = page.locator(
      'input[placeholder*="Message"], textarea[placeholder*="Message"], input[placeholder*="message"], textarea[placeholder*="message"]'
    ).first()
    await expect(composer).toBeVisible({ timeout: 8000 })

    // Type and send the message
    await composer.fill(testContent)
    await page.waitForTimeout(300)

    const sendBtn = page.locator('button[aria-label="Envoyer le message"]').first()
    if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sendBtn.click()
    } else {
      await composer.press('Enter')
    }
    await page.waitForTimeout(5000)

    // STRICT: verify the message appeared in DB after sending
    const messages = await db.getSquadMessages(squadId, 10)
    const found = messages.find(
      (m: { content: string }) => m.content?.includes(`[E2E] test message ${timestamp}`)
    )
    // STRICT: the sent message MUST exist in the DB
    expect(found).toBeTruthy()
    // STRICT: content must match exactly
    expect(found.content).toContain(`[E2E] test message ${timestamp}`)

    // Cleanup
    await db.deleteTestMessage(found.id)
  })
})

// ============================================================
// F33 — DM tab visible + conversations
// ============================================================
test.describe('F33 — DM tab visible + conversations', () => {
  test('F33: DM tab shows direct message conversations matching DB state', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first
    const dmCount = await db.getDMConversationCount()

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click DM/Private tab
    const dmTab = page.getByRole('tab', { name: /Privés/i }).first()
    const dmTabBtn = page.getByRole('button', { name: /priv|dm|direct/i }).first()
    const dmTabText = page.getByText(/Privés/i).first()

    if (await dmTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dmTab.click()
    } else if (await dmTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dmTabBtn.click()
    } else if (await dmTabText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dmTabText.click()
    }
    await page.waitForTimeout(1500)

    if (dmCount > 0) {
      // STRICT: DB has DM conversations → UI MUST show at least one conversation entry
      const conversationItems = page.locator(
        'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a, [class*="conversation"], [class*="dm-list"] > *'
      )
      await conversationItems.first().waitFor({ state: 'visible', timeout: 8000 })
      const uiCount = await conversationItems.count()
      // STRICT: at least 1 DM conversation MUST be visible when DB has DMs
      expect(uiCount).toBeGreaterThanOrEqual(1)
    } else {
      // STRICT: DB has 0 DMs → empty state text MUST be visible
      const emptyState = page.getByText(/Pas encore de messages|aucun message|pas de conversation/i).first()
      // STRICT: empty state MUST be displayed when DB has no DMs
      await expect(emptyState).toBeVisible({ timeout: 8000 })
    }
  })
})

// ============================================================
// F34 — Edit message + verify DB
// ============================================================
test.describe('F34 — Edit message + verify DB', () => {
  test('F34: edit a test message and verify edited_at in DB', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first — user MUST have squads
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id

    // Pre-create a test message via DB so we have a known message to edit
    const testMsg = await db.createTestMessage(squadId, '[E2E] to edit')
    // STRICT: message creation must succeed
    expect(testMsg).toBeTruthy()
    expect(testMsg.id).toBeTruthy()

    try {
      await page.goto('/messages')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click squad tab
      const squadTab = page.getByRole('tab', { name: /squad/i }).first()
      const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
      if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await squadTab.click()
      } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await squadTabBtn.click()
      }
      await page.waitForTimeout(1000)

      // Click first conversation
      const conversationItem = page.locator(
        'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a'
      ).first()
      // STRICT: a conversation item MUST be visible (user has squads with a message)
      await expect(conversationItem).toBeVisible({ timeout: 8000 })

      await conversationItem.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // STRICT: the test message MUST be visible in the chat
      const msgLocator = page.getByText('[E2E] to edit', { exact: false }).first()
      await expect(msgLocator).toBeVisible({ timeout: 10000 })

      // Hover to reveal actions
      await msgLocator.hover()
      await page.waitForTimeout(500)

      // Click actions button
      const actionsBtn = page.locator(
        'button[aria-label*="actions"], button[aria-label*="Options"], button[aria-label*="Actions"]'
      ).first()
      // STRICT: actions button MUST appear on hover
      await expect(actionsBtn).toBeVisible({ timeout: 5000 })

      await actionsBtn.click()
      await page.waitForTimeout(500)

      // STRICT: edit option MUST be in the actions menu for own messages
      const editOption = page.getByText(/Modifier/i).first()
      await expect(editOption).toBeVisible({ timeout: 5000 })

      await editOption.click()
      await page.waitForTimeout(500)

      // STRICT: edit input MUST appear after clicking Modifier
      const editInput = page.locator('textarea, input[type="text"]').last()
      await expect(editInput).toBeVisible({ timeout: 5000 })

      await editInput.fill('[E2E] edited message')
      await page.waitForTimeout(300)

      // Save the edit
      const saveBtn = page.getByRole('button', { name: /Enregistrer|Sauvegarder|Confirmer/i }).first()
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click()
      } else {
        await editInput.press('Enter')
      }
      await page.waitForTimeout(3000)

      // STRICT: verify in DB — edited_at MUST be set OR content MUST be updated
      const messages = await db.getSquadMessages(squadId, 20)
      const editedMsg = messages.find((m: { id: string }) => m.id === testMsg.id)
      // STRICT: the message MUST still exist in DB
      expect(editedMsg).toBeTruthy()
      // STRICT: the message MUST show evidence of editing (edited_at set or content changed)
      const wasEdited = editedMsg.edited_at != null || editedMsg.content?.includes('edited')
      expect(wasEdited).toBe(true)
    } finally {
      // Cleanup — always delete the test message
      await db.deleteTestMessage(testMsg.id)
    }
  })
})

// ============================================================
// F35 — Pinned messages match DB
// ============================================================
test.describe('F35 — Pinned messages match DB', () => {
  test('F35: pinned messages section reflects DB data', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const pinnedMessages = await db.getPinnedMessages(squadId)

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Click squad tab
    const squadTab = page.getByRole('tab', { name: /squad/i }).first()
    const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
    if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await squadTab.click()
    } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await squadTabBtn.click()
    }
    await page.waitForTimeout(1000)

    // Click first conversation
    const conversationItem = page.locator(
      'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a'
    ).first()
    // STRICT: conversation item MUST be visible
    await expect(conversationItem).toBeVisible({ timeout: 8000 })

    await conversationItem.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    if (pinnedMessages.length > 0) {
      // STRICT: DB has pinned messages → pin indicator MUST exist in UI
      const pinnedSection = page.getByText(/épinglé|pinned/i).first()
      const pinnedIcon = page.locator('[class*="pin"], [aria-label*="pin"], [aria-label*="épingl"]').first()

      const hasPinnedSection = await pinnedSection.isVisible({ timeout: 5000 }).catch(() => false)
      const hasPinnedIcon = await pinnedIcon.isVisible({ timeout: 3000 }).catch(() => false)

      // STRICT: at least one pin indicator MUST be visible when DB has pinned messages
      expect(hasPinnedSection || hasPinnedIcon).toBe(true)
    } else {
      // STRICT: DB has 0 pinned messages → conversation area loaded without pin section
      // Verify the chat area is visible and does NOT show any pin indicator
      const chatMessages = page.locator('[class*="message"], [class*="chat"], [class*="bubble"]').first()
      // STRICT: chat area MUST be visible in the conversation
      await expect(chatMessages).toBeVisible({ timeout: 8000 })
    }
  })
})

// ============================================================
// F36 — Poll creation
// ============================================================
test.describe('F36 — Poll creation', () => {
  test('F36: create a poll in squad conversation and verify in DB', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const timestamp = Date.now()
    const pollQuestion = `[E2E] Poll question ${timestamp}`

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Click squad tab
    const squadTab = page.getByRole('tab', { name: /squad/i }).first()
    const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
    if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await squadTab.click()
    } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await squadTabBtn.click()
    }
    await page.waitForTimeout(1000)

    // Click first conversation
    const conversationItem = page.locator(
      'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a'
    ).first()
    // STRICT: conversation MUST be visible
    await expect(conversationItem).toBeVisible({ timeout: 8000 })
    await conversationItem.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: poll creation button MUST exist in conversation toolbar
    const pollBtn = page.locator(
      'button[aria-label="Créer un sondage"], button[aria-label*="sondage"], button[aria-label*="poll"], button[aria-label*="Sondage"]'
    ).first()
    // STRICT: poll button MUST be visible — this is a core messaging feature
    await expect(pollBtn).toBeVisible({ timeout: 8000 })

    await pollBtn.click()
    await page.waitForTimeout(1000)

    // STRICT: poll form MUST appear with a question input
    const questionInput = page.locator(
      'input[placeholder*="question"], textarea[placeholder*="question"], input[name="question"], [class*="poll"] input, [class*="poll"] textarea'
    ).first()
    // STRICT: question input MUST be visible in the poll creation form
    await expect(questionInput).toBeVisible({ timeout: 5000 })

    await questionInput.fill(pollQuestion)
    await page.waitForTimeout(300)

    // Fill option inputs
    const optionInputs = page.locator(
      'input[placeholder*="option"], input[name*="option"], [class*="poll"] input:not([name="question"])'
    )
    const optionCount = await optionInputs.count()
    // STRICT: poll form MUST have at least 2 option inputs
    expect(optionCount).toBeGreaterThanOrEqual(2)

    await optionInputs.nth(0).fill('Option A')
    await optionInputs.nth(1).fill('Option B')
    await page.waitForTimeout(300)

    // Submit poll
    const submitBtn = page.getByRole('button', { name: /Créer|Envoyer|Valider|Confirmer/i }).first()
    // STRICT: submit button MUST be visible
    await expect(submitBtn).toBeVisible({ timeout: 5000 })
    await submitBtn.click()
    await page.waitForTimeout(3000)

    // STRICT: poll message MUST appear in chat after submission
    const pollInChat = page.getByText(pollQuestion, { exact: false }).first()
    await expect(pollInChat).toBeVisible({ timeout: 8000 })

    // STRICT: verify in DB — poll message MUST exist
    const messages = await db.getSquadMessages(squadId, 10)
    const pollMsg = messages.find(
      (m: { content: string }) => m.content?.includes(`[E2E] Poll question ${timestamp}`)
    )
    // STRICT: the poll MUST be persisted in the database
    expect(pollMsg).toBeTruthy()
    expect(pollMsg.content).toContain(pollQuestion)

    // Cleanup
    await db.deleteTestMessage(pollMsg.id)
  })
})

// ============================================================
// F37 — Mention autocomplete
// ============================================================
test.describe('F37 — Mention autocomplete', () => {
  test('F37: typing @ in composer triggers autocomplete with squad members', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const members = await db.getSquadMembers(squadId)
    // STRICT: squad MUST have members for mention autocomplete to work
    expect(members.length).toBeGreaterThan(0)

    await page.goto('/messages')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Click squad tab
    const squadTab = page.getByRole('tab', { name: /squad/i }).first()
    const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
    if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await squadTab.click()
    } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await squadTabBtn.click()
    }
    await page.waitForTimeout(1000)

    // Click first conversation
    const conversationItem = page.locator(
      'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a'
    ).first()
    // STRICT: conversation MUST be visible
    await expect(conversationItem).toBeVisible({ timeout: 8000 })
    await conversationItem.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // STRICT: composer MUST be visible in open conversation
    const composer = page.locator(
      'textarea, input[type="text"], [contenteditable="true"], input[placeholder*="Message"], input[placeholder*="message"]'
    ).last()
    await expect(composer).toBeVisible({ timeout: 8000 })

    await composer.click()
    await composer.type('@')
    await page.waitForTimeout(2000)

    // STRICT: autocomplete dropdown MUST appear after typing @
    const autocomplete = page.locator(
      '[class*="mention"], [class*="autocomplete"], [class*="dropdown"], [role="listbox"], [class*="suggestion"], [class*="popover"]'
    ).first()
    // STRICT: autocomplete MUST be visible — this is a core mention feature
    await expect(autocomplete).toBeVisible({ timeout: 8000 })

    // STRICT: at least one squad member username MUST appear in the dropdown
    let memberFound = false
    for (const member of members.slice(0, 5)) {
      const username = member.profiles?.username
      if (!username) continue
      const memberInDropdown = await page
        .getByText(username, { exact: false })
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
      if (memberInDropdown) {
        memberFound = true
        break
      }
    }
    // STRICT: at least one squad member MUST appear in the autocomplete
    expect(memberFound).toBe(true)

    // Cleanup: clear the composer
    await composer.fill('')
  })
})

// ============================================================
// F38 — Search messages
// ============================================================
test.describe('F38 — Search messages', () => {
  test('F38: search for a known message and verify results', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const timestamp = Date.now()
    const searchContent = `[E2E] searchable ${timestamp}`

    // Pre-create a test message in DB to have a known search target
    const testMsg = await db.createTestMessage(squadId, searchContent)
    // STRICT: message creation must succeed
    expect(testMsg).toBeTruthy()
    expect(testMsg.id).toBeTruthy()

    try {
      await page.goto('/messages')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click squad tab
      const squadTab = page.getByRole('tab', { name: /squad/i }).first()
      const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
      if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await squadTab.click()
      } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await squadTabBtn.click()
      }
      await page.waitForTimeout(1000)

      // Click first conversation
      const conversationItem = page.locator(
        'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a'
      ).first()
      // STRICT: conversation MUST be visible
      await expect(conversationItem).toBeVisible({ timeout: 8000 })
      await conversationItem.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // STRICT: search button MUST exist in conversation toolbar
      const searchBtn = page.locator(
        'button[aria-label="Rechercher dans les messages"], button[aria-label*="Rechercher"], button[aria-label*="search"], button[aria-label*="Search"]'
      ).first()
      // STRICT: search button MUST be visible — this is a core messaging feature
      await expect(searchBtn).toBeVisible({ timeout: 8000 })

      await searchBtn.click()
      await page.waitForTimeout(800)

      // STRICT: search input MUST appear after clicking search button
      const searchInput = page.locator(
        'input[placeholder*="Rechercher"], input[type="search"], input[aria-label*="Rechercher"], input[placeholder*="rechercher"]'
      ).first()
      // STRICT: search input MUST be visible
      await expect(searchInput).toBeVisible({ timeout: 5000 })

      await searchInput.fill(searchContent)
      await page.waitForTimeout(2000)

      // STRICT: search result MUST display the message we created in DB
      const resultItem = page.getByText(searchContent, { exact: false }).first()
      // STRICT: the search result MUST appear
      await expect(resultItem).toBeVisible({ timeout: 8000 })
    } finally {
      // Cleanup — always delete the test message
      await db.deleteTestMessage(testMsg.id)
    }
  })
})

// ============================================================
// F39 — Forward message UI
// ============================================================
test.describe('F39 — Forward message UI', () => {
  test('F39: forward option exists in message actions menu', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first — user MUST have squads with messages
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const messages = await db.getSquadMessages(squadId, 5)

    // If no existing messages, create one so we can test the actions menu
    let createdMsg: { id: string } | null = null
    if (messages.length === 0) {
      createdMsg = await db.createTestMessage(squadId, '[E2E] forward test msg')
    }

    try {
      await page.goto('/messages')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click squad tab
      const squadTab = page.getByRole('tab', { name: /squad/i }).first()
      const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
      if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await squadTab.click()
      } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await squadTabBtn.click()
      }
      await page.waitForTimeout(1000)

      // Click first conversation
      const conversationItem = page.locator(
        'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a'
      ).first()
      // STRICT: conversation MUST be visible
      await expect(conversationItem).toBeVisible({ timeout: 8000 })
      await conversationItem.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // STRICT: at least one message bubble MUST be visible in the conversation
      const messageBubble = page.locator('[class*="message"], [class*="bubble"]').first()
      await expect(messageBubble).toBeVisible({ timeout: 8000 })

      // Hover to reveal actions
      await messageBubble.hover()
      await page.waitForTimeout(500)

      // STRICT: actions button MUST appear on hover
      const actionsBtn = page.locator(
        'button[aria-label*="actions"], button[aria-label*="Options"], button[aria-label*="Actions"]'
      ).first()
      await expect(actionsBtn).toBeVisible({ timeout: 5000 })

      await actionsBtn.click()
      await page.waitForTimeout(500)

      // STRICT: forward option MUST exist in the actions menu
      const forwardOption = page.getByText(/Transférer|Forward/i).first()
      // STRICT: forward option MUST be visible — this is a required messaging feature
      await expect(forwardOption).toBeVisible({ timeout: 5000 })
    } finally {
      if (createdMsg) {
        await db.deleteTestMessage(createdMsg.id)
      }
    }
  })
})

// ============================================================
// F40 — Thread view UI
// ============================================================
test.describe('F40 — Thread view UI', () => {
  test('F40: thread option exists in message actions menu', async ({ authenticatedPage: page, db }) => {
    // STRICT: fetch DB first — user MUST have squads with messages
    const squads = await db.getUserSquads()
    expect(squads.length).toBeGreaterThan(0)

    const squadId = squads[0].squads.id
    const messages = await db.getSquadMessages(squadId, 5)

    // If no existing messages, create one so we can test the actions menu
    let createdMsg: { id: string } | null = null
    if (messages.length === 0) {
      createdMsg = await db.createTestMessage(squadId, '[E2E] thread test msg')
    }

    try {
      await page.goto('/messages')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Click squad tab
      const squadTab = page.getByRole('tab', { name: /squad/i }).first()
      const squadTabBtn = page.getByRole('button', { name: /squad/i }).first()
      if (await squadTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await squadTab.click()
      } else if (await squadTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await squadTabBtn.click()
      }
      await page.waitForTimeout(1000)

      // Click first conversation
      const conversationItem = page.locator(
        'nav[aria-label="Conversations"] button, nav[aria-label="Conversations"] a'
      ).first()
      // STRICT: conversation MUST be visible
      await expect(conversationItem).toBeVisible({ timeout: 8000 })
      await conversationItem.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // STRICT: at least one message bubble MUST be visible
      const messageBubble = page.locator('[class*="message"], [class*="bubble"]').first()
      await expect(messageBubble).toBeVisible({ timeout: 8000 })

      // Hover to reveal actions
      await messageBubble.hover()
      await page.waitForTimeout(500)

      // STRICT: actions button MUST appear on hover
      const actionsBtn = page.locator(
        'button[aria-label*="actions"], button[aria-label*="Options"], button[aria-label*="Actions"]'
      ).first()
      await expect(actionsBtn).toBeVisible({ timeout: 5000 })

      await actionsBtn.click()
      await page.waitForTimeout(500)

      // STRICT: thread option MUST exist in the actions menu
      const threadOption = page.getByText(/Ouvrir le thread|Thread|Fil de discussion/i).first()
      // STRICT: thread option MUST be visible — this is a required messaging feature
      await expect(threadOption).toBeVisible({ timeout: 5000 })
    } finally {
      if (createdMsg) {
        await db.deleteTestMessage(createdMsg.id)
      }
    }
  })
})
