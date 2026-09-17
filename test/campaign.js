(() => {
  'use strict';
  const CAMPAIGN='keep-the-small-good-20260913';
  const local=location.hostname==='127.0.0.1' && location.port==='4173';
  const API=local ? '/api' : 'https://posiside-campaign.alfienurse.workers.dev';
  const params=new URLSearchParams(location.search);
  const sources=new Set(['reddit_testers','founder_social','instagram']);
  const source=sources.has(params.get('utm_source')) && params.get('utm_campaign')===CAMPAIGN ? params.get('utm_source') : 'direct';
  const optedOut=navigator.doNotTrack==='1' || navigator.globalPrivacyControl===true;
  let allowed=false;
  async function post(path,data) {
    const response=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,signal:AbortSignal.timeout(10000),body:JSON.stringify(data)});
    if(!response.ok) throw new Error(response.status===429?'Busy':'Unavailable');
    return response.json();
  }
  function event(name) {
    if(!allowed) return;
    post('/events',{event:name,source,campaign:CAMPAIGN,consent:true}).catch(()=>{});
  }
  const choice=document.getElementById('measurement-status');
  const allow=document.getElementById('allow-counts');
  allow.addEventListener('click',()=>{
    if(optedOut) { choice.textContent='Your browser’s privacy preference is respected. Optional counts stay off.'; return; }
    if(!allowed){allowed=true;event('page_view');}
    choice.textContent='Counts allowed for this page. Choose No thanks to stop.';
  });
  document.getElementById('decline-counts').addEventListener('click',()=>{allowed=false;choice.textContent='Optional counts are off. You can still request an invitation.';});
  if(optedOut){allow.disabled=true;choice.textContent='Your browser’s privacy preference keeps optional counts off.';}
  document.querySelectorAll('[data-event]').forEach(a=>a.addEventListener('click',()=>event(a.dataset.event)));
  const form=document.getElementById('invite-form'), status=document.getElementById('form-status');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!form.reportValidity())return;
    const button=form.querySelector('button[type=submit]');
    if(button.disabled)return;
    event('form_submit'); button.disabled=true; button.textContent='Sending…'; status.textContent='';
    try {
      const result=await post('/signup',{email:form.elements.email.value,consent:form.elements.consent.checked,website:form.elements.website.value,source:allowed?source:'unattributed',campaign:CAMPAIGN});
      if(result.received!==true)throw new Error('Unavailable');
      status.dataset.state='success';
      status.textContent='Request received. We’ll review it and contact you about access. You are not enrolled yet; an invitation and timing are not guaranteed.';
      form.reset();
    }catch(error){
      status.dataset.state='error';
      status.textContent=error.message==='Busy'?'The form is busy. Please try again in a few minutes or use the support email below.':'We could not confirm your request was saved. Please try again or use the support email below.';
    }finally{button.disabled=false;button.textContent='Request invitation';status.focus();}
  });
})();
