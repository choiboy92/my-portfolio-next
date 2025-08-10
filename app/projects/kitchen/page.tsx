// app/projects/kitchen/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ProjectIntro from '@/components/projects/ProjectIntro'
import SideQuickNav from '@/components/projects/SideQuickNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const description = "Tasked with designing an object within the home that makes a specific task easier and/or improves wellbeing and quality of life. Our team looked at making the kitchen a more accessible space"
const role = "Project Team Leader"
const tags = ["Product Design", "Accessibility", "User Research", "Prototyping"]

export default function KitchenPage() {
  const [visibleSections, setVisibleSections] = useState<string[]>([])

  const sections = [
    {
      id: 'problem',
      title: 'The Problem',
      icon: '🏠',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <Image 
              src="/assets/kitchen/Kitchen_space_infographic_final.jpeg" 
              alt="Kitchen Space Infographic"
              width={800}
              height={600}
              className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl border border-gray-700"
            />
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-300 leading-relaxed text-lg">
              With growing population density in cities and multi-functionality in how the kitchen space is being used, 
              kitchens have largely <span className="text-red-400 font-semibold">not evolved over the last 50 years</span>. 
              We saw this as both a problem and an opportunity; how can we better suit the use cases and accessibility 
              needs of the modern kitchen user.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'research',
      title: 'Understanding the Modern Kitchen User',
      icon: '👥',
      content: (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-300 leading-relaxed mb-6">
                User research and surveys were conducted especially concentrated on the <strong className="text-green-400">19-29 age range</strong> of 
                young adults that typically make up a large proportion of city populations. Our research tried to quantify 
                living conditions and identify areas within the home that users felt was inaccessible.
              </p>
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-500/50">
                <h4 className="text-xl font-bold text-white mb-4">Key Finding</h4>
                <p className="text-blue-400 font-semibold text-lg">32.3% of users found the kitchen to be the most inaccessible room</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Image 
                src="/assets/kitchen/user_research.png" 
                alt="User Research Results"
                width={400}
                height={300}
                className="rounded-lg shadow-lg border border-gray-700"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  📦 <span>Cluttered</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Items difficult to store, often stacked making them disorganized and inaccessible</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  🔄 <span>Infrequent Use</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Irregular kitchen use meant poor organization methods and items building up</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  🏠 <span>Users as Tenants</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Renters limited in permanent solutions requiring drilling and installation</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  ⚙️ <span>Limited Multi-functionality</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Storage solutions not evolving with modern kitchen multi-functionality trends</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'ideation',
      title: 'Ideation Process',
      icon: '💡',
      content: (
        <div className="space-y-6">
          <p className="text-gray-300 leading-relaxed text-lg max-w-4xl mx-auto text-center">
            Brainstorming a range of ideas, they were categorised and whittled down into three overall designs. 
            They were then evaluated based on factors such as how well it solves the problem, ease of implementation 
            and design and the potential impact of the design.
          </p>
          
          <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50 max-w-3xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h4 className="text-2xl font-bold text-white mb-4">Final Concept</h4>
              <p className="text-green-400 text-lg">
                Modular cupboard hook storage system that makes readily used items more accessible 
                and fits the diverse needs of the modern kitchen user.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'prototyping',
      title: 'Design & Prototyping',
      icon: '🛠️',
      content: (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="relative">
                <Image 
                  src="/assets/kitchen/attachment_test.gif" 
                  alt="Attachment mechanism prototype"
                  width={400}
                  height={300}
                  className="w-full rounded-lg shadow-lg border border-gray-700"
                />
              </div>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Attachment Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Various attachment methods were designed and tested using preliminary prototypes made out of cardboard.</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <div className="relative">
                <Image 
                  src="/assets/kitchen/cutlery_drying.jpg" 
                  alt="Cutlery holder prototype"
                  width={400}
                  height={300}
                  className="w-full rounded-lg shadow-lg border border-gray-700"
                />
              </div>
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Modular Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Once the attachment mechanism was developed, various other modular mechanisms could be designed and prototyped.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Simple Backboard Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">Simplicity in design of the backboard was key. A simple hook mechanism based off kitchen cupboard design standards made the modular holder secure and stable.</p>
                </CardContent>
              </Card>
              <div className="relative">
                <Image 
                  src="/assets/kitchen/backboard.jpg" 
                  alt="Backboard prototype"
                  width={400}
                  height={300}
                  className="w-full rounded-lg shadow-lg border border-gray-700"
                />
              </div>
            </div>
            
            <div className="flex justify-center items-center">
              <Image 
                src="/assets/kitchen/Hooked_illustration.png" 
                alt="Hook design illustration"
                width={300}
                height={400}
                className="rounded-lg shadow-lg border border-gray-700"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'refining',
      title: 'Refining the Design',
      icon: '🔧',
      content: (
        <div className="space-y-8">
          <p className="text-gray-300 leading-relaxed text-lg max-w-4xl mx-auto text-center">
            Prototyping helped us identify key limitations in our design early on. Notably aspects such as sliding 
            of the backboard and dust and spills off countertops potentially hitting the items, which was solved 
            by implementing rubber feet and designing a splash hood respectively.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🦶 <span>Rubber Feet Solution</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Image 
                  src="/assets/kitchen/rubberfeet.jpg" 
                  alt="Rubber feet added to prevent sliding"
                  width={300}
                  height={200}
                  className="w-full rounded-lg shadow-lg border border-gray-600"
                />
                <p className="text-gray-300 text-sm">Added rubber feet to prevent sliding of the backboard during use</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🛡️ <span>Splash Hood Design</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Image 
                  src="/assets/kitchen/hood.jpg" 
                  alt="Hood design to protect from spills"
                  width={300}
                  height={200}
                  className="w-full rounded-lg shadow-lg border border-gray-600"
                />
                <p className="text-gray-300 text-sm">Designed splash hood to protect stored items from countertop spills and dust</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'final',
      title: 'Final Design',
      icon: '🏆',
      content: (
        <div className="space-y-8">
          <div className="grid gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <Image 
                src="/assets/kitchen/Final_front_render.jpg" 
                alt="Final design front render"
                width={800}
                height={600}
                className="w-full rounded-xl shadow-2xl border border-gray-700"
              />
            </div>
            <div className="relative">
              <Image 
                src="/assets/kitchen/Hook_design.jpg" 
                alt="Final hook design render"
                width={800}
                height={600}
                className="w-full rounded-xl shadow-2xl border border-gray-700"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🔧</div>
                <h4 className="text-white font-semibold mb-2">Modular System</h4>
                <p className="text-gray-300 text-sm">Adaptable to different kitchen layouts and user needs</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h4 className="text-white font-semibold mb-2">Renter Friendly</h4>
                <p className="text-gray-300 text-sm">No permanent installation required, perfect for tenants</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">♿</div>
                <h4 className="text-white font-semibold mb-2">Accessible Design</h4>
                <p className="text-gray-300 text-sm">Makes kitchen items more accessible and organized</p>
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
        name="Accessible Kitchens"
        date="2020"
        id="kitchen"
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
          
          <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50">
            <CardHeader>
              <CardTitle className="text-white">My Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-400 font-semibold">{role}</p>
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