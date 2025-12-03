import { v } from "convex/values"
import { query } from "./_generated/server"

// Type pour les données de test (mock IDs)
type TestUser = {
  _id: string
  name: string
  username: string
  image: string
}

/**
 * Récupère toutes les transactions avec filtres pour le dashboard admin
 * @returns Liste des transactions filtrées avec les informations des créateurs et abonnés
 */
export const getTransactionsForDashboard = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    creatorId: v.optional(v.id("users")),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier que l'utilisateur est un superuser
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifié")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Accès refusé : uniquement pour les administrateurs")
    }

    // Récupérer toutes les transactions réussies
    let transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("status"), "succeeded"))
      .collect()

    // Appliquer les filtres
    if (args.creatorId) {
      transactions = transactions.filter(
        (tx) => tx.creatorId === args.creatorId,
      )
    }

    if (args.provider) {
      transactions = transactions.filter((tx) => tx.provider === args.provider)
    }

    // Filtrer par date basé sur la création de la transaction
    if (args.startDate || args.endDate) {
      transactions = transactions.filter((tx) => {
        const txDate = tx._creationTime
        if (args.startDate && txDate < args.startDate) return false
        if (args.endDate && txDate > args.endDate) return false
        return true
      })
    }

    // Enrichir les transactions avec les infos des utilisateurs
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        const creator = await ctx.db.get(tx.creatorId)
        const subscriber = await ctx.db.get(tx.subscriberId)

        return {
          _id: tx._id,
          _creationTime: tx._creationTime,
          amount: tx.amount,
          currency: tx.currency,
          provider: tx.provider,
          providerTransactionId: tx.providerTransactionId,
          creator: creator
            ? {
                _id: creator._id,
                name: creator.name,
                username: creator.username,
                image: creator.image,
              }
            : null,
          subscriber: subscriber
            ? {
                _id: subscriber._id,
                name: subscriber.name,
                username: subscriber.username,
                image: subscriber.image,
              }
            : null,
        }
      }),
    )

    // Trier par date décroissante (plus récent en premier)
    return enrichedTransactions.sort(
      (a, b) => b._creationTime - a._creationTime,
    )
  },
})

/**
 * Calcule les statistiques agrégées des transactions pour le dashboard
 * @returns Statistiques incluant totaux par créateur, global et classements
 */
export const getTransactionsSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    creatorId: v.optional(v.id("users")),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier que l'utilisateur est un superuser
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifié")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Accès refusé : uniquement pour les administrateurs")
    }

    // Récupérer les transactions filtrées (même logique que getTransactionsForDashboard)
    let transactions = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("status"), "succeeded"))
      .collect()

    if (args.creatorId) {
      transactions = transactions.filter(
        (tx) => tx.creatorId === args.creatorId,
      )
    }

    if (args.provider) {
      transactions = transactions.filter((tx) => tx.provider === args.provider)
    }

    if (args.startDate || args.endDate) {
      transactions = transactions.filter((tx) => {
        const txDate = tx._creationTime
        if (args.startDate && txDate < args.startDate) return false
        if (args.endDate && txDate > args.endDate) return false
        return true
      })
    }

    // Taux de conversion USD → XAF (aligné sur lib/services/currency.ts)
    const USD_TO_XAF_RATE = 562.2

    // Fonction helper pour normaliser les montants en XAF
    const normalizeToXAF = (amount: number, currency: string): number => {
      if (currency.toUpperCase() === "USD") {
        return amount * USD_TO_XAF_RATE
      }
      return amount // Déjà en XAF
    }

    // Calculer les totaux par créateur (normalisés en XAF)
    const creatorTotals = new Map<
      string,
      {
        creatorId: string
        creatorName: string
        creatorUsername: string | undefined
        totalAmount: number
        transactionCount: number
        currency: string
      }
    >()

    for (const tx of transactions) {
      const creator = await ctx.db.get(tx.creatorId)
      if (!creator) continue

      const key = tx.creatorId
      const existing = creatorTotals.get(key)

      // Normaliser le montant en XAF pour des comparaisons correctes
      const normalizedAmount = normalizeToXAF(tx.amount, tx.currency)

      if (existing) {
        existing.totalAmount += normalizedAmount
        existing.transactionCount += 1
      } else {
        creatorTotals.set(key, {
          creatorId: tx.creatorId,
          creatorName: creator.name,
          creatorUsername: creator.username,
          totalAmount: normalizedAmount,
          transactionCount: 1,
          currency: "XAF", // Toujours XAF pour les totaux normalisés
        })
      }
    }

    // Convertir en tableau et trier par montant décroissant
    const creatorSummaries = Array.from(creatorTotals.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount,
    )

    // Calculer le total global (normalisé en XAF)
    const totalAmount = transactions.reduce(
      (sum, tx) => sum + normalizeToXAF(tx.amount, tx.currency),
      0,
    )

    // Identifier les top et low earners
    const topEarners = creatorSummaries.slice(0, 5)
    const lowEarners = creatorSummaries.slice(-5).reverse()

    return {
      totalAmount,
      totalTransactions: transactions.length,
      currency: "XAF", // Toujours XAF car les montants sont normalisés
      creatorSummaries,
      topEarners,
      lowEarners,
    }
  },
})

