export interface AnnouncementStatus {
  id: string
  status: string
}

export interface AnnouncementAuthor {
  id: string
  name?: string
  email?: string
}

export interface Announcement {
  id: string
  title: string
  description: string
  date: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  status: AnnouncementStatus | null
  user: AnnouncementAuthor | null
}