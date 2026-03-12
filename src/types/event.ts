export interface Event {
    id: number;
    title: string;
    description: string;
    categoryId: string;
    pubDate: string;
    dateStart: string;
    dateEnd?: string;
    managerId: number;
    virtual: boolean;
    link?: string;
    imageUrl?: string;
    videoUrl?: string;
    status: 'active' | 'cancelled' | 'draft';
}