/**
 * Récupère la liste de tous les créateurs pour le filtre
 * @returns Liste des créateurs avec leur ID et nom
 */
export const getAllCreators = query({
  handler: async (ctx) => {
    // Vérifier que l'utilisateur est un superuser
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifié")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Accès refusé : uniquement pour les administrateurs")
    }

    const creators = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("accountType"), "CREATOR"))
      .collect()

    return creators.map((creator) => ({
      _id: creator._id,
      name: creator.name,
      username: creator.username,
      image: creator.image,
    }))
  },
})

/**
 * 🧪 DONNÉES DE TEST - Génère des transactions fictives pour tester le dashboard
 * @returns Liste de transactions de test avec des données réalistes
 */
export const getTestTransactionsForDashboard = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    creatorId: v.optional(v.id("users")),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier que l'utilisateur est un superuser
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifié")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Accès refusé : uniquement pour les administrateurs")
    }

    // Données de test pour les créatrices
    const testCreators: TestUser[] = [
      {
        _id: "test_creator_1",
        name: "Sophie Martin",
        username: "sophiemartin",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
      },
      {
        _id: "test_creator_2",
        name: "Amélie Dubois",
        username: "ameliedubois",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amelie",
      },
      {
        _id: "test_creator_3",
        name: "Clara Bernard",
        username: "clarabernard",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Clara",
      },
      {
        _id: "test_creator_4",
        name: "Léa Petit",
        username: "leapetit",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lea",
      },
      {
        _id: "test_creator_5",
        name: "Emma Laurent",
        username: "emmalaurent",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      },
    ]

    // Données de test pour les abonnés
    const testSubscribers: TestUser[] = [
      {
        _id: "test_sub_1",
        name: "Jean Dupont",
        username: "jeandupont",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jean",
      },
      {
        _id: "test_sub_2",
        name: "Pierre Moreau",
        username: "pierremoreau",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre",
      },
      {
        _id: "test_sub_3",
        name: "Marie Lambert",
        username: "marielambert",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
      },
      {
        _id: "test_sub_4",
        name: "Lucas Simon",
        username: "lucassimon",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas",
      },
      {
        _id: "test_sub_5",
        name: "Julie Roux",
        username: "julieroux",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julie",
      },
      {
        _id: "test_sub_6",
        name: "Thomas Blanc",
        username: "thomasblanc",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
      },
    ]

    // Générer 30 transactions de test
    const testTransactions = []
    const now = Date.now()
    const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000

    for (let i = 0; i < 30; i++) {
      // Date aléatoire dans les 2 dernières semaines
      const randomDate = twoWeeksAgo + Math.random() * (now - twoWeeksAgo)

      // Créatrice et abonné aléatoires
      const creator =
        testCreators[Math.floor(Math.random() * testCreators.length)]
      const subscriber =
        testSubscribers[Math.floor(Math.random() * testSubscribers.length)]

      // Provider aléatoire (70% CinetPay, 30% Stripe pour simuler la réalité)
      const provider = Math.random() < 0.7 ? "cinetpay" : "stripe"

      testTransactions.push({
        _id: `test_tx_${i}`,
        _creationTime: randomDate,
        amount: 1000, // 1000 XAF
        currency: "XAF",
        provider,
        providerTransactionId: `${provider}_test_${Math.random().toString(36).substr(2, 9)}`,
        creator,
        subscriber,
      })
    }

    // Appliquer les filtres
    let filteredTransactions = testTransactions

    if (args.creatorId) {
      filteredTransactions = filteredTransactions.filter(
        (tx) => tx.creator._id === args.creatorId,
      )
    }

    if (args.provider) {
      filteredTransactions = filteredTransactions.filter(
        (tx) => tx.provider === args.provider,
      )
    }

    if (args.startDate || args.endDate) {
      filteredTransactions = filteredTransactions.filter((tx) => {
        if (args.startDate && tx._creationTime < args.startDate) return false
        if (args.endDate && tx._creationTime > args.endDate) return false
        return true
      })
    }

    // Trier par date décroissante
    return filteredTransactions.sort(
      (a, b) => b._creationTime - a._creationTime,
    )
  },
})

