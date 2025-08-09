// components/sections/HeroSection.tsx
import { Github, Linkedin, Mail } from 'lucide-react'

export function HeroSection() {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Profile Image - if you have one */}
          <div className="mb-8">
            <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden">
              {/* Add your profile image here */}
              <img 
                src="/assets/profile.jpg" 
                alt="Junho Choi"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Hi, I&apos;m <span className="text-blue-600">Junho Choi</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
            Full Stack Developer passionate about creating efficient, 
            scalable solutions and exploring machine learning applications
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button 
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              View My Work
            </button>
            <button 
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200"
            >
              About Me
            </button>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-6">
            <a 
              href="https://github.com/choiboy92" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 text-gray-600 hover:text-blue-600 transition-colors duration-200 hover:scale-110 transform"
            >
              <Github size={24} />
            </a>
            <a 
              href="https://linkedin.com/in/choiboy92" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 text-gray-600 hover:text-blue-600 transition-colors duration-200 hover:scale-110 transform"
            >
              <Linkedin size={24} />
            </a>
            <a 
              href="mailto:your.email@example.com"
              className="p-3 text-gray-600 hover:text-blue-600 transition-colors duration-200 hover:scale-110 transform"
            >
              <Mail size={24} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
