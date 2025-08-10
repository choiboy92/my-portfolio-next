'use client'

import Link from 'next/link'

export default function SideQuickNav() {
  const projects = [
    { href: '/projects/apple', title: 'APPLE' },
    { href: '/projects/engdes', title: 'ENGINEERING DESIGN' },
    { href: '/projects/neutoy', title: 'NEUTOY' },
    { href: '/projects/kitchen', title: 'ACCESSIBLE KITCHENS' },
    { href: '/projects/presweather', title: 'PRESENT WEATHER NN' },
    { href: '/projects/jsviewhkl', title: 'JSVIEWHKL' }
  ]

  return (
    <div id="sideWrapper" style={{
      position: 'fixed',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 10
    }}>
      {projects.map((project, index) => (
        <div key={index}>
          <Link href={project.href} className="headLink">
            <p className="sideQuickNav" style={{
              fontSize: '15px',
              writingMode: 'vertical-rl',
              transform: 'scale(-1)',
              textDecoration: 'none',
              transition: 'font-size 0.2s',
              margin: 0,
              padding: '5px'
            }}>
              {project.title}
            </p>
          </Link>
          {index < projects.length - 1 && (
            <p style={{
              margin: '5px auto',
              textAlign: 'center',
              fontWeight: '500',
              color: 'white'
            }}>
              .
            </p>
          )}
        </div>
      ))}
    </div>
  )
}