import type { ChecklistItem } from '@/types'

interface StorageOptions {
  dbName?: string
  version?: number
}

export class StorageService {
  private dbName: string
  private version: number
  private db?: IDBDatabase
  private initPromise?: Promise<void>

  constructor(options: StorageOptions = {}) {
    this.dbName = options.dbName || 'ChecklistDB'
    this.version = options.version || 1
  }

  async init(): Promise<void> {
    if (this.db) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        this.initPromise = undefined
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        this.initPromise = undefined
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('checklists')) {
          const store = db.createObjectStore('checklists', {
            keyPath: 'id'
          })
          store.createIndex('date', 'date', { unique: false })
          store.createIndex('completed', 'completed', { unique: false })
        }

        if (!db.objectStoreNames.contains('forgetCurves')) {
          db.createObjectStore('forgetCurves', {
            keyPath: 'itemId'
          })
        }

        if (!db.objectStoreNames.contains('statistics')) {
          const store = db.createObjectStore('statistics', {
            keyPath: 'date'
          })
          store.createIndex('date', 'date', { unique: true })
        }
      }
    })

    return this.initPromise
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }

    if (!this.db) {
      throw new Error('Database has not been initialized')
    }

    return this.db
  }

  private sortItems(items: ChecklistItem[]): ChecklistItem[] {
    return [...items].sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      return a.createdAt.getTime() - b.createdAt.getTime()
    })
  }

  async saveItem(item: ChecklistItem): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['checklists'], 'readwrite')
      const store = transaction.objectStore('checklists')
      const request = store.put({
        ...item,
        date: item.date.getTime(),
        reviewOccurrenceDate: item.reviewOccurrenceDate?.getTime(),
        reviewHistory: item.reviewHistory?.map((entry) => ({
          ...entry,
          occurrenceDate: entry.occurrenceDate.getTime(),
          completedAt: entry.completedAt.getTime()
        })),
        forgetCurveData: item.forgetCurveData
          ? {
              ...item.forgetCurveData,
              nextReviewDate: item.forgetCurveData.nextReviewDate.getTime(),
              lastReviewDate: item.forgetCurveData.lastReviewDate.getTime()
            }
          : undefined
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getItem(id: string): Promise<ChecklistItem | undefined> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['checklists'], 'readonly')
      const store = transaction.objectStore('checklists')
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const data = request.result
        if (data) {
          data.date = new Date(data.date)
          if (data.reviewOccurrenceDate) {
            data.reviewOccurrenceDate = new Date(data.reviewOccurrenceDate)
          }
          if (Array.isArray(data.reviewHistory)) {
            data.reviewHistory = data.reviewHistory.map((entry: {
              id: string
              occurrenceDate: number | Date
              completedAt: number | Date
              completedDurationMs?: number
            }) => ({
              ...entry,
              occurrenceDate: new Date(entry.occurrenceDate),
              completedAt: new Date(entry.completedAt)
            }))
          }
          data.createdAt = new Date(data.createdAt)
          if (data.completedAt) {
            data.completedAt = new Date(data.completedAt)
          }
          if (data.forgetCurveData) {
            data.forgetCurveData.nextReviewDate = new Date(data.forgetCurveData.nextReviewDate)
            data.forgetCurveData.lastReviewDate = new Date(data.forgetCurveData.lastReviewDate)
          }
        }
        resolve(data)
      }
    })
  }

  async getItemsByDate(date: Date): Promise<ChecklistItem[]> {
    const db = await this.ensureDb()

    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)

    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['checklists'], 'readonly')
      const store = transaction.objectStore('checklists')
      const index = store.index('date')
      const range = IDBKeyRange.bound(dateStart.getTime(), dateEnd.getTime())
      const request = index.getAll(range)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const items = request.result as Array<ChecklistItem & {
          date: number
          reviewOccurrenceDate?: number
          reviewHistory?: Array<{
            id: string
            occurrenceDate: number | Date
            completedAt: number | Date
            completedDurationMs?: number
          }>
          createdAt: number | Date
          completedAt?: number | Date
          forgetCurveData?: ChecklistItem['forgetCurveData'] & {
            nextReviewDate: number | Date
            lastReviewDate: number | Date
          }
        }>

        resolve(
          this.sortItems(
            items.map((storedItem) => ({
              ...storedItem,
              date: new Date(storedItem.date),
              reviewOccurrenceDate: storedItem.reviewOccurrenceDate
                ? new Date(storedItem.reviewOccurrenceDate)
                : undefined,
              reviewHistory: storedItem.reviewHistory?.map((entry) => ({
                ...entry,
                occurrenceDate: new Date(entry.occurrenceDate),
                completedAt: new Date(entry.completedAt)
              })),
              createdAt: new Date(storedItem.createdAt),
              completedAt: storedItem.completedAt
                ? new Date(storedItem.completedAt)
                : undefined,
              forgetCurveData: storedItem.forgetCurveData
                ? {
                    ...storedItem.forgetCurveData,
                    nextReviewDate: new Date(storedItem.forgetCurveData.nextReviewDate),
                    lastReviewDate: new Date(storedItem.forgetCurveData.lastReviewDate)
                  }
                : undefined
            }))
          )
        )
      }
    })
  }

  async getAllItems(): Promise<ChecklistItem[]> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['checklists'], 'readonly')
      const store = transaction.objectStore('checklists')
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const items = request.result as Array<
          ChecklistItem & {
            date: number
            reviewOccurrenceDate?: number
            reviewHistory?: Array<{
              id: string
              occurrenceDate: number | Date
              completedAt: number | Date
              completedDurationMs?: number
            }>
            createdAt: number | Date
            completedAt?: number | Date
            forgetCurveData?: ChecklistItem['forgetCurveData'] & {
              nextReviewDate: number | Date
              lastReviewDate: number | Date
            }
          }
        >

        resolve(
          this.sortItems(
            items.map((storedItem) => ({
              ...storedItem,
              date: new Date(storedItem.date),
              reviewOccurrenceDate: storedItem.reviewOccurrenceDate
                ? new Date(storedItem.reviewOccurrenceDate)
                : undefined,
              reviewHistory: storedItem.reviewHistory?.map((entry) => ({
                ...entry,
                occurrenceDate: new Date(entry.occurrenceDate),
                completedAt: new Date(entry.completedAt)
              })),
              createdAt: new Date(storedItem.createdAt),
              completedAt: storedItem.completedAt ? new Date(storedItem.completedAt) : undefined,
              forgetCurveData: storedItem.forgetCurveData
                ? {
                    ...storedItem.forgetCurveData,
                    nextReviewDate: new Date(storedItem.forgetCurveData.nextReviewDate),
                    lastReviewDate: new Date(storedItem.forgetCurveData.lastReviewDate)
                  }
                : undefined
            }))
          )
        )
      }
    })
  }

  async deleteItem(id: string): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['checklists'], 'readwrite')
      const store = transaction.objectStore('checklists')
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = undefined
    }
  }
}

export const storageService = new StorageService()
