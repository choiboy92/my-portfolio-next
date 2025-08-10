// app/projects/jsviewhkl/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ProjectIntro from '@/components/projects/ProjectIntro'
import SideQuickNav from '@/components/projects/SideQuickNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Award, Trophy, Target, ExternalLink } from 'lucide-react'

const description = "Tasked with researching x-ray crystallography data storage and software methods and exploring the degree to which functionality could be replicated in a modern day platform"
const role = "Nuffield Research Placement in the Scientific Computing Department"
const tags = ["Web Development", "Scientific Computing", "Data Visualization", "Research", "JavaScript"]

export default function JsviewhklPage() {
  const [visibleSections, setVisibleSections] = useState<string[]>([])

  const sections = [
    {
      id: 'problem',
      title: 'The Problem',
      icon: '🔬',
      content: (
        <div className="space-y-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <p className="text-gray-300 leading-relaxed text-lg">
              X-ray crystallography is an important scientific method used in discerning structures of a crystal. 
              This analysis often produces a large amount of data that needs to be manipulated before presenting to the user.
            </p>
            <p className="text-gray-300 leading-relaxed text-lg">
              However, despite the software intensive nature of the process, data formats, processing and visualisation 
              methods poses some significant issues:
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border-red-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  ⏰ <span>Outdated Technology</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  File formats and desktop programs from <strong className="text-red-400">1989</strong> are still being used in modern scientific workflows.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  💻 <span>Client Dependencies</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Difficult to track data changes, dependent on access to a desktop with the program installed.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Image 
              src="/assets/Nuffield_mtz_datafile_ex.png" 
              alt="MTZ file format example"
              width={800}
              height={600}
              className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl border border-gray-700"
            />
            <p className="text-gray-400 text-sm mt-4">Example of legacy MTZ data file format still in use</p>
          </div>
        </div>
      )
    },
    {
      id: 'solution',
      title: 'My Solution',
      icon: '💡',
      content: (
        <div className="space-y-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <p className="text-gray-300 leading-relaxed text-lg">
              Working under the guidance of my mentor, I researched the issues behind the current method and devised my simple solution:
            </p>
            
            <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50 max-w-3xl mx-auto">
              <CardContent className="p-8">
                <div className="text-4xl mb-4">🎯</div>
                <blockquote className="text-2xl font-bold text-white mb-4">
                  &quot;Prototype one aspect of the application in a dynamic website format&quot;
                </blockquote>
                <p className="text-green-400">Modern web-based approach to crystallography visualization</p>
              </CardContent>
            </Card>

            <p className="text-gray-300 leading-relaxed">
              The aspect I chose was the <strong className="text-blue-400">ViewHKL portion</strong> of the application wherein the diffraction pattern 
              could be visualised in h, k, and l planes. HTML, CSS, jQuery and JavaScript were used in developing the prototype 
              in 3 weeks, all of which I had to learn from scratch.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { tech: 'HTML5', desc: 'Structure and semantic markup', color: 'from-orange-400 to-red-400' },
              { tech: 'CSS3', desc: 'Modern styling and layouts', color: 'from-blue-400 to-purple-400' },
              { tech: 'jQuery', desc: 'DOM manipulation and events', color: 'from-yellow-400 to-orange-400' },
              { tech: 'JavaScript', desc: 'Data visualization logic', color: 'from-green-400 to-blue-400' }
            ].map((tech, index) => (
              <Card key={index} className="bg-gray-900/50 border-gray-700 text-center">
                <CardContent className="p-4">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-r ${tech.color} flex items-center justify-center text-black font-bold`}>
                    {tech.tech.charAt(0)}
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-2">{tech.tech}</h4>
                  <p className="text-gray-400 text-xs">{tech.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'comparison',
      title: 'Comparing Old to New',
      icon: '🔄',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <Image 
              src="/assets/jsViewHKL_comparison.png" 
              alt="Comparison between old desktop app and new web interface"
              width={1000}
              height={700}
              className="w-full max-w-5xl mx-auto rounded-xl shadow-2xl border border-gray-700"
            />
            <p className="text-gray-400 text-sm mt-4">Side-by-side comparison showing functionality parity with improved user experience</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-red-900/20 to-gray-900/20 border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  💾 <span>Legacy Desktop Application</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    1989 codebase with limited updates
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Requires specific desktop installation
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    No version control or collaboration features
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Limited accessibility and platform support
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🌐 <span>Modern Web Application</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Cross-platform compatibility
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    No installation required, browser-based
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Easy data sharing and collaboration
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Modern, intuitive user interface
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'results',
      title: 'Results & Recognition',
      icon: '🏆',
      content: (
        <div className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50 text-center">
              <CardContent className="p-8">
                <Target className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h4 className="text-white font-bold text-lg mb-2">Prototype Completed</h4>
                <p className="text-gray-300 text-sm">
                  Proved and tested a working prototype that replicated the functionality and insight of ViewHKL
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50 text-center">
              <CardContent className="p-8">
                <Award className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                <h4 className="text-white font-bold text-lg mb-2">Gold Crest Award</h4>
                <p className="text-gray-300 text-sm">
                  Awarded Gold Crest Award for research report demonstrating scientific rigor and innovation
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50 text-center">
              <CardContent className="p-8">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h4 className="text-white font-bold text-lg mb-2">Big Bang Finalist</h4>
                <p className="text-gray-300 text-sm">
                  Finalist at Big Bang Young Scientists of the Year 2018 competition
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h4 className="text-2xl font-bold text-white mb-4 text-center">Future Impact</h4>
              <p className="text-gray-300 leading-relaxed text-center">
                Hopefully, by proving its applicability on a web platform, my project will allow future development of the 
                web-based version of the desktop application to be successful and aid future programmers to make improvements 
                on my prototype, which will no doubt be needed. In the end, the best result would be that my project was used 
                to aid future crystallographers in making better and easier analysis of protein crystal structures, hopefully 
                using it to develop new drugs that could be used in medical applications.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Technical Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Development Time:</span>
                    <Badge className="bg-green-500 text-black">3 weeks</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Technologies Learned:</span>
                    <Badge className="bg-blue-500 text-white">4 new tools</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Functionality Replicated:</span>
                    <Badge className="bg-purple-500 text-white">100%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Project Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <a 
                    href="https://example.com/jsviewhkl-demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Live Demo
                  </a>
                  <a 
                    href="https://example.com/research-paper"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Read Research Paper
                  </a>
                  <a 
                    href="https://example.com/crest-award"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm"
                  >
                    <Award className="w-4 h-4" />
                    View Award Certificate
                  </a>
                </div>
              </CardContent>
            </Card>
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
        name="X-ray Crystallography"
        date="2017"
        id="jsviewhkl"
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
          
          <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50">
            <CardHeader>
              <CardTitle className="text-white">Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-400 font-semibold text-sm">{role}</p>
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
              <Separator className="w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 border-0" />
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