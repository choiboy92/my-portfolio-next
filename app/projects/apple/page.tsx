'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ProjectIntro from '@/components/projects/ProjectIntro'
import SideQuickNav from '@/components/projects/SideQuickNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const description = "Independent project to help Apple find a way to tackle the prevalence of counterfeit products being sold on online platforms"
const role = "IS&T Machine Learning Intern"
const tags = ["Machine Learning", "Product Management", "Data Analysis", "System Architecture"]

export default function ApplePage() {
  const [visibleSections, setVisibleSections] = useState<string[]>([])

  const sections = [
    {
      id: 'problem',
      title: 'The Problem',
      icon: '🔍',
      content: (
        <div className="space-y-6">
          <p className="text-gray-300 leading-relaxed text-lg">
            For a company renowned for its design, counterfeiting is a huge problem. Fake Airpods alone have cost Apple a reported 
            <span className="text-red-400 font-semibold"> $3.2 billion USD</span> in the last 9 months alone according to a US customs report.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Counterfeit products also pose a safety risk when considering products like chargers, and consequently the experience 
            that users have with the products they should love.
          </p>
        </div>
      )
    },
    {
      id: 'research',
      title: 'Research',
      icon: '🔬',
      content: (
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                👉 <span>Steps Taken</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                  Researched the scale of the problem
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                  Identify platforms and patterns of counterfeit sellers
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                  Explored limitations of current system for handling these issues
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                  Liaised with relevant teams to get their insight into the issue
                </li>
              </ol>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Given the open-ended brief and the time limitation, it was important to hone in on what specific aspect I would be looking to solve. 
              This required me to understand the scope of the issue through research and networking.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Once the pipeline of the current process was identified, the next step was to identify whereabouts in the pipeline I could offer a solution.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'ideation',
      title: 'Ideation',
      icon: '💡',
      content: (
        <div className="space-y-6">
          <p className="text-gray-300 leading-relaxed">
            Given the ongoing deployment of the system, I cannot share the specific details of the solution. However, on a high level, 
            the ideation involved looking at how I could refine the existing pipeline and make it more efficient.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Various solutions were explored looking at various sections in the pipeline. All in all, the concepts were assessed on the 
            following characteristics that were identified as being essential:
          </p>
          
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50">
            <CardContent className="p-8 text-center">
              <blockquote className="text-2xl font-bold text-white">
                Faster, easier, scalable, secure, integrated, automated
              </blockquote>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'mvp',
      title: 'MVP Development',
      icon: '🏗️',
      content: (
        <div className="space-y-8">
          <div className="relative">
            <Image 
              src="/assets/apple_architecture.png" 
              alt="System Architecture"
              width={800}
              height={600}
              className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl border border-gray-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-green-400 text-lg">React Frontend</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Modern, responsive user interface with accessibility standards</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-blue-400 text-lg">Flask Backend</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Scalable web server with ML processing capabilities</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-purple-400 text-lg">RabbitMQ Workers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Distributed processing system for data analysis</p>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-gray-300 leading-relaxed">
            Having researched the various possible ways to present and test a solution, I settled on developing a React application 
            with a Flask web server and RabbitMQ worker system. This allows the MVP to be scalable while offering the native data 
            processing and machine learning capabilities that the Python worker script can offer.
          </p>
        </div>
      )
    },
    {
      id: 'outcome',
      title: 'Outcome',
      icon: '🎯',
      content: (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Project Presentation</h4>
              <p className="text-gray-300 leading-relaxed mb-4">
                The project culminated in a Keynote presented to senior directors. This showcased both the development of the tool 
                along with the roadmap to expand its use cases to other tasks within the infrastructure.
              </p>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Handover & Impact</h4>
              <p className="text-gray-300 leading-relaxed mb-4">
                The handover process combined with effective networking was able to bring together technical and operational teams 
                to ensure that the project would be supported and continued beyond the internship.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <Badge variant="outline" className="border-green-400 text-green-400 px-4 py-2">✅ MVP Completed</Badge>
            <Badge variant="outline" className="border-blue-400 text-blue-400 px-4 py-2">📈 Scalable Architecture</Badge>
            <Badge variant="outline" className="border-purple-400 text-purple-400 px-4 py-2">🤝 Cross-team Collaboration</Badge>
            <Badge variant="outline" className="border-yellow-400 text-yellow-400 px-4 py-2">🚀 Production Ready</Badge>
          </div>
        </div>
      )
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleSections(prev => {
        if (prev.length < sections.length) {
          return [...prev, sections[prev.length].id]
        }
        clearInterval(timer)
        return prev
      })
    }, 300)

    return () => clearInterval(timer)
  }, [sections.length])

  return (
    <div className="min-h-screen bg-black">
      <ProjectIntro
        name="Apple Internship"
        date="2021"
        id="apple"
        description={description}
        tags={tags}
      />
      
      <SideQuickNav/>
      
      {/* Role & Description Cards */}
      <div className="px-4 lg:px-[20%] py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{description}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50">
            <CardHeader>
              <CardTitle className="text-white">My Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-400 font-semibold">{role}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="px-4 lg:px-[10%] space-y-16 pb-16">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`transition-all duration-1000 ${
              visibleSections.includes(section.id)
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="mb-8">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 flex items-center gap-4">
                <span className="text-4xl">{section.icon}</span>
                {section.title}
              </h2>
              <Separator className="w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 border-0" />
            </div>
            
            <div className="max-w-6xl mx-auto">
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}