import { describe, it, expect } from 'vitest';
import { filterBooks, artworkKey, bookSchema, type Book } from '@/lib/books';
const base:Book={id:'00000000-0000-4000-8000-000000000001',title:'Reflection Garden',subtitle:'Colour and notice',description:'A collection',creator:'Melineaire',categories:['Reflect While Colouring'],themes:['Stillness'],page_count:12,access:'free',status:'published',featured:true,sort_order:0,cover_path:null,preview_paths:[],preview_urls:[],pdf_path:null,sections:[]};
describe('Publication rules',()=>{
 it('searches books by title and theme',()=>{expect(filterBooks([base],'garden','','')).toHaveLength(1);expect(filterBooks([base],'stillness','','')).toHaveLength(1);expect(filterBooks([base],'unrelated','','')).toHaveLength(0);});
 it('filters category, theme and free or paid access',()=>{const paid={...base,id:'paid',access:'paid' as const};expect(filterBooks([base,paid],'','Reflect While Colouring','free','Stillness')).toEqual([base]);expect(filterBooks([base],'','Prayer','free')).toEqual([]);});
 it('keeps artwork separate for every book section',()=>{expect(artworkKey('one','first')).not.toBe(artworkKey('one','second'));expect(artworkKey('one','first')).not.toBe(artworkKey('two','first'));expect(artworkKey()).toBe('melineaire.artwork');});
 it('requires a title for a publishable book',()=>{expect(bookSchema.safeParse({...base,title:''}).success).toBe(false);expect(bookSchema.safeParse(base).success).toBe(true);});
 it('accepts only free or paid and draft or published statuses',()=>{expect(bookSchema.safeParse({...base,access:'pretend-purchase'}).success).toBe(false);expect(bookSchema.safeParse({...base,status:'public-draft'}).success).toBe(false);});
});
