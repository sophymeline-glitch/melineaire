import { it, expect, describe } from 'vitest';
const url=process.env['SUPABASE_URL'], key=process.env['SUPABASE_PUBLISHABLE_KEY'], secret=process.env['SUPABASE_SERVICE_ROLE_KEY'];
describe.skipIf(!url||!key||!secret)('Private creative saves',()=>{
 it('stores progress and completed artwork but denies other accounts access',async()=>{await verify('artwork_saves',{artwork_key:'book.section',progress_png:'data:image/png;base64,progress',completed_png:'data:image/png;base64,completed'},'progress_png','data:image/png;base64,progress');},60000);
 it('keeps journal entries owner-only for reading and writing',async()=>{await verify('journal_entries',{id:crypto.randomUUID(),title:'Private',text:'Owner journal',feelings:[]},'text','Owner journal');},60000);
});
async function verify(table:string,row:Record<string,unknown>,field:string,value:string){
 if(!url||!key||!secret)throw new Error('Missing test connection');
 const admin={apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};
 const ids:string[]=[];
 const request=(path:string,headers:Record<string,string>,method='GET',body?:unknown)=>fetch(url+path,{method,headers,...(body?{body:JSON.stringify(body)}:{})});
 try{
 const sessions:{id:string;token:string}[]=[];
 for(let i=0;i<2;i++){const email=`creative-${crypto.randomUUID()}@example.com`,password=crypto.randomUUID()+'-Aa9';const created=await request('/auth/v1/admin/users',admin,'POST',{email,password,email_confirm:true});expect(created.ok).toBe(true);const user=await created.json();ids.push(user.id);const login=await request('/auth/v1/token?grant_type=password',{apikey:key,'Content-Type':'application/json'},'POST',{email,password});const session=await login.json();sessions.push({id:user.id,token:session.access_token});}
 const owner=sessions[0],other=sessions[1];if(!owner||!other)throw new Error('Missing users');
 const headers=(token:string)=>({apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'});
 expect((await request(`/rest/v1/${table}`,headers(owner.token),'POST',{...row,user_id:owner.id})).ok).toBe(true);
 const own=await request(`/rest/v1/${table}?user_id=eq.${owner.id}&select=*`,headers(owner.token));const saved=await own.json();expect(saved[0]?.[field]).toBe(value);
 if(table==='artwork_saves')expect(saved[0]?.completed_png).toBe('data:image/png;base64,completed');
 for(const h of [headers(other.token),{apikey:key}]){const r=await request(`/rest/v1/${table}?user_id=eq.${owner.id}&select=*`,h);if(r.ok)expect(await r.json()).toEqual([]);else expect(r.status).toBeGreaterThanOrEqual(400);}
 const denied=await request(`/rest/v1/${table}`,headers(other.token),'POST',{...row,user_id:owner.id});expect(denied.ok).toBe(false);
 await request(`/rest/v1/${table}?user_id=eq.${owner.id}`,headers(other.token),'DELETE');
 const remains=await request(`/rest/v1/${table}?user_id=eq.${owner.id}&select=*`,headers(owner.token));expect((await remains.json()).length).toBe(1);
 }finally{for(const id of ids){await request(`/rest/v1/${table}?user_id=eq.${id}`,admin,'DELETE');await request(`/auth/v1/admin/users/${id}`,admin,'DELETE');}}
}