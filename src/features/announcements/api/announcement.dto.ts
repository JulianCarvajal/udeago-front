interface AnnouncementRelationDto {
  id?: string
  _id?: string
  name?: string
  email?: string
  status?: string
  rol?: string
}

export interface AnnouncementApiDto {
  id: string
  title: string
  description: string
  date?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  status?: AnnouncementRelationDto | string | null
  user?: AnnouncementRelationDto | string | null
}

export interface AnnouncementApiUpsertDto {
  title: string
  description: string
  id_status: string
}