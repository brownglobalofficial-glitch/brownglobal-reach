import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import AuthPanel from "./AuthPanel";
import { supabase } from "./supabase";

const inventory = [
  { id:"gsn", name:"GSN Network", type:"Sports media", audience:"Sports", price:350, copy:"Sponsored stories, social placements and network visibility.", tone:"green" },
  { id:"next", name:"GSN Next League", type:"League partnership", audience:"Youth sport", price:900, copy:"Season, matchday and player-development sponsorship opportunities.", tone:"orange" },
  { id:"wave", name:"BrownGlobal Wave", type:"Video & channels", audience:"Entertainment", price:500, copy:"Pre-roll, channel sponsorship and original-programming integrations.", tone:"violet" },
  { id:"kaieteur", name:"Kaieteur House", type:"Publishing", audience:"Readers", price:180, copy:"Book spotlights, reader campaigns and publishing partnerships.", tone:"blue" },
  { id:"network", name:"BrownGlobal Network", type:"Multi-property", audience:"Broad", price:1200, copy:"A coordinated campaign across eligible BrownGlobal properties.", tone:"lime" },
];
const filters = ["All", "Sports", "Youth sport", "Entertainment", "Readers", "Broad"];

export default function App(){
  const [filter,setFilter] = useState("All");
  const [selected,setSelected] = useState<string[]>(["gsn","wave"]);
  const [months,setMonths] = useState(1);
  const [session,setSession] = useState<Session | null>(null);
  const [authOpen,setAuthOpen] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const [businessName,setBusinessName] = useState("");
  const [objective,setObjective] = useState("");
  const [launchDate,setLaunchDate] = useState("");
  const [submitStatus,setSubmitStatus] = useState("");
  const [submitting,setSubmitting] = useState(false);
  const shown = filter === "All" ? inventory : inventory.filter(item => item.audience === filter);
  const estimate = useMemo(()=>inventory.filter(item=>selected.includes(item.id)).reduce((sum,item)=>sum+item.price,0)*months,[selected,months]);
  const toggle=(id:string)=>setSelected(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submitCampaign() {
    if (!supabase || !session) {
      setSubmitStatus("Create or sign in to your free BrownGlobal account to save this campaign request.");
      setAuthOpen(true);
      return;
    }
    if (!businessName.trim() || !objective.trim() || selected.length === 0) {
      setSubmitStatus("Add your business name, campaign goal and at least one placement.");
      return;
    }
    setSubmitting(true);
    setSubmitStatus("");
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", session.user.id)
      .limit(1)
      .maybeSingle();
    let organizationId = existing?.id;
    if (!organizationId) {
      const { data: created, error: organizationError } = await supabase
        .from("organizations")
        .insert({ name: businessName.trim(), owner_id: session.user.id })
        .select("id")
        .single();
      if (organizationError) {
        setSubmitStatus(organizationError.message);
        setSubmitting(false);
        return;
      }
      organizationId = created.id;
    }
    const contactName = String(session.user.user_metadata.full_name || session.user.email?.split("@")[0] || "BrownGlobal member");
    const { data: request, error } = await supabase
      .from("campaign_requests")
      .insert({
        organization_id: organizationId,
        business_name: businessName.trim(),
        contact_name: contactName,
        contact_email: session.user.email || "",
        objective: objective.trim(),
        preferred_launch_date: launchDate || null,
        duration_months: months,
        starting_estimate: estimate,
        created_by: session.user.id,
      })
      .select("id")
      .single();
    if (error) {
      setSubmitStatus(error.message);
      setSubmitting(false);
      return;
    }
    const placements = inventory
      .filter(item => selected.includes(item.id))
      .map(item => ({
        campaign_request_id: request.id,
        property_key: item.id,
        property_name: item.name,
        starting_price: item.price,
      }));
    const { error: placementError } = await supabase.from("campaign_request_placements").insert(placements);
    setSubmitting(false);
    setSubmitStatus(placementError ? placementError.message : "Campaign request saved. The Reach team can now review it and prepare the written plan.");
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setSubmitStatus("You are signed out.");
  }
  return <main>
    <header className="topbar"><a className="wordmark" href="#top" onClick={()=>setMenuOpen(false)}><img src="/reach-logo.svg" alt=""/><span>BrownGlobal <b>Reach</b></span></a><nav id="primary-navigation" className={menuOpen ? "open" : ""} aria-label="Primary navigation"><a href="#network" onClick={()=>setMenuOpen(false)}>Network</a><a href="#planner" onClick={()=>setMenuOpen(false)}>Campaign planner</a><a href="#process" onClick={()=>setMenuOpen(false)}>How it works</a><a href="#plans" onClick={()=>setMenuOpen(false)}>Pricing</a><a className="mobile-nav-cta" href="#planner" onClick={()=>setMenuOpen(false)}>Plan a campaign <span>↗</span></a></nav><div className="account-actions"><a className="button dark small desktop-cta" href="#planner">Plan a campaign <span>↗</span></a><button className="menu-button" aria-controls="primary-navigation" aria-expanded={menuOpen} onClick={()=>setMenuOpen(open=>!open)}>{menuOpen ? "Close" : "Menu"}</button><button className={"account-button " + (session ? "signed" : "")} onClick={session ? signOut : () => setAuthOpen(true)}>{session ? "Sign out" : "Sign up"}</button></div></header>
    <section className="hero" id="top"><div className="hero-copy"><span className="eyebrow"><i/>Direct advertising & sponsorships</span><h1>Put your brand in the <em>right moments.</em></h1><p>Plan thoughtful campaigns across sports, streaming, publishing and BrownGlobal-owned experiences&mdash;with a real team reviewing every placement.</p><div className="actions"><a className="button primary" href="#planner">Build a campaign <span>→</span></a><a className="text-link" href="mailto:admin@brownglobal.app?subject=BrownGlobal%20Reach%20media%20kit">Request the media kit ↗</a></div></div><div className="campaign-card"><div className="campaign-head"><span>CAMPAIGN 01</span><b>Community in motion.</b><span>PLANNING</span></div><div className="campaign-visual"><div className="rings"><i/><i/><i/></div><strong>REACH<br/>THE<br/>MOMENT.</strong><span>GSN &times; WAVE</span></div><div className="campaign-foot"><div><small>OBJECTIVE</small><b>Awareness</b></div><div><small>PLACEMENTS</small><b>04</b></div><div><small>REVIEW</small><b>Human-led</b></div></div></div></section>
    <div className="promise"><span>DIRECT PARTNERSHIPS</span><b>&bull;</b><span>BRAND-SAFE REVIEW</span><b>&bull;</b><span>CLEAR REPORTING</span><b>&bull;</b><span>NO BEHAVIORAL TARGETING</span></div>
    <section className="network" id="network"><div className="section-intro"><span className="eyebrow light"><i/>The network</span><h2>Different audiences.<br/>One campaign team.</h2><p>Choose a property or let Reach assemble the right combination around your objective.</p></div><div className="inventory-grid">{inventory.map((item,index)=><article className={item.tone} key={item.id}><span className="number">0{index+1}</span><div className="property-mark">{item.name.split(" ").map(word=>word[0]).join("").slice(0,2)}</div><div><small>{item.type}</small><h3>{item.name}</h3><p>{item.copy}</p></div><footer><span>From ${item.price.toLocaleString()} USD</span><button onClick={()=>{toggle(item.id);document.getElementById("planner")?.scrollIntoView()}}>Add to plan &rarr;</button></footer></article>)}</div></section>
    <section className="planner" id="planner"><div className="planner-copy"><span className="eyebrow"><i/>Campaign planner</span><h2>Start with the places that fit.</h2><p>Select opportunities to create a planning estimate. Final pricing follows a campaign review, availability check and written proposal.</p><aside><b>BrownGlobal Business member?</b><span>Eligible plans can receive priority campaign planning, shared brand tools and team collaboration.</span></aside></div><div className="planner-card"><div className="planner-head"><div><small>STEP 01</small><h3>Choose your placements</h3></div><span>{selected.length} selected</span></div><div className="filters">{filters.map(item=><button className={filter===item?"active":""} onClick={()=>setFilter(item)} key={item}>{item}</button>)}</div><div className="list">{shown.map(item=><button className={selected.includes(item.id)?"selected":""} onClick={()=>toggle(item.id)} key={item.id}><span className="box">{selected.includes(item.id)?"\u2713":""}</span><span><b>{item.name}</b><small>{item.type}</small></span><strong>${item.price.toLocaleString()}+</strong></button>)}</div><div className="duration"><label htmlFor="months">Planning duration</label><select id="months" value={months} onChange={event=>setMonths(Number(event.target.value))}><option value="1">1 month</option><option value="2">2 months</option><option value="3">3 months</option></select></div><div className="product-fields"><label>Business name<input value={businessName} onChange={event=>setBusinessName(event.target.value)} placeholder="Your business or organization" /></label><label>Preferred launch date<input type="date" value={launchDate} onChange={event=>setLaunchDate(event.target.value)} /></label><label>Campaign goal<textarea value={objective} onChange={event=>setObjective(event.target.value)} placeholder="What should this campaign accomplish?" /></label></div><div className="estimate"><span><small>STARTING ESTIMATE</small><b>${estimate.toLocaleString()} <em>USD</em></b></span><button className="button primary" onClick={submitCampaign} disabled={submitting}>{submitting ? "Saving..." : session ? "Save my request" : "Sign up to continue"} <span>&rarr;</span></button></div>{submitStatus && <p className="submit-status" role="status">{submitStatus}</p>}</div></section>
    <section className="process" id="process"><div className="section-intro centered"><span className="eyebrow light"><i/>How Reach works</span><h2>Clear from brief to report.</h2></div><div className="steps">{[["01","Share the goal","Tell us what the campaign should accomplish, who it is for and when it should run."],["02","Build the plan","Reach confirms eligible properties, formats, pricing, disclosures and availability."],["03","Approve & launch","You approve the written proposal and creative before any campaign begins."],["04","Review results","Receive a straightforward summary of completed placements and available results."]].map(step=><article key={step[0]}><span>{step[0]}</span><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div></section>
    <section className="standards" id="standards"><div><span className="eyebrow"><i/>Reach standards</span><h2>Trust is part of the placement.</h2></div><div>{[["Clearly identified","Sponsored placements and material relationships should be presented plainly."],["Reviewed by people","Every advertiser and creative concept is checked before acceptance."],["Appropriate for the audience","Youth-focused inventory excludes betting, alcohol, tobacco, adult and misleading offers."],["Privacy-respecting","Reach starts with direct contextual placements\u2014not behavioral profiles or real-time auctions."]].map(item=><article key={item[0]}><b>{item[0]}</b><p>{item[1]}</p></article>)}</div></section>
    <section className="business" id="business"><div className="business-mark"><img src="/brownglobal-icon.svg" alt=""/><small>BROWNGLOBAL<br/>BUSINESS</small></div><div><span className="eyebrow"><i/>Managed in Studio</span><h2>Campaigns are one part of the business.</h2><p>Reach does not require a subscription. BrownGlobal Business adds priority planning, reusable business information and unified reporting while Studio remains the official place to view and manage the membership.</p></div><a className="button outline" href="https://brownglobal-studio.vercel.app/#plans">View Business in Studio <span>↗</span></a></section>
    <section className="plans" id="plans"><div className="plans-header"><span className="eyebrow"><i/>Reach pricing</span><h2>Plan for free. Pay for the campaign.</h2><p>There is no Reach subscription. Advertising budgets, sponsorship inventory and campaign services are priced separately after review.</p></div><div className="plan-grid"><article className="plan-card"><small>REACH ACCESS</small><h3>$0</h3><p>Available with a free BrownGlobal account.</p><ul><li>Campaign planner and saved requests</li><li>Written review before any campaign begins</li><li>Clear placement and service pricing</li><li>Standard campaign support</li></ul></article><article className="plan-card business-plan"><small>BROWNGLOBAL BUSINESS</small><h3>$14.99 per user/month</h3><p>$149.99 per user/year. Purchased and managed through BrownGlobal Studio.</p><ul><li>Studio Pro and Flow Pro included</li><li>Wave Premium and Learn Plus included</li><li>Priority Reach planning and unified reporting</li><li>Campaign costs and advertising spend remain separate</li></ul><a className="button primary" href="https://brownglobal-studio.vercel.app/#plans">See all subscriptions in Studio <span>↗</span></a></article></div></section>
    <section className="cta"><span className="eyebrow light"><i/>Start a conversation</span><h2>What should your brand reach next?</h2><a className="button primary" href="mailto:admin@brownglobal.app?subject=BrownGlobal%20Reach%20campaign">Plan a campaign <span>&rarr;</span></a></section>
    <footer className="site-footer"><a className="wordmark" href="#top"><img src="/reach-logo.svg" alt="BrownGlobal Reach logo"/><span>BrownGlobal <b>Reach</b></span></a><p>Direct advertising and sponsorships across the BrownGlobal network.</p><div><a href="mailto:admin@brownglobal.app">admin@brownglobal.app</a><span>&copy; 2026 BrownGlobal Holdings LLC</span></div></footer>
    <AuthPanel open={authOpen} onClose={()=>setAuthOpen(false)} product="Reach" />
  </main>;
}