/**
 * 🧪 DONNÉES DE TEST - Génère des statistiques fictives pour tester le dashboard
 * @returns Statistiques de test calculées
 */
export const getTestTransactionsSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    creatorId: v.optional(v.id("users")),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, _args) => {
    // Vérifier que l'utilisateur est un superuser
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifié")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Accès refusé : uniquement pour les administrateurs")
    }

    // Simuler les données pour le résumé
    const creatorSummaries = [
      {
        creatorId: "test_creator_1",
        creatorName: "Sophie Martin",
        creatorUsername: "sophiemartin",
        totalAmount: 8000,
        transactionCount: 8,
        currency: "XAF",
      },
      {
        creatorId: "test_creator_2",
        creatorName: "Amélie Dubois",
        creatorUsername: "ameliedubois",
        totalAmount: 6000,
        transactionCount: 6,
        currency: "XAF",
      },
      {
        creatorId: "test_creator_3",
        creatorName: "Clara Bernard",
        creatorUsername: "clarabernard",
        totalAmount: 7000,
        transactionCount: 7,
        currency: "XAF",
      },
      {
        creatorId: "test_creator_4",
        creatorName: "Léa Petit",
        creatorUsername: "leapetit",
        totalAmount: 5000,
        transactionCount: 5,
        currency: "XAF",
      },
      {
        creatorId: "test_creator_5",
        creatorName: "Emma Laurent",
        creatorUsername: "emmalaurent",
        totalAmount: 4000,
        transactionCount: 4,
        currency: "XAF",
      },
    ]

    const totalAmount = 30000 // 30 transactions x 1000 XAF
    const topEarners = creatorSummaries.slice(0, 5)
    const lowEarners = [...creatorSummaries].reverse().slice(0, 5)

    return {
      totalAmount,
      totalTransactions: 30,
      currency: "XAF",
      creatorSummaries,
      topEarners,
      lowEarners,
    }
  },
})

/**
 * 🧪 DONNÉES DE TEST - Retourne les créatrices de test
 * @returns Liste des créatrices de test
 */
