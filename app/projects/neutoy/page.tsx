// app/projects/neutoy/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ProjectIntro from '@/components/projects/ProjectIntro'
import SideQuickNav from '@/components/projects/SideQuickNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const description = "Lead a team of engineers, designers and personal trainers in developing a new interactive health tool using computer vision"
const role = "Product Manager"
const tags = ["Computer Vision", "Health Tech", "Product Management", "Team Leadership"]

export default function NeutoyPage() {
  const [visibleSections, setVisibleSections] = useState<string[]>([])

  const sections = [
    {
      id: 'problem',
      title: 'The Problem',
      icon: '🎯',
      content: (
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-gray-300 leading-relaxed text-lg">
            Health and fitness tools have often required large or expensive systems to be purchased. Even with the use of wearables 
            or trackers they exhibit <span className="text-red-400 font-semibold">poor adoption and continued usage</span>. 
            We wanted to explore ways to bring health solutions right to users.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">💰</div>
                <h4 className="text-white font-semibold mb-2">Expensive Equipment</h4>
                <p className="text-gray-400 text-sm">Traditional fitness tools require significant investment</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">📱</div>
                <h4 className="text-white font-semibold mb-2">Poor Adoption</h4>
                <p className="text-gray-400 text-sm">Wearables and apps show low long-term engagement</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">🏠</div>
                <h4 className="text-white font-semibold mb-2">Accessibility</h4>
                <p className="text-gray-400 text-sm">Need solutions that come to users at home</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'research',
      title: 'Market Research',
      icon: '📊',
      content: (
        <div className="space-y-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold text-white mb-4">Target Market Analysis</h4>
              <p className="text-gray-300 leading-relaxed mb-6">
                We conducted surveys and interviews with various age-ranges of office workers to find out their current exercise trends. 
                Our research showed that most ages do not seek professional exercise services, other than those over 50, and that in most 
                age ranges, a considerable amount of exercise carried out is simple stretching.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                  <span className="text-gray-300">40-49 age group shows highest opportunity</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                  <span className="text-gray-300">High exercise frequency but low effectiveness</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-purple-400 rounded-full"></span>
                  <span className="text-gray-300">Technology adoption is comfortable</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                  <span className="text-gray-300">Experience workplace-related pains</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
              <h5 className="text-lg font-semibold text-white mb-4">Key Findings</h5>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</span>
                  <span className="text-gray-300">Develops pains and aches from lack of exercise more frequently</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</span>
                  <span className="text-gray-300">Tries to exercise regularly but struggles with consistency</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</span>
                  <span className="text-gray-300">Generally able to use technology comfortably</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-400 text-black rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</span>
                  <span className="text-gray-300">Feels current methods are ineffective</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'mvp',
      title: 'MVP Development',
      icon: '🛠️',
      content: (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <p className="text-gray-300 leading-relaxed text-lg max-w-4xl mx-auto">
              I became involved in the project at a time where the technologies that were to be used were somewhat decided. 
              In order to make the uptake as easy as possible we wanted to use a platform which many were familiar with; the website.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>🤲</span> Hand Exercises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Interactive computer vision exercises for hand and wrist mobility</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-900/30 to-blue-900/30 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>💪</span> Neck Exercises
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Guided exercises for neck pain relief with real-time feedback</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>👁️</span> Computer Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">Open-source CV techniques for motion tracking and interaction</p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-8 border border-blue-500/30">
            <h4 className="text-2xl font-bold text-white mb-4 text-center">Interactive Demonstrations</h4>
            <p className="text-gray-300 leading-relaxed text-center">
              Working with exercise professionals meant we were able to shortlist a few exercises that focus on hand, wrist and neck pains. 
              A key unique selling point of our project was to incorporate open-source computer vision techniques allowed us to ideate and 
              consequently develop some interaction into the website with the aim of making these simple exercises intuitive and fun.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'pivot',
      title: 'Strategic Pivot',
      icon: '🔄',
      content: (
        <div className="space-y-8">
          <div className="text-center">
            <Card className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500/50 max-w-3xl mx-auto">
              <CardContent className="p-8">
                <div className="text-6xl mb-4">👉</div>
                <blockquote className="text-2xl font-bold text-white mb-4">
                  &quot;The interactive experience was unique and fun, but the exercises were insignificant&quot;
                </blockquote>
                <p className="text-gray-300">Key feedback from preliminary user testing</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>📊</span> Before Pivot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Focus on simple exercises
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Limited user engagement
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Perceived low impact
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>🎯</span> After Pivot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Interactive experience focus
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Unique value proposition
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Scalable platform approach
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-gray-300 leading-relaxed text-lg max-w-4xl mx-auto">
              Thus, as a team, we decided to make an important pivot in our objectives; focus on building out the unique interactive experience 
              that users found engaging, rather than limiting ourselves to basic exercises.
            </p>
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
        name="Neutoy"
        date="2020-21"
        id="neutoy"
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
          
          <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-white">My Role</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-400 font-semibold">{role}</p>
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
              <Separator className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 border-0" />
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