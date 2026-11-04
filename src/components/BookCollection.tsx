import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookCover } from './BookCover';
import type { Book } from '@/lib/books';
export function BookCollection({books}:{books:Book[]}) {return <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">{books.map(book=><div key={book.id} className="min-w-0"><Link to="/library/$bookId" params={{bookId:book.id}} className="group min-w-0"><BookCover book={book}/><p className="mt-5 text-xs font-medium uppercase text-accent-foreground">{book.access==='free'?'Free to explore':'Paid publication'}</p><h3 className="mt-2 flex items-start justify-between gap-2 font-display text-xl text-foreground">{book.title}<ArrowUpRight className="mt-1 size-4 shrink-0 text-primary"/></h3><p className="mt-1 text-sm text-muted-foreground">{book.subtitle || book.creator}</p></Link>{book.description&&<p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{book.description}</p>}<Button asChild variant="outline" className="mt-4"><Link to="/library/$bookId" params={{bookId:book.id}}>Open Book</Link></Button></div>)}</div>;}
