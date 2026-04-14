export interface EventCategory {
    id: string
    name: string
}

export interface EventStatus {
    id: string
    status: string
}

export interface EventManager {
    id: string
    name?: string
    email?: string
}

export interface Event {
    id: string
    title: string
    description: string
    pubDate: string
    dateStart: string
    dateEnd?: string
    virtual: boolean
    link?: string
    videoUrl?: string
    imageUrl?: string
    location?: string
    capacity?: number
    category: EventCategory | null
    status: EventStatus | null
    manager: EventManager | null
    deletedAt?: string | null
}