export const getTestCreators = query({
  handler: async (ctx) => {
    // Vérifier que l'utilisateur est un superuser
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifié")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser || currentUser.accountType !== "SUPERUSER") {
      throw new Error("Accès refusé : uniquement pour les administrateurs")
    }

    const testCreatorsData: TestUser[] = [
      {
        _id: "test_creator_1",
        name: "Sophie Martin",
        username: "sophiemartin",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
      },
      {
        _id: "test_creator_2",
        name: "Amélie Dubois",
        username: "ameliedubois",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amelie",
      },
      {
        _id: "test_creator_3",
        name: "Clara Bernard",
        username: "clarabernard",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Clara",
      },
      {
        _id: "test_creator_4",
        name: "Léa Petit",
        username: "leapetit",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lea",
      },
      {
        _id: "test_creator_5",
        name: "Emma Laurent",
        username: "emmalaurent",
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      },
    ]

    return testCreatorsData
  },
})

/**
 * Récupère les statistiques de revenus pour un créateur
 * @returns Total net gagné, prochain paiement et date du prochain jeudi
 */
export const getCreatorEarnings = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Non authentifié")
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique()

    if (!currentUser) {
      throw new Error("Utilisateur introuvable")
    }

    if (
      currentUser.accountType !== "CREATOR" &&
      currentUser.accountType !== "SUPERUSER"
    ) {
      throw new Error("Accès refusé : réservé aux créateurs")
    }

    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_creator", (q) => q.eq("creatorId", currentUser._id))
      .filter((q) => q.eq(q.field("status"), "succeeded"))
      .collect()

    // Taux de conversion USD → XAF
    const USD_TO_XAF_RATE = 562.2

    const normalizeToXAF = (amount: number, currency: string): number => {
      if (currency.toUpperCase() === "USD") {
        return amount * USD_TO_XAF_RATE
      }
      return amount
    }

    const totalGross = allTransactions.reduce((sum, tx) => {
      return sum + normalizeToXAF(tx.amount, tx.currency)
    }, 0)

    const CREATOR_COMMISSION_RATE = 0.6
    const totalNetEarned = totalGross * CREATOR_COMMISSION_RATE

    const getLastThursdayOfMonth = (year: number, month: number): Date => {
      const lastDay = new Date(year, month + 1, 0)

      const daysToSubtract = (lastDay.getDay() - 4 + 7) % 7

      const lastThursday = new Date(year, month + 1, 0)
      lastThursday.setDate(lastDay.getDate() - daysToSubtract)
      lastThursday.setHours(0, 0, 0, 0)

      return lastThursday
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    const lastThursdayThisMonth = getLastThursdayOfMonth(
      currentYear,
      currentMonth,
    )

    let nextPaymentDate: Date
    let lastPaymentDate: Date

    if (now < lastThursdayThisMonth) {
      nextPaymentDate = lastThursdayThisMonth
      lastPaymentDate = getLastThursdayOfMonth(
        currentMonth === 0 ? currentYear - 1 : currentYear,
        currentMonth === 0 ? 11 : currentMonth - 1,
      )
    } else {
      nextPaymentDate = getLastThursdayOfMonth(
        currentMonth === 11 ? currentYear + 1 : currentYear,
        currentMonth === 11 ? 0 : currentMonth + 1,
      )
      lastPaymentDate = lastThursdayThisMonth
    }

    const lastPaymentTimestamp = lastPaymentDate.getTime()

    const pendingTransactions = allTransactions.filter(
      (tx) => tx._creationTime >= lastPaymentTimestamp,
    )

    const nextPaymentGross = pendingTransactions.reduce((sum, tx) => {
      return sum + normalizeToXAF(tx.amount, tx.currency)
    }, 0)

    const nextPaymentNet = nextPaymentGross * CREATOR_COMMISSION_RATE

    return {
      totalNetEarned: Math.round(totalNetEarned),
      nextPaymentNet: Math.round(nextPaymentNet),
      nextPaymentDate: nextPaymentDate.toISOString(),
      currency: "XAF",
      transactionCount: allTransactions.length,
      pendingTransactionCount: pendingTransactions.length,
    }
  },
})
