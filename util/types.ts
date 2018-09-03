// описания разных простых типов

export type MapObject<T> = { [key: string]: T }
export type RoMapObject<T> = { readonly [key: string]: T }
export type Async<T> = T | Promise<T>