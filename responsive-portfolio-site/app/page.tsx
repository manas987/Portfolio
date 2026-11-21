'use client'

import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Menu, X } from 'lucide-react'

const videoSrc = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Timeline%20Video%20%281%29-LNf3pahsSueggGJyUQzXSdjQBXKf1f.mp4'

const projects = [
  { number: '01', title: 'Aster Studio', type: 'Brand world / 2024', color: 'project-coral' },
  { number: '02', title: 'Nocturne Type', type: 'Digital experience / 2023', color: 'project-lime' },
  { number: '03', title: 'Orbit Objects', type: 'E-commerce direction / 2023', color: 'project-blue' },
]

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')),
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((element) => reveal.observe(element))
    return () => reveal.disconnect()
  }, [])

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Manas home">M<span>.</span></a>
        <nav className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
          <a href="#work" onClick={() => setMenuOpen(false)}>Work</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-video-wrap" aria-hidden="true">
          <video className="hero-video" autoPlay muted loop playsInline poster="/placeholder.jpg">
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="video-wash" />
        </div>
        <div className="hero-content">
          <p className="eyebrow reveal">Independent designer · developer</p>
          <h1 className="hero-title reveal">Hi, I'm <em>Manas</em>.<br />I make things <span>move.</span></h1>
          <div className="hero-bottom reveal">
            <p>Digital experiences with a pulse.<br />Based anywhere, working everywhere.</p>
            <a className="circle-link" href="#work" aria-label="Explore selected work"><ArrowDownRight size={22} /></a>
          </div>
        </div>
        <div className="hero-index">SCROLL TO EXPLORE <span>01 / 04</span></div>
      </section>

      <section id="about" className="intro-section content-section">
        <div className="section-label reveal">/ 01 — About</div>
        <div className="intro-copy reveal">
          <p className="statement">I turn sharp ideas into <i>memorable</i> digital spaces.</p>
          <p className="body-copy">Manas is a multidisciplinary creative developer focused on brand, interaction, and the little details that make a screen feel alive. I collaborate with curious people and ambitious teams to build work with a point of view.</p>
          <a className="text-link" href="#contact">More about me <ArrowUpRight size={16} /></a>
        </div>
      </section>

      <section id="work" className="work-section content-section">
        <div className="section-heading reveal"><div className="section-label">/ 02 — Selected work</div><p>Recent experiments & commissions</p></div>
        <div className="project-list">
          {projects.map((project) => (
            <a href="#contact" className={`project-card ${project.color} reveal`} key={project.number}>
              <span className="project-number">{project.number}</span>
              <div className="project-orb" aria-hidden="true"><div /></div>
              <div className="project-info"><p>{project.type}</p><h2>{project.title}</h2></div>
              <span className="project-arrow"><ArrowUpRight size={25} /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="services-section content-section">
        <div className="section-label reveal">/ 03 — What I do</div>
        <div className="service-grid reveal">
          {['Creative direction', 'Web design & build', 'Motion & interaction'].map((service, index) => <div className="service-item" key={service}><span>0{index + 1}</span><h3>{service}</h3><p>Strategy, systems, and expressive execution from first thought to final frame.</p></div>)}
        </div>
      </section>

      <section id="contact" className="contact-section content-section">
        <p className="eyebrow reveal">Have a good one in mind?</p>
        <h2 className="contact-title reveal">Let's make<br /><i>something</i> happen.</h2>
        <a className="contact-button reveal" href="mailto:hello@manas.design">Start a conversation <ArrowUpRight size={18} /></a>
      </section>

      <footer className="site-footer"><span>© 2025 Manas</span><span>Designed & built with intent</span><a href="#top">Back to top ↑</a></footer>
    </main>
  )
}
