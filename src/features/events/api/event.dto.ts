interface RelationApiDto {
  id?: string
  _id?: string
  name?: string
  status?: string
  rol?: string
  email?: string
}

export interface EventApiDto {
  id: string
  title: string
  description: string
  pubDate?: string
  pub_date?: string
  dateStart?: string
  date_start?: string
  dateEnd?: string | null
  date_end?: string | null
  virtual: boolean
  link?: string | null
  image?: string | null
  image_url?: string | null
  video?: string | null
  location?: string | null
  capacity?: number | null
  category?: RelationApiDto | string | null
  status?: RelationApiDto | string | null
  manager?: RelationApiDto | string | null
  deleted_at?: string | null
  deletedAt?: string | null
}

export interface EventApiUpsertDto {
  title: string
  description: string
  dateStart: string
  dateEnd?: string
  virtual: boolean
  link?: string
  image?: string
  video?: string
  location?: string
  capacity?: number
  id_category?: string
  id_status?: string
}