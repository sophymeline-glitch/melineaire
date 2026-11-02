import { queryOptions } from '@tanstack/react-query';
import { getBooks } from './books.functions';
export const booksOptions = (id?: string) => queryOptions({queryKey:['books',id ?? 'all'],queryFn:()=>getBooks({data:id?{id}:{}}),staleTime:600000});
