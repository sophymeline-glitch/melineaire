import { useState } from 'react';
import { CircleHelp, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { helpArticles } from '@/lib/help';
const tutorial=helpArticles.find(a=>a.id==='tools')?.steps ?? [];
export function StudioHelp(){const[open,setOpen]=useState(false);const[step,setStep]=useState(0);return <Dialog open={open} onOpenChange={setOpen}><Button variant="outline" onClick={()=>{setStep(0);setOpen(true);}}><CircleHelp/>Help</Button><DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto"><DialogTitle>Colour Studio help</DialogTitle><DialogDescription>Step {step+1} of {tutorial.length}</DialogDescription><CircleHelp className="my-3 size-12 text-primary"/><p className="leading-7">{tutorial[step]}</p><div className="flex items-center justify-between gap-2"><Button variant="outline" size="icon" aria-label="Previous tutorial step" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ArrowLeft/></Button><Button variant="ghost" onClick={()=>setStep(0)}><RotateCcw/>Replay</Button><Button variant="outline" size="icon" aria-label="Next tutorial step" disabled={step===tutorial.length-1} onClick={()=>setStep(s=>s+1)}><ArrowRight/></Button></div><p className="text-sm text-muted-foreground">Save keeps your colour on this device. Export image downloads your finished artwork.</p><Button asChild variant="link"><Link to="/help">Help & Support</Link></Button></DialogContent></Dialog>;}
