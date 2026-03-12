export interface EventApiDto {
  id: number
  title: string
  description: string
  category: string | null
  pub_date: string
  date_start: string
  date_end: string | null
  manager: number
  virtual: boolean
  link: string | null
  image_url: string | null
  video: string | null
  status: string
}

export interface EventApiUpsertDto {
  title: string
  description: string
  category: string | null
  date_start: string
  date_end: string | null
  virtual: boolean
  link: string | null
  image_url: string | null
  video: string | null
  status: string
}