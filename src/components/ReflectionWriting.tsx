import { useEffect, useState } from 'react';
import { useMember } from './MemberProvider';
import { Button } from './ui/button';
import { readNote, storeNote } from '@/lib/private-saves';

export function ReflectionWriting({bookId,sectionId,prompt}:{bookId:string;sectionId:string;prompt:string}) {
 const {user,loading}=useMember();
 const [text,setText]=useState('');const [busy,setBusy]=useState(true);const [failed,setFailed]=useState(false);const [message,setMessage]=useState('');
 const key=`melineaire.note.${bookId}.${sectionId}`;
 useEffect(()=>{if(loading)return;let active=true;setText('');setBusy(true);setFailed(false);setMessage('');
 void (async()=>{try{const value=user?await readNote(user.id,bookId,sectionId):localStorage.getItem(key)??'';if(active)setText(value);}catch{if(active){setFailed(true);setMessage('Writing could not be loaded. Reload before saving.');}}finally{if(active)setBusy(false);}})();
 return()=>{active=false;};},[user?.id,loading,bookId,sectionId,key]);
 const save=async()=>{setBusy(true);try{if(user){await storeNote(user.id,bookId,sectionId,text);if(await readNote(user.id,bookId,sectionId)!==text)throw new Error('Not verified');}else localStorage.setItem(key,text);setMessage(user?'Writing saved privately to your account.':'Writing saved on this device.');}catch{setMessage('Writing was not saved. Please try again.');}finally{setBusy(false);}};
 return <section className="mt-10 border-t border-border pt-8"><h2 className="text-3xl">My writing</h2>{prompt&&<p className="mt-4 whitespace-pre-wrap leading-7">{prompt}</p>}<label className="mt-5 block text-sm">Personal reflection<textarea aria-label="Personal reflection" className="field mt-2" rows={6} value={text} disabled={busy||failed} onChange={e=>setText(e.target.value)}/></label><Button className="mt-4" disabled={busy||failed} onClick={()=>void save()}>Save writing</Button><p role="status" className="mt-3 text-sm text-muted-foreground">{busy?'Loading…':message|| (user?'Private to your account.':'Device-only writing. Sign in for account saving.')}</p></section>;
}