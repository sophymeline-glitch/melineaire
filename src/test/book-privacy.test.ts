import { it, expect, describe } from 'vitest';
const url=process.env['SUPABASE_URL']; const key=process.env['SUPABASE_PUBLISHABLE_KEY'];const secret=process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url||!key||!secret)('Publication access integration',()=>{
 it('allows administrator publishing but hides drafts and paid sections and files from visitors and members',async()=>{
 if(!url||!key||!secret)throw new Error('Unavailable');
 const privileged={apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};const ids:string[]=[];const bids:string[]=[];
 const request=(path:string,headers:Record<string,string>,method='GET',body?:unknown)=>fetch(url+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
 try{
 const sessions:{id:string;token:string}[]=[];
 for(let i=0;i<2;i++){const email=`books-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'-Aa9';const r=await request('/auth/v1/admin/users',privileged,'POST',{email,password,email_confirm:true});expect(r.ok).toBe(true);const u=await r.json();ids.push(u.id);const login=await request('/auth/v1/token?grant_type=password',{apikey:key,'Content-Type':'application/json'},'POST',{email,password});const session=await login.json();sessions.push({id:u.id,token:session.access_token});}
 const admin=sessions[0],member=sessions[1];if(!admin||!member)throw new Error('Unavailable');
 const role=await request('/rest/v1/user_roles',privileged,'POST',{user_id:admin.id,role:'admin'});expect(role.ok).toBe(true);
 const ah={apikey:key,Authorization:`Bearer ${admin.token}`,'Content-Type':'application/json'};const mh={apikey:key,Authorization:`Bearer ${member.token}`,'Content-Type':'application/json'};
 for(const [status,access] of [['draft','free'],['published','paid'],['published','free']]){const id=crypto.randomUUID();bids.push(id);const payload={id,title:'Access test',subtitle:'',description:'',creator:'Test',categories:[],themes:[],page_count:null,access,status,featured:false,sort_order:0,cover_path:null,preview_paths:[],pdf_path:'test-private.pdf',sections:[{id:crypto.randomUUID(),sort_order:0,title:'Private section',reflection:'Restricted reflection',scripture:'',questions:[],journal_prompt:'',illustration_path:null,audio_path:null,atmosphere_path:null}]};const saved=await request('/rest/v1/rpc/save_publication',ah,'POST',{payload});expect(saved.ok).toBe(true);const denied=await request('/rest/v1/rpc/save_publication',mh,'POST',{payload});expect(denied.ok).toBe(false);}
 const draft=bids[0],paid=bids[1],free=bids[2];if(!draft||!paid||!free)throw new Error('Missing books');
 for(const h of [{apikey:key},mh]){const d=await request(`/rest/v1/books?id=eq.${draft}&select=id`,h);expect(await d.json()).toEqual([]);for(const id of [draft,paid]){const s=await request(`/rest/v1/book_sections?book_id=eq.${id}&select=id`,h);expect(await s.json()).toEqual([]);const f=await request(`/rest/v1/book_files?book_id=eq.${id}&select=pdf_path`,h);expect(await f.json()).toEqual([]);}const f=await request(`/rest/v1/book_sections?book_id=eq.${free}&select=id`,h);expect((await f.json()).length).toBe(1);}
 const drafts=await request(`/rest/v1/books?id=eq.${draft}&select=id`,ah);expect(await drafts.json()).toEqual([{id:draft}]);
 }finally{for(const id of bids)await request(`/rest/v1/books?id=eq.${id}`,privileged,'DELETE');for(const id of ids)await request(`/auth/v1/admin/users/${id}`,privileged,'DELETE');}
 },60000);
});
