// components/layout/Hero.tsx
import { Button } from '@/components/ui/button'
import { ArrowDown, Github, Linkedin, Mail } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
      <div className="container text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Hi, I'm <span className="text-primary">Junho Choi</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Full Stack Developer specializing in modern web technologies and machine learning
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/projects">View My Work</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/about">About Me</Link>
          </Button>
        </div>

        <div className="flex justify-center space-x-6">
          <Button variant="ghost" size="icon" asChild>
            <a href="https://github.com/choiboy92" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="https://linkedin.com/in/choiboy92" target="_blank" rel="noopener noreferrer">
              <Linkedin className="h-5 w-5" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a href="mailto:your.email@example.com">
              <Mail className="h-5 w-5" />
            </a>
          </Button>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
    </section>
  )
}
