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

  async saveItem(item: ChecklistItem): Promise<void> {
    const db = await this.ensureDb()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['checklists'], 'readwrite')
      const store = transaction.objectStore('checklists')
      const request = store.put({
        ...item,
        date: item.date.getTime()
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
          data.createdAt = new Date(data.createdAt)
          if (data.completedAt) {
            data.completedAt = new Date(data.completedAt)
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
          createdAt: number | Date
          completedAt?: number | Date
        }>

        resolve(
          items.map((storedItem) => ({
            ...storedItem,
            date: new Date(storedItem.date),
            createdAt: new Date(storedItem.createdAt),
            completedAt: storedItem.completedAt
              ? new Date(storedItem.completedAt)
              : undefined
          }))
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
            createdAt: number | Date
            completedAt?: number | Date
          }
        >

        resolve(
          items.map((storedItem) => ({
            ...storedItem,
            date: new Date(storedItem.date),
            createdAt: new Date(storedItem.createdAt),
            completedAt: storedItem.completedAt ? new Date(storedItem.completedAt) : undefined
          }))
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
